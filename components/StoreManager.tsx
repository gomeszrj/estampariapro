import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Store, BarChart3, Package, Image as ImageIcon, ShoppingBag,
  Settings, Plus, Trash2, Edit3, Eye, ExternalLink, Save,
  TrendingUp, Users, DollarSign, RefreshCw, ChevronDown,
  Search, Filter, CheckCircle, XCircle, Clock, Truck,
  RotateCcw, Star, ArrowUpRight, AlertTriangle, Upload,
  ToggleLeft, ToggleRight, Palette, Globe, Phone, Mail,
  Move, GripVertical, ChevronUp, Layers, Zap, Target,
  ShoppingCart, Activity
} from 'lucide-react';
import { gmzStoreService, GmzProduct, GmzBanner, GmzOrder, GmzStoreSettings } from '../services/gmzStoreService';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

/* ════════════════════════════════════════════════════
   TYPES & CONSTANTS
════════════════════════════════════════════════════ */
type ActiveTab = 'dashboard' | 'produtos' | 'banners' | 'pedidos' | 'editor' | 'configuracoes';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.FC<any> }> = {
  novo: { label: 'Novo', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', icon: Clock },
  orcamento: { label: 'Orçamento', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: DollarSign },
  aprovado: { label: 'Aprovado', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: CheckCircle },
  producao: { label: 'Produção', color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: Zap },
  entregue: { label: 'Entregue', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', icon: Truck },
  cancelado: { label: 'Cancelado', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: XCircle },
};

const CATEGORIES = ['NBA', 'UV+50', 'MANGA CURTA', 'DTF', 'FUTEBOL', 'CICLISMO', 'CORRIDA', 'PERSONALIZADO'];

const SIZES_CAT = {
  INFANTIL: ['2 Anos', '4 Anos', '6 Anos', '8 Anos', '10 Anos', '12 Anos', '14 Anos'],
  FEMININA: ['Fem PP', 'Fem P', 'Fem M', 'Fem G', 'Fem GG', 'Fem XG', 'Fem XXG', 'Fem ESP1', 'Fem ESP2'],
  MASCULINA: ['Masc PP', 'Masc P', 'Masc M', 'Masc G', 'Masc GG', 'Masc XG', 'Masc XXG', 'Masc ESP1', 'Masc ESP2'],
};

/* ════════════════════════════════════════════════════
   CARD ESTATÍSTICA
════════════════════════════════════════════════════ */
const StatCard: React.FC<{
  label: string; value: string | number; sub?: string;
  icon: React.FC<any>; color: string; trend?: number;
}> = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${color}15`, filter: 'blur(20px)' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}20`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      {trend !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 700, color: trend >= 0 ? '#4ade80' : '#f87171', background: trend >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', padding: '3px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
          <ArrowUpRight size={12} style={{ transform: trend < 0 ? 'rotate(90deg)' : 'none' }} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</p>
    <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    {sub && <p style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>{sub}</p>}
  </div>
);

/* ════════════════════════════════════════════════════
   VIEWER 360°
════════════════════════════════════════════════════ */
const MiniViewer360: React.FC<{ imageUrl?: string; color?: string }> = ({ imageUrl, color = '#7c3aed' }) => {
  const [rot, setRot] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [auto, setAuto] = useState(true);
  const lastX = useRef(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (!auto) return;
    const spin = () => { setRot(r => (r + 0.5) % 360); raf.current = requestAnimationFrame(spin); };
    raf.current = requestAnimationFrame(spin);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [auto]);

  if (!imageUrl) return (
    <div style={{ width: 120, height: 120, background: 'rgba(124,58,237,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
      <ImageIcon size={32} />
    </div>
  );

  const scaleX = Math.abs(Math.cos((rot * Math.PI) / 180)) * 0.3 + 0.7;
  const isBack = Math.abs(rot % 360) > 90 && Math.abs(rot % 360) < 270;

  return (
    <div
      style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', textAlign: 'center' }}
      onMouseDown={e => { setDragging(true); setAuto(false); lastX.current = e.clientX; }}
      onMouseMove={e => { if (!dragging) return; const d = e.clientX - lastX.current; setRot(r => (r + d * 0.6) % 360); lastX.current = e.clientX; }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      <img
        src={imageUrl} alt="360"
        style={{ width: 120, height: 120, objectFit: 'contain', transform: `scaleX(${isBack ? -scaleX : scaleX})`, filter: `drop-shadow(0 8px 16px ${color}40)` }}
        draggable={false}
      />
      <div style={{ fontSize: 10, color: '#475569', marginTop: 4, fontWeight: 600 }}>⟳ 360°</div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   UTIL: RESIZE IMAGE
════════════════════════════════════════════════════ */
const resizeImage = (file: File, maxSize: number = 800): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas is empty'));
          const mimeType = file.type.includes('png') ? 'image/png' : 'image/jpeg';
          const newFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(newFile);
        }, file.type.includes('png') ? 'image/png' : 'image/jpeg', 0.85);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/* ════════════════════════════════════════════════════
   MODAL PRODUTO
════════════════════════════════════════════════════ */
const ProductModal: React.FC<{
  product: Partial<GmzProduct> | null;
  onClose: () => void;
  onSave: (p: Partial<GmzProduct>) => void;
}> = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<GmzProduct>>(product || {
    title: '', subtitle: '', description: '', category: 'NBA',
    price: 89.90, features: [], color_hex: '#7c3aed',
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG'], active: true, featured: false,
    stock_qty: 0, sort_order: 0,
  });
  const [featInput, setFeatInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof GmzProduct, v: any) => setForm(f => ({ ...f, [k]: v }));
  const images = (form.image_url || '').split('|||');

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      toast.loading('Otimizando imagem...', { id: 'upload' });
      const resizedFile = await resizeImage(file, 800);
      toast.loading('Fazendo upload da imagem...', { id: 'upload' });
      const url = await gmzStoreService.uploadStoreImage(resizedFile, 'products');
      const newImages = [...images];
      while (newImages.length <= index) newImages.push('');
      newImages[index] = url;
      set('image_url', newImages.join('|||'));
      toast.success('Upload concluído!', { id: 'upload' });
    } catch (err: any) {
      console.error('Upload Error:', err);
      toast.error(err?.message || 'Erro ao carregar imagem', { id: 'upload' });
    }
    finally { setUploading(false); }
  };

  const addFeature = () => {
    if (!featInput.trim()) return;
    set('features', [...(form.features || []), featInput.trim()]);
    setFeatInput('');
  };

  const removeFeature = (i: number) => set('features', (form.features || []).filter((_, idx) => idx !== i));

  const toggleSize = (s: string) => {
    const cur = form.sizes || [];
    // Identify if size exists (ignoring measurements)
    const exists = cur.find(x => x.startsWith(s + '|') || x === s);
    if (exists) {
      set('sizes', cur.filter(x => x !== exists));
    } else {
      set('sizes', [...cur, `${s}||`]);
    }
  };

  const updateSizeMeasure = (s: string, alt: string, larg: string) => {
    const cur = form.sizes || [];
    const newSizes = cur.map(x => {
      if (x.startsWith(s + '|') || x === s) {
        return `${s}|${alt}|${larg}`;
      }
      return x;
    });
    set('sizes', newSizes);
  };

  const getSizeMeasure = (s: string) => {
    const cur = form.sizes || [];
    const found = cur.find(x => x.startsWith(s + '|') || x === s);
    if (!found) return { alt: '', larg: '' };
    const parts = found.split('|');
    return { alt: parts[1] || '', larg: parts[2] || '' };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#0d0f17', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 28, width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0d0f17', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(124,58,237,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="#a78bfa" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{product?.id ? 'Editar Produto' : 'Novo Produto'}</h2>
              <p style={{ fontSize: 12, color: '#475569' }}>Preencha os dados do produto para a loja</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Image upload + 360 preview */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: 16, padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Imagens do Produto (360º)</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>Adicione até 4 ângulos para habilitar a rotação 360º</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Frente', icon: '👕', index: 0 },
                  { label: 'Costas', icon: '🎽', index: 1 },
                  { label: 'Lat. Direita', icon: '➡️', index: 2 },
                  { label: 'Lat. Esquerda', icon: '⬅️', index: 3 }
                ].map((slot) => (
                  <div key={slot.index} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 8 }}>{slot.label}</p>
                    {images[slot.index] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
                        <img src={images[slot.index]} alt={slot.label} style={{ width: 60, height: 60, objectFit: 'contain', filter: `drop-shadow(0 4px 8px ${form.color_hex}40)` }} />
                        <label style={{ fontSize: 10, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                          Trocar <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUploadImage(e, slot.index)} />
                        </label>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', width: '100%', padding: '10px 0' }}>
                        <Upload size={20} color="#475569" />
                        <span style={{ fontSize: 10, color: '#64748b' }}>Upload</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUploadImage(e, slot.index)} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Image URL alternative */}
            <div>
              <label style={labelStyle}>URL das Imagens (Separadas por |||)</label>
              <input style={inputStyle} placeholder="url1|||url2|||url3|||url4" value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} />
            </div>

            {/* Color picker */}
            <div>
              <label style={labelStyle}>Cor de Destaque</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={form.color_hex || '#7c3aed'} onChange={e => set('color_hex', e.target.value)} style={{ width: 48, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 2 }} />
                <input style={{ ...inputStyle, flex: 1 }} value={form.color_hex || '#7c3aed'} onChange={e => set('color_hex', e.target.value)} />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label style={labelStyle}>Tamanhos e Medidas (Alt x Larg em cm)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(SIZES_CAT).map(([catName, sizes]) => (
                  <div key={catName} style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', marginBottom: 8 }}>{catName}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {sizes.map(s => {
                        const isSelected = (form.sizes || []).some(x => x.startsWith(s + '|') || x === s);
                        const measures = getSizeMeasure(s);
                        return (
                          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, background: isSelected ? 'rgba(124,58,237,0.1)' : 'transparent', padding: 4, borderRadius: 8, border: `1px solid ${isSelected ? '#7c3aed' : 'rgba(255,255,255,0.1)'}` }}>
                            <button onClick={() => toggleSize(s)} style={{ background: 'none', border: 'none', color: isSelected ? '#a78bfa' : '#64748b', fontWeight: 800, fontSize: 11, cursor: 'pointer', padding: '4px 8px' }}>
                              {s}
                            </button>
                            {isSelected && (
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input placeholder="Alt" value={measures.alt} onChange={e => updateSizeMeasure(s, e.target.value, measures.larg)} style={{ width: 40, height: 24, fontSize: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 4, textAlign: 'center' }} />
                                <span style={{ color: '#64748b', fontSize: 10 }}>x</span>
                                <input placeholder="Larg" value={measures.larg} onChange={e => updateSizeMeasure(s, measures.alt, e.target.value)} style={{ width: 40, height: 24, fontSize: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 4, textAlign: 'center' }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <button onClick={() => set('active', !form.active)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: form.active ? '#4ade80' : '#475569' }}>
                  {form.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: form.active ? '#4ade80' : '#64748b' }}>Ativo</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <button onClick={() => set('featured', !form.featured)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: form.featured ? '#f59e0b' : '#475569' }}>
                  {form.featured ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: form.featured ? '#f59e0b' : '#64748b' }}>Em destaque</span>
              </label>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Título do Produto *</label>
              <input style={inputStyle} placeholder="Ex: Regata NBA Lakers Roxa" value={form.title || ''} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Subtítulo</label>
              <input style={inputStyle} placeholder="Ex: Sublimação premium · AeroMesh Pro" value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Descrição</label>
              <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="Descreva o produto..." value={form.description || ''} onChange={e => set('description', e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Categoria</label>
                <select style={inputStyle} value={form.category || 'NBA'} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Badge (opcional)</label>
                <input style={inputStyle} placeholder="Ex: BEST SELLER" value={form.badge || ''} onChange={e => set('badge', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Preço (R$) *</label>
                <input style={inputStyle} type="number" step="0.01" value={form.price || ''} onChange={e => set('price', parseFloat(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>Preço Original (De)</label>
                <input style={inputStyle} type="number" step="0.01" value={form.original_price || ''} onChange={e => set('original_price', parseFloat(e.target.value))} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Features / Características</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Ex: Sublimação Total" value={featInput} onChange={e => setFeatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFeature()} />
                <button onClick={addFeature} style={{ width: 40, height: 40, background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 10, color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(form.features || []).map((f, i) => (
                  <span key={i} style={{ fontSize: 11, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    {f}
                    <button onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, display: 'flex' }}>✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Estoque</label>
                <input style={inputStyle} type="number" value={form.stock_qty || 0} onChange={e => set('stock_qty', parseInt(e.target.value))} />
              </div>
              <div>
                <label style={labelStyle}>Ordem de exibição</label>
                <input style={inputStyle} type="number" value={form.sort_order || 0} onChange={e => set('sort_order', parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnGhostStyle }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ ...btnPrimaryStyle }}>
            <Save size={14} /> {product?.id ? 'Salvar Alterações' : 'Criar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   MODAL BANNER
════════════════════════════════════════════════════ */
const BannerModal: React.FC<{
  banner: Partial<GmzBanner> | null;
  onClose: () => void;
  onSave: (b: Partial<GmzBanner>) => void;
}> = ({ banner, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<GmzBanner>>(banner || {
    title: 'VISTA SUA', subtitle: 'IDENTIDADE',
    description: 'Peças produzidas com alta tecnologia.',
    cta_text: 'Explorar Coleções', bg_color: '#040507',
    accent_color: '#7c3aed', active: true, sort_order: 0,
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof GmzBanner, v: any) => setForm(f => ({ ...f, [k]: v }));

  const rawUrl = form.image_url || '';
  const urlParts = rawUrl.split('|||');
  const imgSrc = urlParts[0] || '';
  const imgX = Number(urlParts[1]) || 0;
  const imgY = Number(urlParts[2]) || 0;
  const imgScale = urlParts[3] !== undefined ? Number(urlParts[3]) : 1;

  const updatePosition = (key: 'x' | 'y' | 'scale', val: number) => {
    const x = key === 'x' ? val : imgX;
    const y = key === 'y' ? val : imgY;
    const s = key === 'scale' ? val : imgScale;
    set('image_url', `${imgSrc}|||${x}|||${y}|||${s}`);
  };

  const updateSrc = (newSrc: string) => {
    if (!newSrc) return set('image_url', '');
    set('image_url', `${newSrc}|||${imgX}|||${imgY}|||${imgScale}`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      toast.loading('Fazendo upload da imagem...', { id: 'upload' });
      const url = await gmzStoreService.uploadStoreImage(file, 'banners');
      set('image_url', `${url}|||${imgX}|||${imgY}|||${imgScale}`);
      toast.success('Upload concluído!', { id: 'upload' });
    } catch (err: any) {
      console.error('Upload Error Banner:', err);
      toast.error(err?.message || 'Erro ao carregar imagem', { id: 'upload' });
    }
    finally { setUploading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#0d0f17', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 28, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ImageIcon size={18} color="#a78bfa" /> {banner?.id ? 'Editar Banner' : 'Novo Banner'}
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Live Preview */}
        <div style={{ margin: '20px 28px', borderRadius: 16, overflow: 'hidden', background: form.bg_color || '#040507', border: '1px solid rgba(255,255,255,0.06)', minHeight: 140, position: 'relative', display: 'flex', alignItems: 'center', padding: '30px 40px' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', background: `radial-gradient(ellipse at center, ${form.accent_color}30, transparent 70%)`, pointerEvents: 'none' }} />

          {imgSrc && (
            <img src={imgSrc} alt="Preview" style={{ position: 'absolute', right: 40, top: '50%', transform: `translate(0, -50%) translate(${imgX * 0.4}px, ${imgY * 0.4}px) scale(${imgScale})`, maxHeight: 120, objectFit: 'contain', zIndex: 1, pointerEvents: 'none' }} />
          )}

          <div style={{ position: 'relative', zIndex: 2 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: form.accent_color, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>Preview</p>
            <h3 style={{ fontSize: 28, fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>{form.title || 'TÍTULO'}</h3>
            <h4 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: 12, color: form.accent_color }}>{form.subtitle || 'SUBTÍTULO'}</h4>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16, maxWidth: 300 }}>{form.description}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: form.accent_color, color: 'white', padding: '8px 20px', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
              {form.cta_text || 'CTA'} →
            </div>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Título (linha 1)</label>
            <input style={inputStyle} value={form.title || ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Subtítulo em destaque (linha 2)</label>
            <input style={inputStyle} value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Descrição</label>
            <textarea style={{ ...inputStyle, height: 60 }} value={form.description || ''} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Texto do Botão</label>
            <input style={inputStyle} value={form.cta_text || ''} onChange={e => set('cta_text', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Link do Botão (URL)</label>
            <input style={inputStyle} placeholder="/#colecoes" value={form.cta_url || ''} onChange={e => set('cta_url', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>URL da Imagem/Jersey</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="https://..." value={imgSrc} onChange={e => updateSrc(e.target.value)} />
              <button onClick={() => fileRef.current?.click()} style={{ ...btnGhostStyle, padding: '10px 14px', minWidth: 'fit-content' }} disabled={uploading}>
                <Upload size={14} /> {uploading ? '...' : 'Upload'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          </div>

          <div style={{ gridColumn: '1/-1', background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ ...labelStyle, marginBottom: 12 }}>Posicionamento Manual da Imagem</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 10, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>X (Horizontal)</span> <span>{imgX}px</span>
                </label>
                <input type="range" min="-400" max="400" value={imgX} onChange={e => updatePosition('x', Number(e.target.value))} style={{ width: '100%', accentColor: form.accent_color }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Y (Vertical)</span> <span>{imgY}px</span>
                </label>
                <input type="range" min="-400" max="400" value={imgY} onChange={e => updatePosition('y', Number(e.target.value))} style={{ width: '100%', accentColor: form.accent_color }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Escala (Tamanho)</span> <span>{imgScale.toFixed(2)}x</span>
                </label>
                <input type="range" min="0.1" max="3" step="0.05" value={imgScale} onChange={e => updatePosition('scale', Number(e.target.value))} style={{ width: '100%', accentColor: form.accent_color }} />
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Cor de Destaque</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="color" value={form.accent_color || '#7c3aed'} onChange={e => set('accent_color', e.target.value)} style={{ width: 44, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 2, cursor: 'pointer', background: 'none' }} />
              <input style={{ ...inputStyle, flex: 1 }} value={form.accent_color || ''} onChange={e => set('accent_color', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Cor de Fundo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="color" value={form.bg_color || '#040507'} onChange={e => set('bg_color', e.target.value)} style={{ width: 44, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 2, cursor: 'pointer', background: 'none' }} />
              <input style={{ ...inputStyle, flex: 1 }} value={form.bg_color || ''} onChange={e => set('bg_color', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhostStyle}>Cancelar</button>
          <button onClick={() => onSave(form)} style={btnPrimaryStyle}><Save size={14} /> Salvar Banner</button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   SHARED STYLES
════════════════════════════════════════════════════ */
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
};
const btnPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 22px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  border: 'none', borderRadius: 12, color: 'white', fontWeight: 700,
  fontSize: 13, cursor: 'pointer', letterSpacing: '0.03em', boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
};
const btnGhostStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 22px', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
  color: '#94a3b8', fontWeight: 700, fontSize: 13, cursor: 'pointer',
};

/* ════════════════════════════════════════════════════
   MAIN STORE MANAGER COMPONENT
════════════════════════════════════════════════════ */
export const StoreManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [products, setProducts] = useState<GmzProduct[]>([]);
  const [banners, setBanners] = useState<GmzBanner[]>([]);
  const [orders, setOrders] = useState<GmzOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [settings, setSettings] = useState<Partial<GmzStoreSettings>>({
    store_name: 'GMZ Performance', store_subtitle: 'Uniformes Esportivos Premium',
    primary_color: '#7c3aed', accent_color: '#4f46e5',
    hero_title: 'VISTA SUA IDENTIDADE', hero_subtitle: 'QUALIDADE. ESTILO. PERFORMANCE.',
    hero_description: 'Peças produzidas com alta tecnologia para quem vive o esporte.',
    show_360_viewer: true, show_reviews: true, installments: 3,
  });
  const [loading, setLoading] = useState(true);
  const [productModal, setProductModal] = useState<Partial<GmzProduct> | null | false>(false);
  const [bannerModal, setBannerModal] = useState<Partial<GmzBanner> | null | false>(false);
  const [orderFilter, setOrderFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, b, o, a, s] = await Promise.allSettled([
        gmzStoreService.getProducts(),
        gmzStoreService.getBanners(),
        gmzStoreService.getOrders(),
        gmzStoreService.getAnalytics(),
        gmzStoreService.getSettings(),
      ]);
      if (p.status === 'fulfilled') setProducts(p.value);
      if (b.status === 'fulfilled') setBanners(b.value);
      if (o.status === 'fulfilled') setOrders(o.value);
      if (a.status === 'fulfilled') setAnalytics(a.value);
      if (s.status === 'fulfilled' && s.value) setSettings(s.value);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── PRODUCTS CRUD ── */
  const saveProduct = async (form: Partial<GmzProduct>) => {
    if (!form.title) { toast.error('Título é obrigatório'); return; }
    try {
      if (form.id) {
        const updated = await gmzStoreService.updateProduct(form.id, form);
        setProducts(prev => prev.map(p => p.id === form.id ? updated : p));
        toast.success('Produto atualizado!');
      } else {
        const created = await gmzStoreService.createProduct(form as any);
        setProducts(prev => [...prev, created]);
        toast.success('Produto criado!');
      }
      setProductModal(false);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await gmzStoreService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Produto removido');
  };

  /* ── BANNERS CRUD ── */
  const saveBanner = async (form: Partial<GmzBanner>) => {
    try {
      if (form.id) {
        const updated = await gmzStoreService.updateBanner(form.id, form);
        setBanners(prev => prev.map(b => b.id === form.id ? updated : b));
        toast.success('Banner atualizado!');
      } else {
        const created = await gmzStoreService.createBanner(form as any);
        setBanners(prev => [...prev, created]);
        toast.success('Banner criado!');
      }
      setBannerModal(false);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Excluir este banner?')) return;
    await gmzStoreService.deleteBanner(id);
    setBanners(prev => prev.filter(b => b.id !== id));
    toast.success('Banner removido');
  };

  /* ── ORDERS ── */
  const updateOrderStatus = async (id: string, status: GmzOrder['status']) => {
    await gmzStoreService.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success('Status atualizado!');
  };

  /* ── SETTINGS ── */
  const saveSettings = async () => {
    setSaving(true);
    try {
      await gmzStoreService.saveSettings(settings);
      toast.success('Configurações salvas!');
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchStatus = orderFilter === 'todos' || o.status === orderFilter;
    const matchSearch = !searchTerm || o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer_phone?.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  // Revenue chart data (last 14 days)
  const chartData = React.useMemo(() => {
    if (!analytics?.revenueByDay) return [];
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split('T')[0];
      return { day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: analytics.revenueByDay[key] || 0 };
    });
    return days;
  }, [analytics]);

  const pieData = analytics ? [
    { name: 'Novos', value: analytics.byStatus.novo, color: '#60a5fa' },
    { name: 'Orçamento', value: analytics.byStatus.orcamento, color: '#f59e0b' },
    { name: 'Aprovado', value: analytics.byStatus.aprovado, color: '#a78bfa' },
    { name: 'Produção', value: analytics.byStatus.producao, color: '#f97316' },
    { name: 'Entregue', value: analytics.byStatus.entregue, color: '#4ade80' },
  ].filter(d => d.value > 0) : [];

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'pedidos', label: 'Pedidos Loja', icon: ShoppingCart },
    { id: 'editor', label: 'Editor Visual', icon: Layers },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div style={{ color: '#e2e8f0' }}>
      {/* Modals */}
      {productModal !== false && (
        <ProductModal product={productModal} onClose={() => setProductModal(false)} onSave={saveProduct} />
      )}
      {bannerModal !== false && (
        <BannerModal banner={bannerModal} onClose={() => setBannerModal(false)} onSave={saveBanner} />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.4)', fontSize: 22 }}>⚡</div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: 2 }}>
                Admin da Loja <span style={{ color: '#7c3aed' }}>GMZ Performance</span>
              </h1>
              <p style={{ fontSize: 13, color: '#475569' }}>Gerencie produtos, banners, pedidos e configurações da sua loja online</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="https://estampariapro.vercel.app?view=public_catalog" target="_blank" rel="noopener noreferrer" style={{ ...btnGhostStyle, textDecoration: 'none' }}>
              <ExternalLink size={14} /> Ver Loja
            </a>
            <button onClick={load} style={btnGhostStyle}><RefreshCw size={14} /></button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 6, marginBottom: 28, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ActiveTab)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s', whiteSpace: 'nowrap', background: active ? 'rgba(124,58,237,0.25)' : 'transparent', color: active ? '#a78bfa' : '#64748b', boxShadow: active ? '0 0 15px rgba(124,58,237,0.2)' : 'none' }}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════ DASHBOARD TAB ══════════ */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <StatCard label="Receita Total" value={`R$ ${(analytics?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="#4ade80" trend={12} />
            <StatCard label="Total de Pedidos" value={analytics?.totalOrders || 0} sub="Pedidos na loja" icon={ShoppingBag} color="#60a5fa" trend={8} />
            <StatCard label="Produtos Ativos" value={products.filter(p => p.active).length} sub={`${products.length} total`} icon={Package} color="#a78bfa" />
            <StatCard label="Pedidos Novos" value={analytics?.byStatus?.novo || 0} sub="Aguardando resposta" icon={Activity} color="#f59e0b" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            {/* Revenue chart */}
            <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="#7c3aed" /> Receita — Últimos 14 Dias
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                  <Tooltip contentStyle={{ background: '#0d0f17', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, color: 'white' }} formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, 'Receita']} />
                  <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 20 }}>Status dos Pedidos</h3>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0d0f17', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, color: 'white' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pieData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                          <span style={{ color: '#94a3b8' }}>{d.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'white' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, color: '#334155', flexDirection: 'column', gap: 8 }}>
                  <ShoppingCart size={32} />
                  <p style={{ fontSize: 12, fontWeight: 600 }}>Sem pedidos ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={16} color="#7c3aed" /> Pedidos Recentes
            </h3>
            {orders.slice(0, 5).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#334155' }}>
                <ShoppingCart size={40} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700 }}>Nenhum pedido recebido ainda</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Os pedidos da loja online aparecerão aqui</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.slice(0, 5).map(o => {
                  const st = STATUS_CONFIG[o.status];
                  return (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{o.customer_name}</p>
                        <p style={{ fontSize: 11, color: '#475569' }}>{o.customer_phone} · {o.items.length} item(ns)</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>R$ {Number(o.total_price).toFixed(2).replace('.', ',')}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: 8 }}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ PRODUTOS TAB ══════════ */}
      {activeTab === 'produtos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Produtos da Loja</h2>
              <p style={{ fontSize: 13, color: '#475569' }}>{products.length} produto(s) cadastrado(s)</p>
            </div>
            <button onClick={() => setProductModal(null)} style={btnPrimaryStyle}><Plus size={14} /> Novo Produto</button>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 280, background: 'rgba(255,255,255,0.03)', borderRadius: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(13,15,23,0.5)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Package size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>Nenhum produto cadastrado</h3>
              <p style={{ color: '#334155', marginBottom: 24 }}>Adicione seus primeiros produtos para exibi-los na loja</p>
              <button onClick={() => setProductModal(null)} style={btnPrimaryStyle}><Plus size={14} /> Criar Primeiro Produto</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {products.map(p => (
                <div key={p.id} style={{ background: 'rgba(13,15,23,0.8)', border: `1px solid ${p.active ? 'rgba(255,255,255,0.06)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 20, overflow: 'hidden', transition: 'all 0.2s' }}>
                  {/* Image/360 preview */}
                  <div style={{ background: `linear-gradient(135deg, rgba(13,15,23,1), ${p.color_hex}15)`, padding: '20px', display: 'flex', justifyContent: 'center', minHeight: 140, alignItems: 'center', position: 'relative' }}>
                    {!p.active && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Inativo</div>
                    )}
                    {p.featured && (
                      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={8} /> Destaque
                      </div>
                    )}
                    <MiniViewer360 imageUrl={p.image_url} color={p.color_hex} />
                  </div>

                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: p.color_hex, background: `${p.color_hex}15`, padding: '2px 7px', borderRadius: 5, display: 'inline-block', marginBottom: 4 }}>{p.category}</span>
                        <p style={{ fontSize: 13, fontWeight: 800, color: 'white', lineHeight: 1.3 }}>{p.title}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 12 }}>R$ {Number(p.price).toFixed(2).replace('.', ',')}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setProductModal(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        <Edit3 size={12} /> Editar
                      </button>
                      <button onClick={() => deleteProduct(p.id)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#f87171', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ BANNERS TAB ══════════ */}
      {activeTab === 'banners' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Banners do Hero Slider</h2>
              <p style={{ fontSize: 13, color: '#475569' }}>Banners exibidos em rotação automática na loja</p>
            </div>
            <button onClick={() => setBannerModal(null)} style={btnPrimaryStyle}><Plus size={14} /> Novo Banner</button>
          </div>

          {banners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(13,15,23,0.5)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)' }}>
              <ImageIcon size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>Nenhum banner cadastrado</h3>
              <button onClick={() => setBannerModal(null)} style={{ ...btnPrimaryStyle, marginTop: 16 }}><Plus size={14} /> Criar Primeiro Banner</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {banners.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
                  {/* Mini preview */}
                  <div style={{ width: 200, minHeight: 100, background: b.bg_color, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '16px 20px', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60%', background: `radial-gradient(ellipse, ${b.accent_color}30, transparent 70%)` }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1 }}>{b.title}</p>
                      {b.subtitle && <p style={{ fontSize: 14, fontWeight: 900, color: b.accent_color, textTransform: 'uppercase', lineHeight: 1 }}>{b.subtitle}</p>}
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{b.title} {b.subtitle}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: b.active ? '#4ade80' : '#f87171', background: b.active ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', padding: '2px 8px', borderRadius: 6 }}>{b.active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#475569' }}>{b.description}</p>
                    <p style={{ fontSize: 11, color: b.accent_color, marginTop: 4, fontWeight: 700 }}>CTA: {b.cta_text}</p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, padding: '0 20px', flexShrink: 0 }}>
                    <button onClick={() => setBannerModal(b)} style={{ ...btnGhostStyle, padding: '8px 14px', fontSize: 12 }}>
                      <Edit3 size={12} /> Editar
                    </button>
                    <button onClick={() => deleteBanner(b.id)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#f87171', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ PEDIDOS TAB ══════════ */}
      {activeTab === 'pedidos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Pedidos da Loja Online</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#475569' }} />
                <input
                  style={{ ...inputStyle, width: 220, paddingLeft: 36 }}
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Status filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['todos', ...Object.keys(STATUS_CONFIG)].map(s => {
              const cfg = s === 'todos' ? { label: 'Todos', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' } : STATUS_CONFIG[s];
              const active = orderFilter === s;
              return (
                <button key={s} onClick={() => setOrderFilter(s)} style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 10, border: `1px solid ${active ? cfg.color : 'rgba(255,255,255,0.08)'}`, background: active ? cfg.bg : 'transparent', color: active ? cfg.color : '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
              <ShoppingCart size={48} style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 16, fontWeight: 700 }}>Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredOrders.map(o => {
                const st = STATUS_CONFIG[o.status];
                const StIcon = st.icon;
                return (
                  <div key={o.id} style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      {/* Status icon */}
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: st.bg, border: `1px solid ${st.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <StIcon size={18} color={st.color} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{o.customer_name}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 8 }}>{st.label}</span>
                          <span style={{ fontSize: 11, color: '#475569' }}>#{o.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {o.customer_phone && <p style={{ fontSize: 12, color: '#64748b' }}>📱 {o.customer_phone}</p>}
                          <p style={{ fontSize: 12, color: '#64748b' }}>📦 {o.items.length} item(ns)</p>
                          <p style={{ fontSize: 12, color: '#64748b' }}>📅 {new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                          <p style={{ fontSize: 12, color: '#64748b' }}>🏷️ {o.source}</p>
                        </div>
                        {o.items.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {o.items.map((item: any, i: number) => (
                              <span key={i} style={{ fontSize: 10, color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                                {item.title || item.product?.title || 'Item'} x{item.qty || 1}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Price + actions */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 8 }}>R$ {Number(o.total_price).toFixed(2).replace('.', ',')}</p>
                        <select
                          value={o.status}
                          onChange={e => updateOrderStatus(o.id, e.target.value as any)}
                          style={{ ...inputStyle, width: 'auto', fontSize: 12, padding: '6px 12px', color: st.color, background: st.bg, border: `1px solid ${st.color}40` }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        {o.customer_phone && (
                          <a href={`https://wa.me/55${o.customer_phone.replace(/\D/g, '')}?text=Olá ${o.customer_name}! Seu pedido #${o.id.slice(-6).toUpperCase()} está em ${st.label}.`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, fontSize: 11, color: '#25d366', textDecoration: 'none', marginTop: 8, fontWeight: 700 }}>
                            💬 Contatar via WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ EDITOR VISUAL TAB ══════════ */}
      {activeTab === 'editor' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>Editor Visual da Loja</h2>
            <p style={{ fontSize: 13, color: '#475569' }}>Personalize o conteúdo do Hero, textos e aparência da loja em tempo real</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Editor form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={14} color="#7c3aed" /> Seção Hero (Banner Principal)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Título Principal</label>
                    <input style={inputStyle} value={settings.hero_title || ''} onChange={e => setSettings(s => ({ ...s, hero_title: e.target.value }))} placeholder="VISTA SUA IDENTIDADE" />
                  </div>
                  <div>
                    <label style={labelStyle}>Subtítulo</label>
                    <input style={inputStyle} value={settings.hero_subtitle || ''} onChange={e => setSettings(s => ({ ...s, hero_subtitle: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Descrição</label>
                    <textarea style={{ ...inputStyle, height: 80 }} value={settings.hero_description || ''} onChange={e => setSettings(s => ({ ...s, hero_description: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Palette size={14} color="#7c3aed" /> Identidade Visual
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Cor Primária</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={settings.primary_color || '#7c3aed'} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} style={{ width: 48, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 2, cursor: 'pointer', background: 'none' }} />
                      <input style={{ ...inputStyle, flex: 1 }} value={settings.primary_color || ''} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Cor Secundária</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={settings.accent_color || '#4f46e5'} onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))} style={{ width: 48, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 2, cursor: 'pointer', background: 'none' }} />
                      <input style={{ ...inputStyle, flex: 1 }} value={settings.accent_color || ''} onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings size={14} color="#7c3aed" /> Recursos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { key: 'show_360_viewer', label: 'Visualizador 360°', desc: 'Habilitar rotação 3D nos produtos' },
                    { key: 'show_reviews', label: 'Avaliações', desc: 'Exibir seção de depoimentos' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: '#475569' }}>{item.desc}</p>
                      </div>
                      <button onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: settings[item.key as keyof typeof settings] ? '#4ade80' : '#475569' }}>
                        {settings[item.key as keyof typeof settings] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={14} color="#7c3aed" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preview da Loja</span>
                </div>
                {/* Mini store preview */}
                <div style={{ background: '#04050a', minHeight: 360, position: 'relative', overflow: 'hidden' }}>
                  {/* Header mini */}
                  <div style={{ background: 'rgba(7,9,13,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.accent_color})`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⚡</div>
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>GMZ</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Início', 'Coleções', 'Produtos'].map((l, i) => (
                        <span key={i} style={{ fontSize: 9, color: '#475569', fontWeight: 700 }}>{l}</span>
                      ))}
                    </div>
                  </div>

                  {/* Hero mini */}
                  <div style={{ padding: '30px 24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 20, top: 10, bottom: 10, width: '40%', background: `radial-gradient(circle, ${settings.primary_color}20, transparent 70%)` }} />
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: settings.primary_color, marginBottom: 6 }}>Coleções Alta Performance</p>
                    <h2 style={{ fontWeight: 900, color: 'white', fontSize: 20, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 8 }}>
                      {settings.hero_title || 'VISTA SUA IDENTIDADE'}
                    </h2>
                    <p style={{ fontSize: 9, color: '#64748b', marginBottom: 14, lineHeight: 1.5, maxWidth: 200 }}>
                      {settings.hero_subtitle}
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.accent_color})`, color: 'white', padding: '7px 14px', borderRadius: 8, fontSize: 9, fontWeight: 800 }}>
                      Explorar Coleções →
                    </div>
                  </div>

                  {/* Products mini */}
                  <div style={{ padding: '0 12px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[settings.primary_color || '#7c3aed', '#0ea5e9', '#ec4899'].map((c, i) => (
                      <div key={i} style={{ background: `linear-gradient(135deg, rgba(13,15,23,0.9), ${c}15)`, borderRadius: 10, padding: '12px 10px', border: `1px solid ${c}20` }}>
                        <div style={{ width: '100%', height: 40, background: `${c}15`, borderRadius: 8, marginBottom: 6 }} />
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, width: '50%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={saveSettings} disabled={saving} style={{ ...btnPrimaryStyle, width: '100%', justifyContent: 'center', marginTop: 16 }}>
                {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                {saving ? 'Salvando...' : 'Aplicar na Loja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CONFIGURAÇÕES TAB ══════════ */}
      {activeTab === 'configuracoes' && (
        <div style={{ maxWidth: 680 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 24 }}>Configurações da Loja</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                title: 'Informações Gerais', icon: Globe,
                fields: [
                  { key: 'store_name', label: 'Nome da Loja', type: 'text' },
                  { key: 'store_subtitle', label: 'Subtítulo', type: 'text' },
                  { key: 'installments', label: 'Máx. Parcelas sem Juros', type: 'number' },
                ],
              },
              {
                title: 'Contatos e Redes', icon: Phone,
                fields: [
                  { key: 'whatsapp', label: 'WhatsApp (somente números)', type: 'text', placeholder: '5511999999999' },
                  { key: 'email', label: 'E-mail de Contato', type: 'email' },
                  { key: 'instagram', label: 'Instagram (@user)', type: 'text', placeholder: '@gmzperformance' },
                ],
              },
            ].map(section => (
              <div key={section.title} style={{ background: 'rgba(13,15,23,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <section.icon size={14} color="#7c3aed" /> {section.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      <input
                        style={inputStyle} type={field.type}
                        placeholder={(field as any).placeholder || ''}
                        value={(settings as any)[field.key] || ''}
                        onChange={e => setSettings(s => ({ ...s, [field.key]: field.type === 'number' ? parseInt(e.target.value) : e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={saveSettings} disabled={saving} style={{ ...btnPrimaryStyle, justifyContent: 'center', padding: '14px' }}>
              {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManager;
