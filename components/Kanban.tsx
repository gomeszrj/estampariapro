import React from 'react';
import { Order, OrderStatus } from '../types';
import { STATUS_CONFIG } from '../constants';
import { Clock, AlertCircle, Plus, Calendar as CalendarIcon, RotateCw, CheckCircle2, X, Cog, Settings, Package, ChevronRight, ChevronLeft, ArrowRightCircle, Printer, Search, Users, Download, Upload, FileCode, ImageIcon, Loader2 } from 'lucide-react';
import { printServiceOrder } from '../utils/printUtils';
import { getWhatsAppLink, getStatusUpdateMessage } from '../utils/whatsappUtils';
import { clientService } from '../services/clientService';
import { orderService } from '../services/orderService';
import { whatsappService } from '../services/whatsappService';
import { Client } from '../types';
import { notify } from './ui/toast';

const statuses = [
  OrderStatus.RECEIVED,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.FINALIZATION,
  OrderStatus.FINISHED,
];

interface KanbanProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setActiveView?: (view: string) => void;
}

interface KanbanCardProps {
  order: Order;
  onMove: (id: string, newStatus: OrderStatus) => void;
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const KanbanCard: React.FC<KanbanCardProps> = React.memo(({ order, onMove }) => {
  const isLate = new Date(order.deliveryDate) < new Date() && order.status !== OrderStatus.FINISHED;
  const currentStatusIndex = statuses.indexOf(order.status);

  const moveNext = () => {
    if (currentStatusIndex < statuses.length - 1) {
      onMove(order.id, statuses[currentStatusIndex + 1]);
    }
  };

  const movePrev = () => {
    if (currentStatusIndex > 0) {
      onMove(order.id, statuses[currentStatusIndex - 1]);
    }
  };

  // Extract primary item
  const primaryItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const totalQuantity = order.items ? order.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
  
  // Fake progress calculation
  const progressMap = {
    [OrderStatus.RECEIVED]: 0,
    [OrderStatus.IN_PRODUCTION]: 60,
    [OrderStatus.SUBLIMATION]: 80,
    [OrderStatus.FINALIZATION]: 90,
    [OrderStatus.FINISHED]: 100,
  };
  const progress = progressMap[order.status] || 0;
  
  // Define border and progress color based on status
  let themeColor = 'text-slate-500';
  let progressColor = 'bg-slate-500';
  let borderColor = 'border-[#1e293b]';
  let avatarBg = 'bg-slate-800';

  if (order.status === OrderStatus.RECEIVED) {
    themeColor = 'text-purple-400';
    progressColor = 'bg-purple-500';
    borderColor = 'border-purple-500/20';
    avatarBg = 'bg-purple-900/40 text-purple-200';
  } else if (order.status === OrderStatus.IN_PRODUCTION) {
    themeColor = 'text-blue-400';
    progressColor = 'bg-blue-500';
    borderColor = 'border-blue-500/20';
    avatarBg = 'bg-blue-900/40 text-blue-200';
  } else if (order.status === OrderStatus.SUBLIMATION) {
    themeColor = 'text-orange-400';
    progressColor = 'bg-orange-500';
    borderColor = 'border-orange-500/20';
    avatarBg = 'bg-orange-900/40 text-orange-200';
  } else if (order.status === OrderStatus.FINALIZATION) {
    themeColor = 'text-emerald-400';
    progressColor = 'bg-emerald-500';
    borderColor = 'border-emerald-500/20';
    avatarBg = 'bg-emerald-900/40 text-emerald-200';
  } else if (order.status === OrderStatus.FINISHED) {
    themeColor = 'text-emerald-500';
    progressColor = 'bg-emerald-500';
    borderColor = 'border-emerald-500/30';
    avatarBg = 'bg-emerald-900/40 text-emerald-200';
  }

  if (isLate) {
    borderColor = 'border-rose-500/40';
  }

  const finishedTime = order.status === OrderStatus.FINISHED ? "10:30" : null;

  return (
    <div className={`bg-[#05080E] rounded-xl border ${borderColor} p-3 relative group transition-all hover:bg-[#0b1221] hover:border-slate-600`}>
      <div className="flex gap-3">
        {/* Left image column */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#1e293b] shrink-0 border border-[#1e293b]/50">
          {order.layoutUrls && order.layoutUrls.length > 0 ? (
            <img src={order.layoutUrls[0]} alt="Produto" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
               <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
            </div>
          )}
        </div>
        
        {/* Right info column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[10px] font-black ${themeColor}`}>#{order.orderNumber}</span>
              <span className="text-[10px] font-black text-slate-100 truncate">{order.clientName}</span>
            </div>
            
            <p className="text-[9px] font-medium text-slate-400 truncate leading-tight">
              {primaryItem ? primaryItem.productName : 'Diversos'}
            </p>
            {primaryItem?.selectedAddons && primaryItem.selectedAddons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {primaryItem.selectedAddons.map(a => (
                   <span key={a.id} className="text-[7.5px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20">{a.name}</span>
                ))}
              </div>
            )}
            <p className="text-[9px] font-bold text-slate-300 mt-0.5">
              {totalQuantity > 0 ? `${totalQuantity} un.` : 'Qtd não def.'}
            </p>
          </div>

          {order.status !== OrderStatus.FINISHED ? (
             <div className="text-[9px] font-black text-slate-500 mt-1">
                <span className={themeColor}>Pedido #{order.orderNumber}</span>
             </div>
          ) : (
            <div className="text-[9px] font-black text-slate-500 mt-1">
               <span className={themeColor}>Pedido #{order.orderNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Row */}
      <div className="mt-3 flex items-center justify-between">
        {order.status !== OrderStatus.FINISHED ? (
          <div className="flex-1 mr-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] font-black text-slate-400 uppercase">
                {STATUS_CONFIG[order.status]?.label || order.status}
              </span>
              <span className="text-[8px] font-bold text-slate-500">{progress}%</span>
            </div>
            <div className="h-1 w-full bg-[#1e293b] rounded-full overflow-hidden">
              <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-1 text-[9px] font-black text-slate-400">
            Concluído às {finishedTime || '00:00'}
          </div>
        )}
        
        {order.status === OrderStatus.FINISHED ? (
           <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0">
             <CheckCircle2 className="w-3 h-3 text-emerald-500" />
           </div>
        ) : (
          <div className={`w-5 h-5 rounded-full ${avatarBg} border border-white/5 flex items-center justify-center shrink-0 text-[8px] font-black uppercase tracking-tighter`}>
            {getInitials(order.clientName)}
          </div>
        )}
      </div>

      {/* Recebido date (Aguardando status extra) */}
      {order.status === OrderStatus.RECEIVED && (
         <div className="mt-2 text-[8px] text-slate-500 font-bold">
           Recebido em {new Date(order.createdAt || order.deliveryDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
         </div>
      )}

      {/* Hidden Navigation actions on hover */}
      <div className="absolute top-1/2 -translate-y-1/2 -right-8 flex flex-col gap-1 opacity-0 group-hover:right-1 group-hover:opacity-100 transition-all z-10">
        {currentStatusIndex > 0 && (
          <button onClick={(e) => { e.stopPropagation(); movePrev(); }} className="p-1 bg-[#1e293b] text-white rounded-full hover:bg-slate-700 shadow-xl">
             <ChevronLeft className="w-3 h-3" />
          </button>
        )}
        {currentStatusIndex < statuses.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); moveNext(); }} className="p-1 bg-[#4f46e5] text-white rounded-full hover:bg-indigo-500 shadow-xl">
             <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});

interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  onMove: (id: string, newStatus: OrderStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, orders, onMove }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'text-slate-400' };
  const columnOrders = orders.filter((o: Order) => o.status === status);

  let icon = <Clock className="w-3 h-3" />;
  let dotColor = 'bg-slate-400';
  let headerColor = 'text-slate-300';

  if (status === OrderStatus.RECEIVED) {
    icon = <Clock className="w-3 h-3" />;
    dotColor = 'bg-purple-500';
    headerColor = 'text-slate-100';
  } else if (status === OrderStatus.IN_PRODUCTION) {
    icon = <RotateCw className="w-3 h-3" />;
    dotColor = 'bg-blue-500';
    headerColor = 'text-slate-100';
  } else if (status === OrderStatus.SUBLIMATION) {
    icon = <Cog className="w-3 h-3" />;
    dotColor = 'bg-orange-500';
    headerColor = 'text-slate-100';
  } else if (status === OrderStatus.FINALIZATION) {
    icon = <CheckCircle2 className="w-3 h-3" />;
    dotColor = 'bg-emerald-400';
    headerColor = 'text-slate-100';
  } else if (status === OrderStatus.FINISHED) {
    icon = <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    dotColor = 'bg-emerald-500';
    headerColor = 'text-slate-100';
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#0b1221]/80 rounded-2xl border border-[#1e293b]">
      {/* Column Header */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          {status === OrderStatus.FINISHED ? (
             <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
             <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] ${dotColor}`}></div>
          )}
          <h3 className={`font-black text-[10px] tracking-widest uppercase ${headerColor}`}>
            {status === OrderStatus.FINISHED ? 'Concluídos Hoje' : config.label}
          </h3>
        </div>
        <span className="text-[10px] font-black text-slate-400">{columnOrders.length}</span>
      </div>
      
      {/* Column Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {columnOrders.map((order) => (
          <KanbanCard key={order.id} order={order} onMove={onMove} />
        ))}
      </div>


    </div>
  );
};

const HOLIDAYS = [
  '2026-01-01', // Ano Novo
  '2026-02-17', // Carnaval
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência
  '2026-10-12', // Nossa Senhora Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-12-25', // Natal
  // 2027
  '2027-01-01', '2027-02-09', '2027-03-26', '2027-04-21', '2027-05-01', '2027-05-27', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-12-25'
];

const KanbanCalendar: React.FC<{ orders: Order[], onMove: (id: string, status: OrderStatus) => void }> = ({ orders, onMove }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

  return (
    <div className="flex-1 bg-[#05080e]/90 rounded-3xl border border-[#1e293b]/50 p-8 flex flex-col min-h-0 overflow-y-auto custom-scrollbar shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 uppercase tracking-widest">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <div className="flex gap-3">
          <button onClick={prevMonth} className="p-2.5 bg-[#0b1221] border border-[#1e293b] text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/10"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={nextMonth} className="p-2.5 bg-[#0b1221] border border-[#1e293b] text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/10"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      
      {/* Days of week */}
      <div className="grid grid-cols-7 gap-3 mb-4 relative z-10">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3 flex-1 relative z-10">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="bg-[#0b1221]/20 border border-dashed border-[#1e293b]/30 rounded-2xl"></div>;
          
          const dateStr = date.toISOString().split('T')[0];
          const dayOrders = orders.filter(o => (o.deliveryDate || '').startsWith(dateStr));
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const isHoliday = HOLIDAYS.includes(dateStr);

          return (
            <div key={dateStr} className={`relative bg-gradient-to-b from-[#0b1221] to-[#05080e] rounded-2xl border ${isToday ? 'border-[#6366f1] shadow-[0_0_25px_rgba(99,102,241,0.15)]' : isHoliday ? 'border-rose-500/30 bg-rose-950/10' : 'border-[#1e293b] hover:border-slate-700'} p-3 flex flex-col gap-2 min-h-[140px] transition-all duration-300 group`}>
              {/* Day Header */}
              <div className="flex justify-between items-start mb-1">
                {isHoliday ? (
                   <span className="text-[8px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">Feriado</span>
                ) : isToday ? (
                   <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">Hoje</span>
                ) : <span></span>}
                
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-black transition-all duration-300 ${isToday ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : isHoliday ? 'bg-rose-950 text-rose-500' : 'bg-[#1e293b]/50 text-slate-400 group-hover:bg-slate-800 group-hover:text-white'}`}>{date.getDate()}</div>
              </div>
              
              {/* Orders List */}
              <div className="flex flex-col gap-2 overflow-y-auto flex-1 custom-scrollbar pr-1 -mr-1">
                {dayOrders.map(order => {
                  let color = 'bg-[#0f172a]/50 text-slate-300 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600';
                  let dotColor = 'bg-slate-400';
                  
                  if (order.status === OrderStatus.RECEIVED) {
                     color = 'bg-purple-950/30 text-purple-300 border-purple-900/50 hover:bg-purple-900/40 hover:border-purple-500/60';
                     dotColor = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]';
                  }
                  else if (order.status === OrderStatus.IN_PRODUCTION) {
                     color = 'bg-blue-950/30 text-blue-300 border-blue-900/50 hover:bg-blue-900/40 hover:border-blue-500/60';
                     dotColor = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
                  }
                  else if (order.status === OrderStatus.FINALIZATION) {
                     color = 'bg-emerald-950/30 text-emerald-300 border-emerald-900/50 hover:bg-emerald-900/40 hover:border-emerald-500/60';
                     dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
                  }
                  else if (order.status === OrderStatus.FINISHED) {
                     color = 'bg-[#0b1221]/30 text-emerald-700/60 border-emerald-900/20 opacity-70 hover:opacity-100 hover:bg-[#0b1221]';
                     dotColor = 'bg-emerald-700/60';
                  }
                  
                  return (
                    <div key={order.id} className={`border rounded-xl p-2.5 flex flex-col gap-1.5 transition-all duration-300 cursor-pointer backdrop-blur-md relative overflow-hidden group/item ${color}`}>
                      <div className="flex items-center gap-2 relative z-10">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover/item:scale-125 ${dotColor}`}></div>
                        <span className="text-[10px] font-black truncate w-full tracking-wide drop-shadow-sm">{order.clientName}</span>
                      </div>
                      <div className="flex items-center justify-between pl-3.5 relative z-10">
                        <span className="text-[8.5px] font-bold opacity-60 tracking-[0.15em] uppercase">#{order.orderNumber}</span>
                        <span className="text-[8.5px] font-bold opacity-80 bg-black/30 px-1.5 py-0.5 rounded shadow-inner">{order.items?.length || 0} unid</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Kanban: React.FC<KanbanProps> = ({ orders, setOrders, setActiveView }) => {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [kanbanView, setKanbanView] = React.useState<'board' | 'calendar'>('board');

  React.useEffect(() => {
    clientService.getAll().then(setClients).catch(console.error);
  }, []);

  const handleMove = React.useCallback(async (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    try {
      await orderService.update(id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      notify.error('Erro ao mover pedido.');
    }
  }, [setOrders]);

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        (order.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  // Calculate Metrics
  const emProducao = orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length;
  const aguardando = orders.filter(o => o.status === OrderStatus.RECEIVED).length;
  const finalizados = orders.filter(o => o.status === OrderStatus.FINISHED).length;
  const atrasados = orders.filter(o => new Date(o.deliveryDate) < new Date() && o.status !== OrderStatus.FINISHED).length;

  return (
    <div className="h-[calc(100vh-1.5rem)] flex flex-col gap-4 animate-in slide-in-from-right-8 duration-150 bg-[#05080E] -m-4 sm:-m-8 p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">Produção</h2>
          <p className="text-[12px] text-slate-400 mt-1">Acompanhe o fluxo de produção em tempo real e gerencie as etapas.</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#0b1221] border border-[#1e293b] rounded-xl text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all"
            />
          </div>
          <button onClick={() => setKanbanView(kanbanView === 'calendar' ? 'board' : 'calendar')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1e293b] transition-colors text-[11px] font-black uppercase tracking-widest ${kanbanView === 'calendar' ? 'bg-[#1e293b] text-white' : 'text-slate-300 hover:bg-[#0b1221] hover:text-white'}`}>
            {kanbanView === 'calendar' ? <><Package className="w-4 h-4" /> Ver Quadro Kanban</> : <><CalendarIcon className="w-4 h-4" /> Ver calendário</>}
          </button>
          <button onClick={() => setActiveView?.('orders')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4f46e5] text-white hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)] text-[11px] font-black uppercase tracking-widest">
            <Plus className="w-4 h-4" /> Novo item de produção
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Metric Card 1 */}
        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
             <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Em Produção</h4>
            <div className="text-2xl font-black text-white leading-none">{emProducao}</div>
            <p className="text-[9px] text-slate-500 mt-0.5">Pedidos</p>
          </div>
          <div className="absolute bottom-0 right-4 w-6 h-0.5 bg-blue-500 rounded-full"></div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
             <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Aguardando</h4>
            <div className="text-2xl font-black text-white leading-none">{aguardando}</div>
            <p className="text-[9px] text-slate-500 mt-0.5">Pedidos</p>
          </div>
          <div className="absolute bottom-0 right-4 w-6 h-0.5 bg-purple-500 rounded-full"></div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
             <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Finalizados Hoje</h4>
            <div className="text-2xl font-black text-white leading-none">{finalizados}</div>
            <p className="text-[9px] text-slate-500 mt-0.5">Pedidos</p>
          </div>
          <div className="absolute bottom-0 right-4 w-6 h-0.5 bg-emerald-500 rounded-full"></div>
        </div>

        {/* Metric Card 5 */}
        <div className="bg-[#0b1221] rounded-2xl p-4 border border-[#1e293b] flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
             <X className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Atrasados</h4>
            <div className="text-2xl font-black text-white leading-none">{atrasados}</div>
            <p className="text-[9px] text-slate-500 mt-0.5">Pedidos</p>
          </div>
          <div className="absolute bottom-0 right-4 w-6 h-0.5 bg-rose-500 rounded-full"></div>
        </div>
      </div>



      {/* Kanban Board Container (No Scroll) */}
      {kanbanView === 'board' ? (
        <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              orders={filteredOrders}
              onMove={handleMove}
            />
          ))}
        </div>
      ) : (
        <KanbanCalendar orders={filteredOrders} onMove={handleMove} />
      )}
    </div>
  );
};

export default Kanban;
