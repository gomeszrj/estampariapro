import React, { useState, useMemo, useCallback } from 'react';
import { Search, UserPlus, Edit2, Phone, Mail, Trash2, X, Save, User, ShoppingBag, CreditCard, Clock, Calendar, AlertTriangle, ArrowRight, Wallet, Globe, Package, Lock, ShoppingCart, DollarSign, ChartBar, CheckCircle2, Download } from 'lucide-react';
import { Client, Order, OrderStatus, CatalogOrder } from '../types';
import { clientService } from '../services/clientService';
import { catalogOrderService } from '../services/catalogOrderService';
import { notify } from './ui/toast';
import { ConfirmModal } from './ui/ConfirmModal';

interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  orders: Order[];
}

const Clients: React.FC<ClientsProps> = ({ clients, setClients, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [profileTab, setProfileTab] = useState<'active' | 'history' | 'info' | 'catalog'>('active');
  const [clientCatalogOrders, setClientCatalogOrders] = useState<CatalogOrder[]>([]);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<{id: string; name: string; orderCount: number} | null>(null);

  // === HIGH PERFORMANCE MEMOIZATION ===
  // Congelando listas pesadas para a barra de pesquisa não travar o sistema
  
  const safeClients = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);
  const safeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);

  // Pré-calculando totais financeiros de todos os clientes UMA ÚNICA VEZ
  const clientsDataMap = useMemo(() => {
    const map = new Map();
    safeClients.forEach(c => {
      map.set(c.id, { totalSpent: 0, orderCount: 0, lastOrderDate: null, lastOrderMs: 0 });
    });

    safeOrders.forEach(o => {
      if (o.clientId && map.has(o.clientId)) {
        const data = map.get(o.clientId);
        data.totalSpent += (o.totalValue || 0);
        data.orderCount += 1;
        const orderTime = new Date(o.createdAt).getTime();
        if (orderTime > data.lastOrderMs) {
          data.lastOrderMs = orderTime;
          data.lastOrderDate = new Date(o.createdAt).toLocaleDateString('pt-BR');
        }
      }
    });
    return map;
  }, [safeClients, safeOrders]);

  // Filtro Instantâneo
  const filteredClients = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return safeClients;
    return safeClients.filter(c =>
      (c.name || '').toLowerCase().includes(searchLower) ||
      (c.email || '').toLowerCase().includes(searchLower) ||
      (c.whatsapp || '').toLowerCase().includes(searchLower) ||
      (c.document || '').toLowerCase().includes(searchLower)
    );
  }, [safeClients, searchTerm]);

  // Cálculos dos 5 Cartões Estatísticos
  const metrics = useMemo(() => {
    const totalClients = safeClients.length;
    let ativos = 0;
    let novosEsteMes = 0;
    let faturamentoMes = 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    safeClients.forEach(c => {
      const d = clientsDataMap.get(c.id);
      if (d && d.orderCount > 0) ativos++;
      
      // Checar se foi criado este mês (Se não tiver createdAt no Client, usa o primeiro pedido)
      const clientCreated = c.createdAt ? new Date(c.createdAt).getTime() : 0;
      if (clientCreated >= startOfMonth) novosEsteMes++;
    });

    safeOrders.forEach(o => {
      if (o.status !== OrderStatus.CANCELLED) {
        const orderTime = new Date(o.createdAt).getTime();
        if (orderTime >= startOfMonth) {
          faturamentoMes += (o.totalValue || 0);
        }
      }
    });

    const ticketMedio = safeOrders.length > 0 
        ? safeOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0) / safeOrders.length 
        : 0;

    return { totalClients, ativos, novosEsteMes, faturamentoMes, ticketMedio };
  }, [safeClients, safeOrders, clientsDataMap]);

  // Funções de Ação e Modal
  const handleExportCSV = () => {
    if (safeClients.length === 0) {
      notify.error("Não há clientes para exportar.");
      return;
    }
    const header = "Nome,Email,Telefone,CNPJ/CPF\n";
    const rows = safeClients.map(c => `"${c.name || ''}","${c.email || ''}","${c.whatsapp || ''}","${c.document || ''}"`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clientes_estampariapro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success("Exportação concluída com sucesso!");
  };

  const getClientFinancials = useCallback((clientId: string) => {
    const clientOrders = safeOrders.filter(o => o.clientId === clientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const totalSpent = clientOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0);
    const storeOrders = clientOrders.filter(o => o.origin === 'store');
    const factoryOrders = clientOrders.filter(o => o.origin !== 'store');
    const storeSpent = storeOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    const factorySpent = factoryOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    const lastOrderDate = clientOrders.length > 0 ? new Date(clientOrders[0].createdAt).toLocaleDateString('pt-BR') : 'N/A';
    return { totalSpent, storeSpent, factorySpent, lastOrderDate, totalOrders: clientOrders.length, clientOrders };
  }, [safeOrders]);

  const handleViewProfile = async (client: Client) => {
    setViewingClient(client);
    setProfileTab('active');
    try {
      const reqs = await catalogOrderService.getByClientId(client.id);
      setClientCatalogOrders(reqs);
    } catch (err) {
      console.error("Failed to load catalog orders", err);
      setClientCatalogOrders([]);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient({ ...client });
    setViewingClient(null);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: editingClient.name,
        whatsapp: editingClient.whatsapp,
        email: editingClient.email,
        document: editingClient.document || '',
        address: editingClient.address || ''
      };

      if (editingClient.password) {
        payload.password = editingClient.password;
      } else if (!editingClient.id) {
        payload.password = Math.floor(1000 + Math.random() * 9000).toString();
      }

      if (!editingClient.id) {
        await clientService.create(payload);
      } else {
        await clientService.update(editingClient.id, payload);
      }
      setEditingClient(null);
      window.dispatchEvent(new Event('refreshData'));
    } catch (e) {
      console.error("Error saving client:", e);
      notify.error('Erro ao salvar cliente.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    const orderCount = clientsDataMap.get(id)?.orderCount || 0;
    setConfirmDeleteClient({ id, name, orderCount });
  };

  const doDeleteClient = async (id: string, name: string, cascade: boolean) => {
    try {
      if (cascade) {
        await clientService.deleteWithCascade(id);
      } else {
        await clientService.delete(id);
      }
      window.dispatchEvent(new Event('refreshData'));
      setViewingClient(null);
      notify.success(`Cliente "${name}" excluído.`);
    } catch (e) {
      console.error('Error deleting client:', e);
      notify.error('Erro ao excluir cliente.');
    }
  };

  // Profile Modal sub-vars
  const viewingClientData = viewingClient ? getClientFinancials(viewingClient.id) : null;
  const activeOrders = viewingClientData?.clientOrders.filter(o => o.status !== OrderStatus.FINISHED && o.status !== OrderStatus.CANCELLED) || [];
  const historyOrders = viewingClientData?.clientOrders.filter(o => o.status === OrderStatus.FINISHED) || [];

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500 pb-10">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">Clientes</h2>
          <p className="text-slate-500 mt-1">Cadastre e gerencie seus clientes e acompanhe o histórico de pedidos e compras.</p>
        </div>
        <div className="flex items-center gap-3">

          <button className="hidden md:flex px-4 py-2.5 rounded-xl bg-[#0b1221] border border-[#1e293b] text-slate-400 text-xs font-black uppercase tracking-widest items-center gap-2 hover:bg-slate-800 transition-colors" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => setEditingClient({ name: '', whatsapp: '', email: '' })}
            className="bg-[#4f46e5] hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] uppercase text-xs tracking-widest"
          >
            <UserPlus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </header>

      {/* Searchbar Giga */}
      <div className="relative w-full max-w-3xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail, telefone ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0b1221] border border-[#1e293b] rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-200 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/50 transition-colors shadow-lg"
        />
      </div>

      {/* 5 Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
             <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Total de Clientes</h4>
            <div className="text-xl font-black text-white leading-none">{metrics.totalClients}</div>
            <p className="text-[9px] text-slate-600 mt-0.5">Todos os clientes</p>
          </div>
        </div>

        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
             <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Clientes Ativos</h4>
            <div className="text-xl font-black text-white leading-none">{metrics.ativos}</div>
            <p className="text-[9px] text-slate-600 mt-0.5">Com pedidos</p>
          </div>
        </div>

        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
             <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Novos Este Mês</h4>
            <div className="text-xl font-black text-white leading-none">{metrics.novosEsteMes}</div>
            <p className="text-[9px] text-slate-600 mt-0.5">Novos cadastros</p>
          </div>
        </div>

        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
             <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Faturamento (Mês)</h4>
            <div className="text-xl font-black text-white leading-none">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.faturamentoMes)}
            </div>
            <p className="text-[9px] text-slate-600 mt-0.5">Este mês</p>
          </div>
        </div>

        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4f46e5]/20 text-[#6366f1] flex items-center justify-center shrink-0">
             <ChartBar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Ticket Médio</h4>
            <div className="text-xl font-black text-white leading-none">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.ticketMedio)}
            </div>
            <p className="text-[9px] text-slate-600 mt-0.5">Por pedido</p>
          </div>
        </div>
      </div>

      {/* Grid de Clientes (Substituindo a DataTable antiga) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredClients.length > 0 ? (
          filteredClients.map(client => {
            const data = clientsDataMap.get(client.id);
            // Simulação de Tag (ex: VAREJO ou ESPORTIVO baseada no tipo de dados que compram ou random se não existir)
            const isEsportivo = client.name.toUpperCase().includes('EQUIPE') || client.name.toUpperCase().includes('FUTEBOL') || client.name.toUpperCase().includes('ESPORTE');
            const tagLabel = isEsportivo ? 'ESPORTIVO' : 'VAREJO';
            const tagColor = isEsportivo ? 'text-indigo-400 bg-indigo-900/30' : 'text-purple-400 bg-purple-900/30';

            return (
              <div key={client.id} className="bg-[#0b1221] rounded-2xl border border-[#1e293b] p-5 relative group hover:border-[#4f46e5]/50 transition-colors shadow-lg">
                {/* Ações Fixas no Topo Direito */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id, client.name); }} className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-rose-900/40 hover:text-rose-400 flex items-center justify-center text-slate-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#1e293b] flex items-center justify-center text-slate-300 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="pr-16">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight line-clamp-2 leading-tight">
                      {client.name}
                    </h3>
                    <div className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${tagColor}`}>
                      {tagLabel}
                    </div>
                  </div>
                </div>

                {/* Contatos */}
                <div className="space-y-2 mb-6">
                  {client.whatsapp && (
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> {client.whatsapp}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500" /> <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                {/* Financeiro / Dados */}
                <div className="flex justify-between items-end pb-4 mb-4 border-b border-[#1e293b]">
                  <div>
                    <span className="block text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Total Pedidos</span>
                    <span className="text-lg font-black text-white">{data?.orderCount || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Faturamento Total</span>
                    <span className="text-lg font-black text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.totalSpent || 0)}
                    </span>
                  </div>
                </div>

                {/* Rodapé Card */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Último Pedido</span>
                    <span className="text-xs font-bold text-slate-400">{data?.lastOrderDate || 'Nunca'}</span>
                  </div>
                  <button 
                    onClick={() => handleViewProfile(client)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#6366f1] hover:text-indigo-400 flex items-center gap-1 transition-colors"
                  >
                    Ver Histórico <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
             <User className="w-12 h-12 mb-4 opacity-20" />
             <p className="font-bold">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-lg shadow-2xl border border-[#1e293b] p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">{editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input
                  className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl px-4 py-2.5 text-slate-200 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/50 outline-none"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp</label>
                <input
                  className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl px-4 py-2.5 text-slate-200 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/50 outline-none"
                  value={editingClient.whatsapp}
                  onChange={(e) => setEditingClient({ ...editingClient, whatsapp: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                <input
                  className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl px-4 py-2.5 text-slate-200 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/50 outline-none"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento (CPF/CNPJ)</label>
                <input
                  className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl px-4 py-2.5 text-slate-200 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/50 outline-none"
                  value={editingClient.document || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, document: e.target.value })}
                />
              </div>
              <button onClick={handleSave} className="w-full mt-6 py-3 bg-[#4f46e5] text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors uppercase tracking-widest text-[11px]">
                <Save className="w-4 h-4" /> Salvar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {viewingClient && viewingClientData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-4xl shadow-2xl border border-[#1e293b] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="flex gap-6 items-center">
                <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.15)]">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">{viewingClient.name}</h2>
                  <div className="flex gap-4 mt-2 text-slate-400">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Phone className="w-3 h-3" /> {viewingClient.whatsapp}</span>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Mail className="w-3 h-3" /> {viewingClient.email}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingClient(null)} className="p-3 bg-[#0b1221] border border-[#1e293b] rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="px-8 mt-8 grid grid-cols-4 gap-4">
              <div className="bg-[#0b1221] p-5 rounded-2xl border border-[#1e293b] flex flex-col gap-1 relative overflow-hidden">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Geral</span>
                <span className="text-2xl font-black text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingClientData.totalSpent)}
                </span>
              </div>
              <div className="bg-[#0b1221] p-5 rounded-2xl border border-[#1e293b] flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-emerald-400" /> Loja</span>
                <span className="text-xl font-black text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingClientData.storeSpent)}
                </span>
              </div>
              <div className="bg-[#0b1221] p-5 rounded-2xl border border-[#1e293b] flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1"><Package className="w-3 h-3 text-sky-400" /> Produção</span>
                <span className="text-xl font-black text-sky-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingClientData.factorySpent)}
                </span>
              </div>
              <div className="bg-[#0b1221] p-5 rounded-2xl border border-[#1e293b] flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Acessos Loja</span>
                <span className="text-xl font-black text-slate-300">0</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 mt-8 border-b border-[#1e293b] flex gap-6">
              {[
                { id: 'active', label: 'Pedidos Ativos', count: activeOrders.length },
                { id: 'history', label: 'Histórico Completo', count: historyOrders.length },

                { id: 'info', label: 'Dados de Cadastro', count: null }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProfileTab(tab.id as any)}
                  className={`pb-4 px-2 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border-b-2 transition-all ${
                    profileTab === tab.id 
                    ? 'border-[#6366f1] text-[#6366f1]' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`px-2 py-0.5 rounded-md text-[9px] ${
                      profileTab === tab.id ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#05080E]/50">
              {profileTab === 'active' || profileTab === 'history' ? (
                <div className="space-y-4">
                  {(profileTab === 'active' ? activeOrders : historyOrders).length > 0 ? (
                    (profileTab === 'active' ? activeOrders : historyOrders).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0b1221] border border-[#1e293b] hover:border-slate-600 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#1e293b] rounded-lg overflow-hidden border border-slate-700">
                             {order.layoutUrls && order.layoutUrls.length > 0 ? (
                               <img src={order.layoutUrls[0]} className="w-full h-full object-cover opacity-80" alt="Layout" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-600"><ShoppingBag className="w-5 h-5"/></div>
                             )}
                          </div>
                          <div>
                            <span className="text-white font-bold text-sm">Pedido #{order.orderNumber}</span>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {order.items ? order.items.reduce((acc, i) => acc + i.quantity, 0) : 0} PEÇAS
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <span className="block text-emerald-400 font-black">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}
                              </span>
                           </div>
                           <div className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                              {order.status}
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 font-bold">Nenhum pedido encontrado.</div>
                  )}
                </div>
              ) : profileTab === 'catalog' ? (
                <div className="space-y-4">
                  {clientCatalogOrders.length > 0 ? (
                    clientCatalogOrders.map(req => (
                      <div key={req.id} className="bg-[#0b1221] p-4 rounded-xl border border-[#1e293b] flex justify-between items-center">
                         <div>
                            <span className="text-white font-bold block mb-1">Solicitação #{req.id.substring(0,6).toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                         </div>
                         <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                            {req.status}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 font-bold">Nenhuma solicitação de catálogo.</div>
                  )}
                </div>
              ) : (
                <div className="bg-[#0b1221] p-6 rounded-2xl border border-[#1e293b] max-w-xl">
                  <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest border-b border-[#1e293b] pb-4">Informações</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Nome / Razão Social</span>
                      <span className="text-sm text-slate-200 font-bold">{viewingClient.name}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">CPF / CNPJ</span>
                      <span className="text-sm text-slate-200 font-bold">{viewingClient.document || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Endereço Completo</span>
                      <span className="text-sm text-slate-200 font-bold">{viewingClient.address || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      <ConfirmModal
        isOpen={!!confirmDeleteClient}
        title="Deletar Cliente Permanente"
        message={
          confirmDeleteClient?.orderCount > 0
          ? `CUIDADO: Este cliente possui ${confirmDeleteClient.orderCount} pedidos vinculados. Excluir o cliente também excluirá permanentemente todos os pedidos, históricos e arquivos anexados a ele. Esta ação não pode ser desfeita.`
          : `Tem certeza que deseja DELETAR o cliente ${confirmDeleteClient?.name}? Esta ação não pode ser desfeita.`
        }
        confirmLabel={confirmDeleteClient && confirmDeleteClient.orderCount > 0 ? "Excluir Cliente e Todos os Pedidos" : "Excluir Cliente"}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => confirmDeleteClient && doDeleteClient(confirmDeleteClient.id, confirmDeleteClient.name, confirmDeleteClient.orderCount > 0)}
        onCancel={() => setConfirmDeleteClient(null)}
      />
    </div>
  );
};

export default Clients;
