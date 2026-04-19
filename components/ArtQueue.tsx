import React, { useState, useEffect } from 'react';
import {
  Palette, Plus, Check, Clock, CheckCircle2, Circle, Search,
  Image as ImageIcon, Hash, ChevronDown, ChevronUp, X, Save, Trash2, User,
  FileText, AlertCircle, FileCode, Upload, Download, Loader2, ListOrdered
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { orderService } from '../services/orderService';

interface ArtEntry {
  id: string;
  client_name: string;
  order_reference?: string;
  layout_revision?: string;
  notes?: string;
  layout_url?: string;
  art_created: boolean;
  art_awaiting_approval: boolean;
  art_approved: boolean;
  created_at: string;
  order_id?: string;
  orders?: {
    design_file_urls?: string[];
    ready_file_urls?: string[];
    order_items?: any[];
  };
}

const emptyForm = {
  client_name: '',
  order_reference: '',
  layout_revision: '',
  notes: '',
  layout_url: '',
};

const ArtQueue: React.FC = () => {
  const [entries, setEntries] = useState<ArtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('art_queue')
        .select(`
          *,
          orders(
            id,
            design_file_urls,
            ready_file_urls,
            order_items(product_name, fabric_name, grade_label, size, quantity)
          )
        `)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setEntries(data || []);
    } catch (e) {
      console.error('Erro ao carregar fila de arte:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement('canvas');
    const img = document.createElement('img');
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.onload = () => {
        const MAX = 900;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setForm(f => ({ ...f, layout_url: dataUrl }));
        setImagePreview(dataUrl);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.client_name.trim()) { alert('Informe o nome do cliente.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('art_queue').insert({
        client_name: form.client_name.trim().toUpperCase(),
        order_reference: form.order_reference.trim() || null,
        layout_revision: form.layout_revision.trim() || null,
        notes: form.notes.trim() || null,
        layout_url: form.layout_url || null,
        art_created: false,
        art_awaiting_approval: false,
        art_approved: false,
      });
      if (error) throw error;
      setForm(emptyForm);
      setImagePreview('');
      setShowForm(false);
      loadEntries();
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar arte.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (entry: ArtEntry, field: 'art_created' | 'art_awaiting_approval' | 'art_approved') => {
    const newValue = !entry[field];
    const updates: any = { [field]: newValue };
    if (field === 'art_created' && !newValue) {
      updates.art_awaiting_approval = false;
      updates.art_approved = false;
    }
    if (field === 'art_awaiting_approval' && !newValue) {
      updates.art_approved = false;
    }
    try {
      const { error } = await supabase.from('art_queue').update(updates).eq('id', entry.id);
      if (error) throw error;
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updates } : e));
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status.');
    }
  };

  const handleRevision = async (entry: ArtEntry, value: string) => {
    try {
      await supabase.from('art_queue').update({ layout_revision: value }).eq('id', entry.id);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, layout_revision: value } : e));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta arte da fila?')) return;
    setDeletingId(id);
    try {
      await supabase.from('art_queue').delete().eq('id', id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao remover.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadReadyFile = async (e: React.ChangeEvent<HTMLInputElement>, entry: ArtEntry) => {
    const file = e.target.files?.[0];
    if (!file || !entry.order_id) return;
    setUploadingOrder(entry.id);
    try {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      console.log(`[Upload Ready] Enviando: ${file.name} (${sizeMB}MB)`);
      const url = await orderService.uploadFile(file, `ready-files/${Date.now()}`);

      // Get existing ready files from the orders array
      const existingUrls = entry.orders?.ready_file_urls || [];
      const newUrls = [...existingUrls, url];

      // Update Order directly
      await supabase.from('orders').update({ ready_file_urls: newUrls }).eq('id', entry.order_id);

      // Refresh data
      await loadEntries();
      alert('✅ Arquivo Final recebido com sucesso e vinculado à Produção!');
    } catch (err: any) {
      console.error(err);
      alert(`Erro no upload: ${err?.message || 'Falha na conexão.'}`);
    } finally {
      setUploadingOrder(null);
      e.target.value = '';
    }
  };

  const filtered = entries.filter(e =>
    !search ||
    e.client_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.order_reference || '').toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter(e => !e.art_created);
  const inProgress = filtered.filter(e => e.art_created && !e.art_awaiting_approval);
  const awaiting = filtered.filter(e => e.art_created && e.art_awaiting_approval && !e.art_approved);
  const approved = filtered.filter(e => e.art_approved);

  const columns = [
    { id: 'pending', label: 'Aguardando Arte', color: 'text-slate-400', bg: 'bg-slate-800/20', border: 'border-slate-700/40', dot: 'bg-slate-500', items: pending },
    { id: 'inProgress', label: 'Arte Criada', color: 'text-indigo-400', bg: 'bg-indigo-900/10', border: 'border-indigo-700/30', dot: 'bg-indigo-500', items: inProgress },
    { id: 'awaiting', label: 'Aguard. Aprovação', color: 'text-amber-400', bg: 'bg-amber-900/10', border: 'border-amber-700/30', dot: 'bg-amber-500', items: awaiting },
    { id: 'approved', label: 'Arte Aprovada', color: 'text-emerald-400', bg: 'bg-emerald-900/10', border: 'border-emerald-700/30', dot: 'bg-emerald-500', items: approved },
  ];

  const renderCard = (entry: ArtEntry) => {
    const isOpen = expandedId === entry.id;
    return (
      <div key={entry.id} className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-indigo-500/40' : 'border-slate-800 hover:border-slate-700'}`}>
        <button
          className="w-full p-4 text-left flex items-start justify-between gap-3"
          onClick={() => setExpandedId(isOpen ? null : entry.id)}
        >
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-slate-200 text-sm truncate">{entry.client_name}</h4>
            {entry.order_reference && (
              <p className="text-[9px] text-indigo-400 font-bold mt-0.5">Ref: {entry.order_reference}</p>
            )}
            <p className="text-[8px] text-slate-600 mt-0.5">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {entry.layout_revision && (
              <span className="text-[8px] font-black text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                Rev.{entry.layout_revision}
              </span>
            )}
            {entry.art_created && <span className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-indigo-400" /></span>}
            {entry.art_awaiting_approval && <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center"><Clock className="w-2.5 h-2.5 text-amber-400" /></span>}
            {entry.art_approved && <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /></span>}
            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-slate-800 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {entry.layout_url && (
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3" /> Layout Original
                </p>
                <img src={entry.layout_url} alt="Layout" className="w-full max-h-40 object-contain p-2" />
              </div>
            )}

            {entry.notes && (
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 text-xs text-slate-400">
                <p className="text-[9px] font-black uppercase text-slate-500 mb-2">Observações / Briefing:</p>
                <div className="whitespace-pre-line leading-relaxed">{entry.notes}</div>
              </div>
            )}

            {/* Integração com Pedido (Lista de Itens) */}
            {entry.orders && entry.orders.order_items && entry.orders.order_items.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                 <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-1">
                    <ListOrdered className="w-3 h-3" /> Itens Oficiais do Pedido
                 </p>
                 <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                   {entry.orders.order_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
                        <span className="text-slate-300 font-bold truncate pr-2" title={item.product_name}>{item.product_name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500 uppercase">{item.grade_label}</span>
                          <span className="bg-slate-800 text-slate-300 px-1.5 rounded font-mono">{item.size}</span>
                          <span className="text-indigo-400 font-black">x{item.quantity}</span>
                        </div>
                      </div>
                   ))}
                 </div>
              </div>
            )}

            {/* Integração com Pedido (Download Arquivo Fonte) */}
            {entry.orders && entry.orders.design_file_urls && entry.orders.design_file_urls.length > 0 && (
              <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-3">
                 <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1">
                    <FileCode className="w-3 h-3" /> Arquivos Fonte do Cliente
                 </p>
                 <div className="space-y-1">
                   {entry.orders.design_file_urls.map((url: string, idx: number) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 p-2 rounded-lg transition-colors group">
                         <span className="text-[10px] text-slate-300 font-medium truncate pr-2">Acessar Arquivo (Download)</span>
                         <Download className="w-3.5 h-3.5 text-amber-500/70 group-hover:text-amber-400" />
                      </a>
                   ))}
                 </div>
              </div>
            )}

            {/* Integração com Pedido (Upload Arte Pronta P/ Produção) */}
            {entry.orders && (
              <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-3">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Finalização (Arte Pronta P/ Impressão)
                    </p>
                 </div>
                 
                 <div className="mb-3 space-y-1">
                    {(entry.orders.ready_file_urls || []).map((url: string, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-emerald-950/30 px-2 py-1.5 rounded border border-emerald-900/50">
                            <span className="text-emerald-400/80 font-bold truncate pr-2">Arte Pronta {idx + 1}</span>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-300 font-black uppercase">Ver</a>
                        </div>
                    ))}
                 </div>

                 <label className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all cursor-pointer text-[10px] font-black uppercase tracking-widest ${uploadingOrder === entry.id ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-500 hover:bg-emerald-500/20'}`}>
                    {uploadingOrder === entry.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                    ) : (
                        <><Upload className="w-3.5 h-3.5" /> Subir Arquivo Finalizado (WinRAR / ZIP / PDF)</>
                    )}
                    <input type="file" className="hidden" disabled={uploadingOrder === entry.id} onChange={(e) => handleUploadReadyFile(e, entry)} />
                 </label>
              </div>
            )}

            {/* Revision */}
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Hash className="w-3 h-3" /> Nº Layout / Revisão</label>
              <input
                type="text"
                placeholder="Ex: LAYOUT 01, REV 02..."
                defaultValue={entry.layout_revision || ''}
                onBlur={e => handleRevision(entry, e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 uppercase focus:outline-none focus:border-indigo-500 transition-all placeholder:normal-case placeholder:font-normal placeholder:text-slate-600"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              {[
                { field: 'art_created' as const, label: 'Arte Criada', sub: 'Designer finalizou a arte', color: 'indigo', requires: null },
                { field: 'art_awaiting_approval' as const, label: 'Aguardando Aprovação', sub: 'Arte enviada ao cliente', color: 'amber', requires: 'art_created' },
                { field: 'art_approved' as const, label: 'Arte Aprovada', sub: 'Cliente aprovou o layout', color: 'emerald', requires: 'art_awaiting_approval' },
              ].map(({ field, label, sub, color, requires }) => {
                const disabled = requires ? !entry[requires as keyof ArtEntry] : false;
                const active = entry[field];
                return (
                  <button
                    key={field}
                    disabled={!!disabled}
                    onClick={() => !disabled && handleToggle(entry, field)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800' :
                      active ? `bg-${color}-600/10 border-${color}-500/40` : 'bg-slate-950 border-slate-700 hover:border-slate-600'}`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${active ? `bg-${color}-600 border-${color}-500` : 'border-slate-600'}`}>
                      {active && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${active ? `text-${color}-300` : 'text-slate-400'}`}>{label}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDelete(entry.id)}
              disabled={deletingId === entry.id}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-900/40 text-rose-500 hover:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remover da Fila
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
              <Palette className="w-5 h-5 text-white" />
            </div>
            Fila de Arte
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">Cadastre e acompanhe o status de criação e aprovação de artes</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          {[
            { label: 'Pendentes', val: pending.length, color: 'text-slate-300' },
            { label: 'Em Criação', val: inProgress.length, color: 'text-indigo-400' },
            { label: 'Em Aprovação', val: awaiting.length, color: 'text-amber-400' },
            { label: 'Aprovadas', val: approved.length, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-center">
              <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}

          <button
            onClick={() => { setShowForm(true); setForm(emptyForm); setImagePreview(''); }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Arte
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
        <input
          type="text"
          placeholder="Pesquisar por cliente ou referência..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-5 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm placeholder:font-normal placeholder:text-slate-600"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-600 font-bold">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {columns.map(col => (
            <div key={col.id} className={`rounded-3xl border ${col.border} ${col.bg} overflow-hidden`}>
              <div className="p-4 border-b border-slate-800/50 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest flex-1 ${col.color}`}>{col.label}</h3>
                <span className={`text-xs font-black ${col.color} bg-slate-900/50 px-2 py-0.5 rounded-lg`}>{col.items.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[180px]">
                {col.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-700 opacity-50">
                    <Circle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Vazio</p>
                  </div>
                ) : col.items.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Art Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg border border-slate-800 shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 uppercase tracking-tighter">Nova Arte</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cadastrar na Fila</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Client */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User className="w-3 h-3" /> Nome do Cliente *</label>
                <input
                  type="text"
                  placeholder="Nome completo do cliente"
                  value={form.client_name}
                  onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 uppercase focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:normal-case placeholder:font-normal placeholder:text-slate-600"
                  autoFocus
                />
              </div>

              {/* Order reference */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Referência / Pedido (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: #1234, Nome do projeto..."
                  value={form.order_reference}
                  onChange={e => setForm(f => ({ ...f, order_reference: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-600"
                />
              </div>

              {/* Layout number */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Hash className="w-3 h-3" /> Nº do Layout / Revisão</label>
                <input
                  type="text"
                  placeholder="Ex: LAYOUT 01, REV 03..."
                  value={form.layout_revision}
                  onChange={e => setForm(f => ({ ...f, layout_revision: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 uppercase focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:normal-case placeholder:font-normal placeholder:text-slate-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Observações</label>
                <textarea
                  placeholder="Detalhes da arte, cores, medidas..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-600"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Imagem do Layout (opcional)</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700">
                    <img src={imagePreview} className="w-full max-h-48 object-contain bg-slate-950" />
                    <button
                      onClick={() => { setImagePreview(''); setForm(f => ({ ...f, layout_url: '' })); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-rose-600 rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 cursor-pointer transition-all bg-slate-950 group">
                    <ImageIcon className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    <p className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">Clique para adicionar imagem</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3.5 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.client_name.trim()}
                className="flex-2 flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Cadastrar Arte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtQueue;
