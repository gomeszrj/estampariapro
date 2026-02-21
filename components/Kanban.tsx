
import React from 'react';
import { Order, OrderStatus } from '../types';
import { STATUS_CONFIG } from '../constants';
// Add missing Calendar icon import
import { Clock, AlertCircle, MoreHorizontal, ChevronRight, ChevronLeft, ArrowRightCircle, Printer, Calendar, Search, Users } from 'lucide-react';
import { printServiceOrder } from '../utils/printUtils';
import { getWhatsAppLink, getStatusUpdateMessage } from '../utils/whatsappUtils';
import { clientService } from '../services/clientService';
import { orderService } from '../services/orderService';
import { whatsappService } from '../services/whatsappService';
import { Client } from '../types';

const statuses = [
  OrderStatus.RECEIVED,
  OrderStatus.FINALIZATION,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.FINISHED,
];

interface KanbanProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

interface KanbanCardProps {
  order: Order;
  onMove: (id: string, newStatus: OrderStatus) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ order, onMove }) => {
  const isLate = new Date(order.deliveryDate) < new Date() && order.status !== OrderStatus.FINISHED;
  const isHighValue = order.totalValue > 1000;
  const daysToDeadline = Math.ceil((new Date(order.deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isApproaching = daysToDeadline >= 0 && daysToDeadline <= 2 && order.status !== OrderStatus.FINISHED;

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

  // Determine Border Color dynamically
  let borderClass = 'border-slate-800 hover:border-slate-700';
  let shadowClass = 'shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10';

  if (isLate) {
    borderClass = 'border-rose-900/50 shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:border-rose-500 hover:shadow-rose-900/20';
  } else if (isHighValue) {
    borderClass = 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-400 hover:shadow-amber-500/20';
  } else if (isApproaching) {
    borderClass = 'border-indigo-400/30 hover:border-indigo-400';
  }

  return (
    <div className={`bg-[#0f172a] p-5 rounded-[2.5rem] border ${borderClass} ${shadowClass} transition-all group space-y-5 relative overflow-hidden`}>
      {/* High Value Badge */}
      {isHighValue && (
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-amber-500/20 blur-2xl rounded-full pointer-events-none"></div>
        </div>
      )}

      <div className="flex justify-between items-start relative z-10">
        <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-2xl border border-indigo-500/20 tracking-widest uppercase">#{order.orderNumber}</span>
        <div className="flex gap-1">
          <button
            onClick={() => printServiceOrder(order)}
            className="text-slate-600 hover:text-indigo-400 p-1 transition-colors"
            title="Imprimir Ordem de Serviço"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button className="text-slate-600 hover:text-slate-400 p-1"><MoreHorizontal className="w-4 h-4" /></button>
        </div>
      </div>

      <div>
        <h4 className="font-black text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors text-xl leading-tight mb-1">{order.clientName}</h4>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5" />
            <span>R$ {order.totalValue.toLocaleString('pt-BR')}</span>
          </div>
          {order.clientTeam && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest">
              <Users className="w-3 h-3" />
              {order.clientTeam}
            </div>
          )}
        </div>
      </div>

      <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isLate ? 'bg-rose-950/20 border-rose-900/30' : 'bg-slate-900/50 border-slate-800'}`}>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
          {isLate ? <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> : <Calendar className="w-3.5 h-3.5" />}
          Prazo: {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
        </div>
        {isLate && order.delayReason && (
          <p className="text-[9px] font-bold text-rose-400/80 italic line-clamp-1">Razão: {order.delayReason}</p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
        {currentStatusIndex > 0 && (
          <button
            onClick={movePrev}
            className="flex-1 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center"
            title="Voltar etapa"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {currentStatusIndex < statuses.length - 1 && (
          <button
            onClick={moveNext}
            className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30"
          >
            Avançar <ArrowRightCircle className="w-4 h-4" />
          </button>
        )}
        {currentStatusIndex === statuses.length - 1 && (
          <div className="flex-1 py-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] text-center bg-emerald-950/20 rounded-2xl border border-emerald-900/30">
            Concluído
          </div>
        )}
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  onMove: (id: string, newStatus: OrderStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, orders, onMove }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-800 text-slate-400 border-slate-700' };
  const columnOrders = orders.filter((o: Order) => o.status === status);

  return (
    <div className="flex-shrink-0 w-[24rem] flex flex-col h-full bg-slate-900/20 rounded-[3rem] border border-slate-800/40">
      <div className="p-8 flex justify-between items-center bg-slate-900/40 rounded-t-[3rem] border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className={`w-3.5 h-3.5 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)] ${config.color.split(' ')[0]}`}></div>
          <h3 className="font-black text-slate-100 uppercase text-[12px] tracking-[0.4em]">{config.label}</h3>
        </div>
        <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-4 py-1.5 rounded-full border border-slate-700">{columnOrders.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
        {columnOrders.map((order) => (
          <KanbanCard key={order.id} order={order} onMove={onMove} />
        ))}
        {columnOrders.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/50 rounded-[2.5rem] opacity-20">
            <Clock className="w-8 h-8 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );
};



const Kanban: React.FC<KanbanProps> = ({ orders, setOrders }) => {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Load initial state from localStorage
  const [showOnlyLate, setShowOnlyLate] = React.useState(() => {
    const saved = localStorage.getItem('kanban_showOnlyLate');
    return saved === 'true';
  });

  const [autoNotify, setAutoNotify] = React.useState(() => {
    const saved = localStorage.getItem('kanban_autoNotify');
    return saved === 'true';
  });

  React.useEffect(() => {
    clientService.getAll().then(setClients).catch(console.error);
  }, []);

  // Persist settings whenever they change
  React.useEffect(() => {
    localStorage.setItem('kanban_showOnlyLate', String(showOnlyLate));
  }, [showOnlyLate]);

  React.useEffect(() => {
    localStorage.setItem('kanban_autoNotify', String(autoNotify));
  }, [autoNotify]);

  const handleMove = async (id: string, newStatus: OrderStatus) => {
    // Optimistic Update
    const order = orders.find(o => o.id === id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

    if (order) {
      const client = clients.find(c => c.id === order.clientId || c.name === order.clientName);

      // WhatsApp Notification Logic
      if (client && client.whatsapp) {
        const message = getStatusUpdateMessage(order, newStatus);

        if (autoNotify) {
          // 1. Try Autonomous Send (Evolution API)
          try {
            const sent = await whatsappService.sendMessage(client.whatsapp, message);

            // 2. Fallback to Open Link if API failed or not configured
            // We can maybe add a visual toast here later?
            if (!sent) {
              console.log("Evolution API failed or not configured. Falling back to simple link.");
              const link = getWhatsAppLink(client.whatsapp, message);
              window.open(link, '_blank');
            } else {
              console.log("Auto-Notification Sent via API!");
            }
          } catch (e) {
            console.error("Auto-Notify Error:", e);
            // Fallback
            const link = getWhatsAppLink(client.whatsapp, message);
            window.open(link, '_blank');
          }
        }
      }
    }

    try {
      await orderService.update(id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Erro ao salvar o novo status. Recarregue a página.");
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.clientTeam && (order.clientTeam || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const isLate = new Date(order.deliveryDate) < new Date() && order.status !== OrderStatus.FINISHED;
    const matchesLate = showOnlyLate ? isLate : true;

    return matchesSearch && matchesLate;
  });

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Fluxo de Produção</h2>
          <p className="text-slate-500 font-medium">Gerencie as etapas da produção em tempo real.</p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex items-center gap-4 bg-[#0f172a] p-2 rounded-2xl border border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cliente, nº ou turma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-200 w-64 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <button
            onClick={() => setShowOnlyLate(!showOnlyLate)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${showOnlyLate ? 'bg-rose-900/30 text-rose-400 border-rose-500/50 shadow-lg shadow-rose-900/20' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'}`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Atrasados
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <button
            onClick={() => setAutoNotify(!autoNotify)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${autoNotify ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-900/20' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'}`}
            title="Abrir WhatsApp Automaticamente ao mover cards"
          >
            <Users className="w-3.5 h-3.5" />
            Auto Whats
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            orders={filteredOrders}
            onMove={handleMove}
          />
        ))}
      </div>
    </div>
  );
};

export default Kanban;
