import React, { useState } from 'react';
import {
  Clock, Calendar, ChevronRight, PackageCheck, AlertCircle, CheckCircle2,
  Hammer, Search, LayoutTemplate, X, Printer, FileText, Save, Edit2, Check,
  ArrowDownCircle, Package, DollarSign, TrendingUp, List, Settings2, Palette
} from 'lucide-react';
import { Order, OrderStatus, Product } from '../types';
import { printServiceOrder } from '../utils/printUtils';
import { orderService } from '../services/orderService';
import { notify } from './ui/toast';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
}

const SummaryCard = ({ title, count, subtitle, icon: Icon, colorClass, borderClass, textClass }: any) => (
  <div className={`bg-[#0b1221] p-5 rounded-2xl border ${borderClass} flex flex-col gap-3 relative overflow-hidden group hover:border-slate-600 transition-all`}>
    <div className="flex justify-between items-start">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorClass}`}>
        <Icon className={`w-5 h-5 ${textClass}`} />
      </div>
      <div className="flex flex-col items-end">
        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</span>
        <span className="text-2xl font-black text-white mt-1">{count}</span>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#1e293b]">
      <span className="text-slate-500 text-[10px] font-bold">{subtitle}</span>
      <div className={`w-6 h-0.5 rounded-full ${colorClass.includes('blue') ? 'bg-blue-500' : colorClass.includes('purple') ? 'bg-purple-500' : colorClass.includes('yellow') ? 'bg-yellow-500' : colorClass.includes('emerald') ? 'bg-emerald-500' : 'bg-cyan-500'}`}></div>
    </div>
  </div>
);

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-xl shadow-xl">
        <p className="text-slate-300 text-xs font-bold mb-1">{label}</p>
        <p className="text-[#8b5cf6] font-black">{`R$ ${payload[0].value.toLocaleString('pt-BR')}`}</p>
      </div>
    );
  }
  return null;
};

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
      .filter(o => (o.createdAt || '').startsWith(currentMonth))
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
      notify.success('Alterações salvas com sucesso!');
    } catch (error) {
      console.error("Failed to update order", error);
      notify.error('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-2">
        <div>
          <p className="text-slate-400 text-sm font-bold mb-1">Olá, Admin!</p>
          <h2 className="text-3xl font-black text-white tracking-tight mb-1">Dashboard</h2>
          <p className="text-slate-500 text-xs font-medium">Visão geral da sua estamparia em tempo real.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#0b1221] px-4 py-2.5 rounded-xl flex items-center gap-3 border border-[#1e293b] cursor-pointer hover:border-slate-600 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300">{new Date().toLocaleDateString('pt-BR')}</span>
            <ChevronRight className="w-3 h-3 text-slate-500 rotate-90" />
          </div>
        </div>
      </header>

      {/* 5 METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Recebidos"
          count={counts.received.toString().padStart(2, '0')}
          subtitle="Hoje"
          icon={ArrowDownCircle}
          colorClass="bg-blue-500/10"
          borderClass="border-[#1e293b]"
          textClass="text-blue-500"
        />
        <SummaryCard
          title="Entregas (7 Dias)"
          count={sevenDaysCount.toString().padStart(2, '0')}
          subtitle="Próximos 7 dias"
          icon={Package}
          colorClass="bg-purple-500/10"
          borderClass="border-[#1e293b]"
          textClass="text-purple-500"
        />
        <SummaryCard
          title="Faturamento (Mês)"
          count={`R$ ${revenueMonth.toLocaleString('pt-BR')}`}
          subtitle="Este mês"
          icon={DollarSign}
          colorClass="bg-yellow-500/10"
          borderClass="border-[#1e293b]"
          textClass="text-yellow-500"
        />
        <SummaryCard
          title="Lucro (Mês)"
          count={`R$ ${profitMonth.toLocaleString('pt-BR')}`}
          subtitle="Este mês"
          icon={TrendingUp}
          colorClass="bg-emerald-500/10"
          borderClass="border-[#1e293b]"
          textClass="text-emerald-500"
        />
        <SummaryCard
          title="Fila de Produção"
          count={`R$ ${pendingRevenue.toLocaleString('pt-BR')}`}
          subtitle="Em produção"
          icon={List}
          colorClass="bg-cyan-500/10"
          borderClass="border-[#1e293b]"
          textClass="text-cyan-500"
        />
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FLUXO DE PRODUÇÃO */}
        <div className="lg:col-span-2 bg-[#0b1221] rounded-2xl border border-[#1e293b] p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">Fluxo de Produção</h3>
              <p className="text-xs text-slate-500 mt-1">Acompanhe o andamento dos pedidos</p>
            </div>

          </div>

          <div className="flex items-center justify-between relative z-10 px-4 mt-12 pb-4">
             {/* Background Line */}
             <div className="absolute top-6 left-10 right-10 h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 -z-10"></div>
             
             {[
               { label: 'Pedido recebido', count: counts.received, color: 'blue', icon: PackageCheck },
               { label: 'Arte e Finalização', count: counts.finalization, color: 'purple', icon: Palette },
               { label: 'Em produção', count: counts.production, color: 'pink', icon: Hammer },
               { label: 'Finalizado', count: counts.finished, color: 'emerald', icon: CheckCircle2 }
             ].map((step, i) => {
                const colorMap: any = {
                  blue: 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] text-blue-100',
                  purple: 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100',
                  pink: 'bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-pink-100',
                  yellow: 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-amber-100',
                  emerald: 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-emerald-100',
                };
                const textColorMap: any = { blue: 'text-blue-400', purple: 'text-purple-400', pink: 'text-pink-400', yellow: 'text-amber-400', emerald: 'text-emerald-400' };
                
                return (
                  <div key={i} className="flex flex-col items-center gap-4 relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[step.color]} relative z-10`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-300 font-bold mb-1">{step.label}</p>
                      <p className={`text-lg font-black ${textColorMap[step.color]}`}>{step.count}</p>
                    </div>
                  </div>
                );
             })}
          </div>
        </div>

        {/* PRODUÇÃO POR STATUS */}
        <div className="bg-[#0b1221] rounded-2xl border border-[#1e293b] p-6 shadow-xl">
          <h3 className="text-sm font-black text-white tracking-widest uppercase">Produção por Status</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">Distribuição atual dos pedidos</p>
          
          <div className="flex items-center justify-between">
            <div className="w-[120px] h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Em produção', value: counts.production },
                      { name: 'Aguardando', value: counts.received },
                      { name: 'Finalizados', value: counts.finished },
                      { name: 'Cancelados', value: 0 },
                    ]}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={55}
                    paddingAngle={2} dataKey="value" stroke="none"
                  >
                    {[counts.production, counts.received, counts.finished, 0].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                { label: 'Em produção', count: counts.production, color: 'bg-blue-500' },
                { label: 'Aguardando', count: counts.received, color: 'bg-purple-500' },
                { label: 'Finalizados', count: counts.finished, color: 'bg-emerald-500' },
                { label: 'Cancelados', count: 0, color: 'bg-pink-500' },
              ].map((item, i) => {
                const total = counts.production + counts.received + counts.finished;
                const pct = total === 0 ? 0 : Math.round((item.count / total) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-slate-300 w-20">{item.label}</span>
                    <span className="text-white font-black w-6 text-right">{item.count}</span>
                    <span className="text-slate-500 text-[10px]">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AGENDA DE ENTREGAS */}
        <div className="bg-[#0b1221] rounded-2xl border border-[#1e293b] p-6 shadow-xl overflow-hidden flex flex-col h-[400px]">
          <div className="flex justify-between items-start mb-6 shrink-0">
            <div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">Agenda de Entregas</h3>
              <p className="text-xs text-slate-500 mt-1">Acompanhamento dos prazos de pedidos</p>
            </div>
            <div className="text-[10px] font-black text-[#6366f1] bg-[#6366f1]/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              CRONOGRAMA
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar relative flex flex-col gap-3">
             {sortedOrders.map((item, i) => {
                  if (item.status === OrderStatus.FINISHED) return null; // Esconder finalizados da agenda

                  const deliveryDate = new Date(item.deliveryDate || 0);
                  const isLate = deliveryDate.getTime() < new Date().getTime();
                  const isSoon = deliveryDate.getTime() < new Date().getTime() + 3 * 24 * 60 * 60 * 1000;
                  
                  let dateColor = 'text-slate-400';
                  let bgCard = 'bg-[#0f172a]';
                  if (isLate) { dateColor = 'text-rose-500'; bgCard = 'bg-rose-500/5 border-rose-500/20'; }
                  else if (isSoon) { dateColor = 'text-amber-500'; bgCard = 'bg-amber-500/5 border-amber-500/20'; }
                  
                  let statusColor = 'text-slate-400 bg-slate-800';
                  let statusLabel: string = item.status;
                  if (item.status === OrderStatus.IN_PRODUCTION) { statusColor = 'text-blue-400 bg-blue-500/10'; statusLabel = 'Produção'; }
                  if (item.status === OrderStatus.RECEIVED) { statusColor = 'text-amber-400 bg-amber-500/10'; statusLabel = 'Aguardando'; }
                  if (item.status === OrderStatus.FINALIZATION) { statusColor = 'text-yellow-400 bg-yellow-500/10'; statusLabel = 'Finalização'; }
                  if (item.status === OrderStatus.SUBLIMATION) { statusColor = 'text-purple-400 bg-purple-500/10'; statusLabel = 'Aprovação'; }
                  
                  const day = item.deliveryDate ? item.deliveryDate.split('-')[2] : '--';
                  const month = item.deliveryDate ? item.deliveryDate.split('-')[1] : '--';

                  return (
                    <div key={item.id} onClick={() => handleOrderClick(item)} className={`border border-[#1e293b] rounded-2xl p-3 flex items-center gap-4 cursor-pointer hover:border-slate-600 transition-colors group ${bgCard}`}>
                      {/* Data Box */}
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border border-current/10 ${isLate ? 'bg-rose-500/10' : isSoon ? 'bg-amber-500/10' : 'bg-slate-800'} ${dateColor}`}>
                         <span className="text-2xl font-black leading-none">{day}</span>
                         <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">{month}</span>
                      </div>
                      
                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-black truncate group-hover:text-emerald-400 transition-colors">{item.clientName}</span>
                            <span className="text-slate-500 text-[10px] font-bold">#{item.orderNumber}</span>
                         </div>
                         <div className="text-slate-500 text-[10px] uppercase truncate">
                            {item.items && item.items.length > 0 ? products.find(p => p.id === item.items![0].productId)?.name || 'Produto' : 'Diversos'}
                         </div>
                      </div>

                      {/* Status */}
                      <div className="shrink-0 hidden sm:block">
                         <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
                           {statusLabel}
                         </span>
                      </div>
                    </div>
                  );
             })}
          </div>
        </div>

        {/* FATURAMENTO DOS ÚLTIMOS 6 MESES */}
        <div className="bg-[#0b1221] rounded-2xl border border-[#1e293b] p-6 shadow-xl flex flex-col h-[400px]">
          <div className="flex justify-between items-start mb-6 shrink-0">
            <div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">Faturamento dos últimos 6 meses</h3>
              <p className="text-xs text-slate-500 mt-1">Análise de faturamento mensal</p>
            </div>

          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', value: 18200 },
                { name: 'Fev', value: 22800 },
                { name: 'Mar', value: 19600 },
                { name: 'Abr', value: 27400 },
                { name: 'Mai', value: 28500 },
                { name: 'Jun', value: 31200 },
              ]} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" dot={{ stroke: '#8b5cf6', strokeWidth: 2, fill: '#0b1221', r: 4 }} activeDot={{ r: 6, fill: '#8b5cf6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1221] rounded-2xl w-full max-w-2xl border border-[#1e293b] overflow-hidden shadow-2xl shadow-black/60 animate-in zoom-in-95">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0f172a]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-950">
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
                      className="w-full bg-[#0b1221] border border-[#1e293b] rounded-xl px-4 py-2 text-slate-100 focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 outline-none color-scheme-dark"
                    />
                  ) : (
                    <p className="text-lg font-bold text-slate-100">{new Date(selectedOrder.deliveryDate).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>

              <div className={`p-6 rounded-3xl border transition-all ${new Date(selectedOrder.deliveryDate) < new Date() && selectedOrder.status !== OrderStatus.FINISHED
                ? 'bg-rose-500/5 border-rose-500/20'
                : 'bg-white/5 border-[#1e293b]'
                }`}>
                <div className="flex justify-between items-center mb-4">
                  <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${new Date(selectedOrder.deliveryDate) < new Date() && selectedOrder.status !== OrderStatus.FINISHED
                    ? 'text-rose-400'
                    : 'text-white'
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
                    className="w-full bg-[#0b1221] border border-[#1e293b] rounded-2xl p-4 text-sm text-slate-200 focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 outline-none min-h-[100px] resize-none"
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
                    className="w-full bg-[#0b1221] border border-[#1e293b] rounded-2xl p-4 text-sm text-slate-200 focus:border-slate-600 focus:ring-1 focus:ring-slate-700/50 outline-none min-h-[120px] resize-none"
                  />
                ) : (
                  <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#1e293b] text-sm text-slate-300 whitespace-pre-line min-h-[100px]">
                    {selectedOrder.internalNotes || 'Sem observações cadastradas.'}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-[#1e293b] flex justify-between gap-4">
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
                        className="px-6 py-4 bg-[#0f172a] text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white"
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
                      className="px-10 py-4 bg-[#8B5CF6] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg shadow-white/5"
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
