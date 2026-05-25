import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { notify } from './ui/toast';
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
    { id: OrderStatus.RECEIVED, label: 'Pendente', icon: Clock, color: 'text-slate-400', bg: 'bg-[#0b1221]', border: 'border-[#1e293b]' },
    { id: OrderStatus.IN_PRODUCTION, label: 'Em Produção', icon: RotateCw, color: 'text-blue-400', bg: 'bg-[#0b1221]', border: 'border-[#1e293b]' },
    { id: OrderStatus.FINISHED, label: 'Finalizado', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-[#0b1221]', border: 'border-[#1e293b]' }
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
                notify.error('Erro ao mover card. Tente novamente.');
            } finally {
                setIsUpdating(false);
                setDraggedOrderId(null);
            }
        }
    };

    const filteredOrders = orders.filter(o => (o.status as string) !== 'delivered' && (o.status as string) !== 'cancelled' && o.status !== OrderStatus.CANCELLED);

    return (
        <div className="grid grid-cols-3 gap-3" style={{ height: 'calc(100vh - 200px)' }}>
            {COLUMNS.map(col => {
                const colOrders = filteredOrders.filter(o => o.status === col.id);

                return (
                    <div
                        key={col.id}
                        className={`flex flex-col rounded-xl border ${col.border} ${col.bg} transition-colors ${draggedOrderId ? 'border-dashed' : ''} overflow-hidden h-full`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id as OrderStatus)}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[#1e293b] flex flex-col items-start shrink-0">
                            <h3 className={`font-semibold text-sm text-slate-100`}>{col.label}</h3>
                            <span className="text-slate-500 text-xs mt-1">
                                {colOrders.length} {colOrders.length === 1 ? 'pedido' : 'pedidos'}
                            </span>
                        </div>

                        {/* Drop Zone / List */}
                        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                            {colOrders.map(order => (
                                <div
                                    key={order.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, order.id)}
                                    className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl hover:bg-[#1e293b]/30 cursor-move active:cursor-grabbing transition-colors"
                                >
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs font-bold text-slate-400">
                                          #{order.orderNumber}
                                      </span>
                                      <h4 className="font-semibold text-slate-200 text-[13px] truncate" title={order.clientName}>{order.clientName}</h4>
                                      <span className="text-xs text-slate-500 truncate mt-2">
                                          {order.items && order.items.length > 0 ? order.items[0].productName : 'Diversos'}
                                      </span>
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
