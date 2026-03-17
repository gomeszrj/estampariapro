import React, { useState } from 'react';
import {
  Palette,
  Check,
  Clock,
  CheckCircle2,
  Circle,
  Search,
  Image,
  Hash,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { STATUS_CONFIG } from '../constants';

interface ArtQueueProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const ArtQueue: React.FC<ArtQueueProps> = ({ orders, setOrders }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Show all non-finished, non-support orders — art team cares about every active order
  const queueOrders = orders.filter(o =>
    o.origin !== 'support' &&
    o.status !== OrderStatus.FINISHED &&
    o.status !== OrderStatus.STORE_REQUEST &&
    o.status !== OrderStatus.STORE_CONFERENCE &&
    o.status !== OrderStatus.STORE_CHECKED
  ).filter(o =>
    !search ||
    o.clientName.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNumber.includes(search)
  );

  // Sort: not started → art created (waiting approval) → done
  const sorted = [...queueOrders].sort((a, b) => {
    const scoreA = (a.artCreated ? 1 : 0) + (a.artAwaitingApproval ? 1 : 0);
    const scoreB = (b.artCreated ? 1 : 0) + (b.artAwaitingApproval ? 1 : 0);
    return scoreA - scoreB;
  });

  const pending = sorted.filter(o => !o.artCreated);
  const inProgress = sorted.filter(o => o.artCreated && !o.artAwaitingApproval);
  const awaitingApproval = sorted.filter(o => o.artCreated && o.artAwaitingApproval);

  const handleToggle = async (order: Order, field: 'artCreated' | 'artAwaitingApproval') => {
    const newValue = !order[field];
    setSavingId(order.id);
    try {
      const updateData: Partial<Order> = { [field]: newValue };
      // If unchecking artCreated, also uncheck artAwaitingApproval
      if (field === 'artCreated' && !newValue) {
        updateData.artAwaitingApproval = false;
      }
      await orderService.update(order.id, updateData);
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, ...updateData } : o
      ));
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status da arte.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRevisionChange = async (order: Order, value: string) => {
    try {
      await orderService.update(order.id, { layoutRevision: value });
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, layoutRevision: value } : o
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    {
      id: 'pending',
      label: 'Aguardando Arte',
      icon: Circle,
      color: 'text-slate-400',
      bgColor: 'bg-slate-800/30',
      borderColor: 'border-slate-700/50',
      dotColor: 'bg-slate-500',
      items: pending,
    },
    {
      id: 'inProgress',
      label: 'Arte Criada',
      icon: CheckCircle2,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-900/10',
      borderColor: 'border-indigo-700/30',
      dotColor: 'bg-indigo-500',
      items: inProgress,
    },
    {
      id: 'awaitingApproval',
      label: 'Aguardando Aprovação',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/10',
      borderColor: 'border-amber-700/30',
      dotColor: 'bg-amber-500',
      items: awaitingApproval,
    },
  ];

  const renderCard = (order: Order) => {
    const isExpanded = expandedId === order.id;
    const isSaving = savingId === order.id;
    const isLate = order.deliveryDate && new Date(order.deliveryDate) < new Date();

    return (
      <div
        key={order.id}
        className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ${
          isExpanded ? 'border-indigo-500/40' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Card Header */}
        <button
          className="w-full p-4 text-left flex items-start justify-between gap-3"
          onClick={() => setExpandedId(isExpanded ? null : order.id)}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">#{order.orderNumber}</span>
              <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase border tracking-widest ${STATUS_CONFIG[order.status]?.color}`}>
                {STATUS_CONFIG[order.status]?.label}
              </span>
            </div>
            <h4 className="font-bold text-slate-200 text-sm truncate">{order.clientName}</h4>
            {order.deliveryDate && (
              <div className={`flex items-center gap-1 text-[9px] font-bold mt-1 ${isLate ? 'text-rose-400' : 'text-slate-500'}`}>
                {isLate && <AlertTriangle className="w-3 h-3 shrink-0" />}
                <Calendar className="w-3 h-3 shrink-0" />
                <span>Entrega: {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Mini status tags */}
            {order.artCreated && (
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center" title="Arte Criada">
                <Check className="w-3 h-3 text-indigo-400" />
              </span>
            )}
            {order.artAwaitingApproval && (
              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center" title="Aguardando Aprovação">
                <Clock className="w-3 h-3 text-amber-400" />
              </span>
            )}
            {order.layoutRevision && (
              <span className="text-[9px] font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                Rev.{order.layoutRevision}
              </span>
            )}
            {isExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />
            }
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">

            {/* Layout Image Preview */}
            {order.layoutUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-3 py-2 border-b border-slate-800 flex items-center gap-2">
                  <Image className="w-3 h-3" /> Layout Aprovado
                </p>
                <img src={order.layoutUrl} alt="Layout" className="w-full max-h-48 object-contain p-2" />
              </div>
            )}

            {/* Revision / Layout Number */}
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Hash className="w-3 h-3" /> Número do Layout / Revisão
              </label>
              <input
                type="text"
                placeholder="Ex: LAYOUT 01, REV 02..."
                defaultValue={order.layoutRevision || ''}
                onBlur={(e) => handleRevisionChange(order, e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 uppercase focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 placeholder:normal-case placeholder:font-normal"
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 gap-3">
              {/* Arte Criada */}
              <button
                disabled={isSaving}
                onClick={() => handleToggle(order, 'artCreated')}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  order.artCreated
                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  order.artCreated ? 'bg-indigo-600 border-indigo-500' : 'border-slate-600'
                }`}>
                  {order.artCreated && <Check className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Arte Criada</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">O designer finalizou a arte para este pedido</p>
                </div>
              </button>

              {/* Aguardando Aprovação */}
              <button
                disabled={isSaving || !order.artCreated}
                onClick={() => order.artCreated && handleToggle(order, 'artAwaitingApproval')}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  !order.artCreated ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800' :
                  order.artAwaitingApproval
                    ? 'bg-amber-600/10 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  order.artAwaitingApproval ? 'bg-amber-500 border-amber-400' :
                  !order.artCreated ? 'border-slate-700' : 'border-slate-600'
                }`}>
                  {order.artAwaitingApproval && <Check className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Aguardando Aprovação</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Arte enviada ao cliente, aguardando retorno</p>
                </div>
              </button>
            </div>

            {/* Items preview */}
            {order.items.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Itens do Pedido</p>
                <div className="space-y-1.5">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 gap-2">
                      <span className="truncate min-w-0">{item.productName} — {item.gradeLabel} / {item.size}</span>
                      <span className="font-black text-slate-500 shrink-0">x{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">
                      + {order.items.length - 3} itens
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
              <Palette className="w-5 h-5 text-white" />
            </div>
            Fila de Arte
          </h2>
          <p className="text-slate-500 font-medium mt-1">Controle de criação e aprovação de layouts por pedido</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-center">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Pendentes</p>
            <p className="text-xl font-black text-slate-300">{pending.length}</p>
          </div>
          <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-2xl px-4 py-3 text-center">
            <p className="text-[8px] text-indigo-400 uppercase tracking-widest font-bold mb-1">Arte Criada</p>
            <p className="text-xl font-black text-indigo-400">{inProgress.length}</p>
          </div>
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-2xl px-4 py-3 text-center">
            <p className="text-[8px] text-amber-400 uppercase tracking-widest font-bold mb-1">Em Aprovação</p>
            <p className="text-xl font-black text-amber-400">{awaitingApproval.length}</p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
        <input
          type="text"
          placeholder="Pesquisar por cliente ou número do pedido..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:font-normal placeholder:text-slate-600"
        />
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className={`rounded-3xl border ${col.borderColor} ${col.bgColor} overflow-hidden`}>
            {/* Column Header */}
            <div className="p-5 border-b border-slate-800/50 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
              <col.icon className={`w-4 h-4 ${col.color}`} />
              <h3 className={`text-xs font-black uppercase tracking-widest ${col.color}`}>
                {col.label}
              </h3>
              <span className={`ml-auto text-xs font-black ${col.color} bg-slate-900/50 px-2 py-0.5 rounded-lg`}>
                {col.items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-4 space-y-3 min-h-[200px]">
              {col.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-700 opacity-60">
                  <Palette className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum pedido</p>
                </div>
              ) : (
                col.items.map(renderCard)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtQueue;
