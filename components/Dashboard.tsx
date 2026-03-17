
import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  ChevronRight,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  Hammer,
  Search,
  LayoutTemplate,
  X,
  Printer,
  FileText,
  Save,
  Edit2,
  Check
} from 'lucide-react';
import { Order, OrderStatus, Product } from '../types';
import { printServiceOrder } from '../utils/printUtils';
import { orderService } from '../services/orderService';

interface DashboardProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
}

const SummaryCard = ({ title, count, icon: Icon, color, textColor }: any) => (
  <div className={`bg-[#0f172a] p-6 rounded-[2rem] border border-slate-800 flex items-center gap-5 transition-all hover:border-slate-700 hover:translate-y-[-4px] group`}>
    <div className={`p-4 rounded-2xl ${color} shadow-lg transition-transform group-hover:scale-110`}>
      <Icon className={`w-6 h-6 ${textColor}`} />
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-100 tracking-tighter">{count}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ orders, setOrders, products }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState({
    delayReason: '',
    deliveryDate: '',
    internalNotes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Financial Quick Stats
  const revenueMonth = React.useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return orders
      .filter(o => o.createdAt.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [orders]);

  // Profit Calculation
  const profitMonth = React.useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthOrders = orders.filter(o => (o.createdAt || '').startsWith(currentMonth));

    let totalCost = 0;
    monthOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && product.costPrice) {
          totalCost += ((item.quantity || 0) * product.costPrice);
        }
      });
    });

    return revenueMonth - totalCost;
  }, [orders, products, revenueMonth]);

  const pendingRevenue = React.useMemo(() => {
    return orders
      .filter(o => o.status !== OrderStatus.FINISHED)
      .reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [orders]);

  const loadingRevenue = false;

  const counts = {
    received: orders.filter(o => o.status === OrderStatus.RECEIVED).length,
    finalization: orders.filter(o => o.status === OrderStatus.FINALIZATION).length,
    production: orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length,
    finished: orders.filter(o => o.status === OrderStatus.FINISHED).length,
  };

  const today = new Date().toISOString().split('T')[0];
  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => new Date(a.deliveryDate || 0).getTime() - new Date(b.deliveryDate || 0).getTime());
  }, [orders]);

  const sevenDaysCount = React.useMemo(() => {
    return orders.filter(o => {
      const diff = Math.ceil((new Date(o.deliveryDate || 0).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return diff >= 0 && diff <= 7 && o.status !== OrderStatus.FINISHED;
    }).length;
  }, [orders]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setTempData({
      delayReason: order.delayReason || '',
      deliveryDate: order.deliveryDate || '',
      internalNotes: order.internalNotes || ''
    });
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);

    try {
      const updates = {
        delayReason: tempData.delayReason,
        deliveryDate: tempData.deliveryDate,
        internalNotes: tempData.internalNotes
      };

      // 1. Update Supabase
      await orderService.update(selectedOrder.id, updates);

      // 2. Update Local State (Optimistic or Confirmed)
      setOrders(prev => prev.map(o =>
        o.id === selectedOrder.id ? { ...o, ...updates } : o
      ));

      setSelectedOrder({ ...selectedOrder, ...updates });
      setIsEditing(false);
      alert("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Failed to update order", error);
      alert("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase mb-2">Agenda de Produção</h2>
          <p className="text-slate-500 font-medium max-w-xl">Gerenciamento dinâmico de prazos e fluxo industrial em tempo real.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3 border border-slate-700">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <SummaryCard
          title="Recebidos"
          count={counts.received.toString().padStart(2, '0')}
          icon={AlertCircle}
          color="bg-slate-800/50"
          textColor="text-slate-400"
        />
        <SummaryCard
          title="Entregas (7 Dias)"
          count={sevenDaysCount.toString().padStart(2, '0')}
          icon={LayoutTemplate}
          color="bg-indigo-500/10"
          textColor="text-indigo-400"
        />
        <SummaryCard
          title="Faturamento (Mês)"
          count={`R$ ${loadingRevenue ? '...' : revenueMonth.toLocaleString('pt-BR')}`}
          icon={Hammer}
          color="bg-amber-500/10"
          textColor="text-amber-500"
        />
        <SummaryCard
          title="Lucro (Mês)"
          count={`R$ ${profitMonth.toLocaleString('pt-BR')}`}
          icon={CheckCircle2}
          color="bg-emerald-500/10"
          textColor="text-emerald-500"
        />
        <SummaryCard
          title="Fila de Produção"
          count={`R$ ${loadingRevenue ? '...' : pendingRevenue.toLocaleString('pt-BR')}`}
          icon={CheckCircle2}
          color="bg-emerald-500/10"
          textColor="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-3 uppercase tracking-tighter">
              <PackageCheck className="w-5 h-5 text-indigo-400" />
              Cronograma de Entregas — Pedidos Ativos
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <input
                type="text"
                placeholder="Filtrar agenda..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Active orders only — FINISHED excluded */}
          {(() => {
            const activeOrders = sortedOrders.filter(o => o.status !== OrderStatus.FINISHED);
            if (activeOrders.length === 0) {
              return <div className="p-16 text-center text-slate-600 font-bold">Nenhum pedido ativo no momento.</div>;
            }
            return (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeOrders.map((item) => {
                  const isToday = item.deliveryDate === today;
                  const isLate = new Date(item.deliveryDate) < new Date() && item.status !== OrderStatus.FINISHED;
                  const daysLeft = Math.ceil((new Date(item.deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOrderClick(item)}
                      className={`relative flex flex-col p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] group ${
                        isLate
                          ? 'bg-rose-950/20 border-rose-700/40 hover:border-rose-500/60'
                          : isToday
                          ? 'bg-indigo-950/30 border-indigo-500/40 hover:border-indigo-400/60'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {/* Top row: date badge + status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 shrink-0 ${
                          isLate ? 'bg-rose-600 border-rose-500 shadow-lg shadow-rose-600/20'
                          : isToday ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-900 border-slate-700'
                        }`}>
                          <span className={`text-[8px] font-black uppercase tracking-wider ${isLate || isToday ? 'text-white/70' : 'text-slate-500'}`}>
                            {isToday ? 'Hoje' : isLate ? 'Atras.' : 'Dia'}
                          </span>
                          <span className={`text-xl font-black leading-none ${isLate || isToday ? 'text-white' : 'text-slate-200'}`}>
                            {item.deliveryDate ? item.deliveryDate.split('-')[2] : '--'}
                          </span>
                          <span className={`text-[8px] font-bold ${isLate || isToday ? 'text-white/60' : 'text-slate-600'}`}>
                            {item.deliveryDate ? new Date(item.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }) : ''}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-slate-100 text-sm truncate group-hover:text-indigo-400 transition-colors" title={item.clientName}>
                            {item.clientName}
                          </h4>
                          {item.clientTeam && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase tracking-widest">
                              {item.clientTeam}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-500 font-bold mt-1">#{item.orderNumber}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-indigo-400 transition-colors" />
                      </div>

                      {/* Bottom row: value + days + status */}
                      <div className="flex items-center gap-2 flex-wrap mt-auto pt-3 border-t border-slate-800/50">
                        <span className="text-xs font-black text-slate-400">
                          R$ {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-700">•</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isLate ? 'text-rose-400' : isToday ? 'text-indigo-400' : daysLeft <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {isLate ? `${Math.abs(daysLeft)}d atrasado` : isToday ? 'Hoje!' : `${daysLeft}d restantes`}
                        </span>
                        <span className="ml-auto text-[8px] font-black px-2 py-0.5 rounded-lg border bg-slate-900 border-slate-700 text-slate-400 uppercase tracking-wide">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-2xl border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Pedido #{selectedOrder.orderNumber}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Painel de Edição Rápida</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="text-lg font-bold text-slate-100">{selectedOrder.clientName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Data de Entrega</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={tempData.deliveryDate}
                      onChange={(e) => setTempData({ ...tempData, deliveryDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none color-scheme-dark"
                    />
                  ) : (
                    <p className="text-lg font-bold text-slate-100">{new Date(selectedOrder.deliveryDate).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>

              <div className={`p-6 rounded-3xl border transition-all ${new Date(selectedOrder.deliveryDate) < new Date() && selectedOrder.status !== OrderStatus.FINISHED
                ? 'bg-rose-500/5 border-rose-500/20'
                : 'bg-indigo-500/5 border-indigo-500/20'
                }`}>
                <div className="flex justify-between items-center mb-4">
                  <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${new Date(selectedOrder.deliveryDate) < new Date() && selectedOrder.status !== OrderStatus.FINISHED
                    ? 'text-rose-400'
                    : 'text-indigo-400'
                    }`}>
                    <AlertCircle className="w-3 h-3" /> Motivo do Atraso / Justificativa
                  </p>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[10px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Editar Informações
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    value={tempData.delayReason}
                    onChange={(e) => setTempData({ ...tempData, delayReason: e.target.value })}
                    placeholder="Descreva o motivo do atraso ou nota de produção..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-300 italic">
                    {selectedOrder.delayReason || 'Nenhum motivo de atraso registrado.'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Instruções de Personalização / Notas Internas</p>
                {isEditing ? (
                  <textarea
                    value={tempData.internalNotes}
                    onChange={(e) => setTempData({ ...tempData, internalNotes: e.target.value })}
                    placeholder="Grade de nomes, observações técnicas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] resize-none"
                  />
                ) : (
                  <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 text-sm text-slate-300 whitespace-pre-line min-h-[100px]">
                    {selectedOrder.internalNotes || 'Sem observações cadastradas.'}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-between gap-4">
                <button
                  onClick={() => printServiceOrder(selectedOrder)}
                  className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
                >
                  <Printer className="w-4 h-4" /> Imprimir OS
                </button>

                <div className="flex gap-3 flex-1 justify-end">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-4 bg-slate-900 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                      >
                        <span>{isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</span>
                        {isSaving ? 'Salvando...' : 'Confirmar Alterações'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Concluído
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
