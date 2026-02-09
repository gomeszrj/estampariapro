import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import {
    Clock,
    RotateCw,
    CheckCircle2,
    PackageCheck,
    AlertCircle,
    MoreHorizontal,
    Calendar
} from 'lucide-react';

interface ProductionBoardProps {
    orders: Order[];
    onOrderUpdate: () => void;
}

const COLUMNS = [
    { id: OrderStatus.RECEIVED, label: 'Pendente', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-900/50', border: 'border-slate-800' },
    { id: OrderStatus.IN_PRODUCTION, label: 'Em Produção', icon: RotateCw, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: OrderStatus.FINALIZATION, label: 'Acabamento', icon: PackageCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: OrderStatus.FINISHED, label: 'Finalizado', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
];

export const ProductionBoard: React.FC<ProductionBoardProps> = ({ orders, onOrderUpdate }) => {
    const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleDragStart = (e: React.DragEvent, orderId: string) => {
        setDraggedOrderId(orderId);
        e.dataTransfer.setData('orderId', orderId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('orderId');

        if (!orderId || isUpdating) return;

        const order = orders.find(o => o.id === orderId);
        if (order && order.status !== newStatus) {
            setIsUpdating(true);
            try {
                // Determine update object based on status
                const updates: Partial<Order> = { status: newStatus };

                // If moving to FINISHED or DELIVERED, logic might auto-deduct in service, 
                // but if we had a specific prompt to confirm, we could do it here. 
                // valid for now just to call update.

                await orderService.update(orderId, updates);
                onOrderUpdate(); // Refresh parent
            } catch (error) {
                console.error("Failed to move card:", error);
                alert("Erro ao mover card. Tente novamente.");
            } finally {
                setIsUpdating(false);
                setDraggedOrderId(null);
            }
        }
    };

    const filteredOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

    return (
        <div className="flex gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4 items-start">
            {COLUMNS.map(col => {
                const colOrders = filteredOrders.filter(o => o.status === col.id);

                return (
                    <div
                        key={col.id}
                        className={`flex-shrink-0 w-80 flex flex-col h-full rounded-2xl border-2 ${col.border} ${col.bg} backdrop-blur-sm transition-colors ${draggedOrderId ? 'border-dashed' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id as OrderStatus)}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <col.icon className={`w-5 h-5 ${col.color}`} />
                                <h3 className={`font-black uppercase tracking-widest text-xs ${col.color}`}>{col.label}</h3>
                            </div>
                            <span className="bg-slate-900 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-lg">
                                {colOrders.length}
                            </span>
                        </div>

                        {/* Drop Zone / List */}
                        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                            {colOrders.map(order => (
                                <div
                                    key={order.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, order.id)}
                                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-slate-600 cursor-move active:cursor-grabbing group transition-all"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-0.5">
                                                #{order.orderNumber}
                                            </span>
                                            <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{order.clientName}</h4>
                                        </div>
                                        {order.deliveryDate && (
                                            <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg ${new Date(order.deliveryDate) < new Date() ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                <Calendar className="w-3 h-3" />
                                                {new Date(order.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {order.items.slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="text-xs text-slate-400 flex justify-between items-center bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/50">
                                                <span className="truncate max-w-[140px]">{item.productName}</span>
                                                <span className="font-mono font-bold text-slate-500">x{item.quantity}</span>
                                            </div>
                                        ))}
                                        {order.items.length > 2 && (
                                            <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">+ {order.items.length - 2} itens</p>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center opacity-75 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                            <MoreHorizontal className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {colOrders.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 min-h-[100px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
