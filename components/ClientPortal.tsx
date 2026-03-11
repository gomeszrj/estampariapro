import React, { useEffect, useState } from 'react';
import { Truck, LogOut, Package, Clock, CheckCircle2, MessageCircle, Send, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { orderService } from '../services/orderService';
import { settingsService } from '../services/settingsService';
import { Order, OrderMessage } from '../types';
import { STATUS_CONFIG } from '../constants';
import ClientLogin from './ClientLogin';

const ClientPortal: React.FC = () => {
    const [clientSession, setClientSession] = useState<{ id: string; name: string; phone: string } | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [companySettings, setCompanySettings] = useState<any>(null);

    // Chat State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const session = localStorage.getItem('client_session');
        if (session) {
            const parsed = JSON.parse(session);
            setClientSession(parsed);
        } else {
            setLoading(false); // Done checking session
        }
    }, []);

    // Effect to fetch orders when session exists
    useEffect(() => {
        if (!clientSession) return;
        setLoading(true);

        const fetchOrders = async () => {
            try {
                const [ordersRes, settingsRes] = await Promise.all([
                    supabase
                        .from('orders')
                        .select(`*, items:order_items(*)`)
                        .eq('client_id', clientSession.id)
                        .order('created_at', { ascending: false }),
                    settingsService.getPublicSettings()
                ]);

                if (ordersRes.error) throw ordersRes.error;

                // Basic mapping simulation
                const formatted = (ordersRes.data || []).map((o: any) => ({
                    ...o,
                    orderNumber: o.order_number,
                    createdAt: o.created_at,
                    deliveryDate: o.delivery_date,
                    totalValue: o.total_value,
                })) as Order[];

                setOrders(formatted);
                setCompanySettings(settingsRes);

                // Check auto-open chat logic
                const autoOpenOrderId = localStorage.getItem('open_support_chat');
                if (autoOpenOrderId) {
                    const targetOrder = formatted.find(o => o.id === autoOpenOrderId);
                    if (targetOrder) {
                        openChat(targetOrder);
                    }
                    localStorage.removeItem('open_support_chat');
                }
            } catch (error) {
                console.error("Failed to fetch client orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [clientSession]);

    const handleLogout = () => {
        localStorage.removeItem('client_session');
        window.location.href = '/';
    };

    const openChat = async (order: Order) => {
        setSelectedOrder(order);
        try {
            const msgs = await orderService.getMessages(order.id);
            setMessages(msgs);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (selectedOrder) {
            // Realtime Subscription
            const channel = supabase
                .channel(`client_chat_${selectedOrder.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${selectedOrder.id}` },
                    (payload) => {
                        const newMsg = payload.new as OrderMessage;
                        setMessages(prev => {
                            // Prevent duplicates if we just sent it
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedOrder]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedOrder) return;

        setSending(true);
        try {
            const msg = await orderService.sendMessage(selectedOrder.id, 'client', newMessage);
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
        } catch (e) {
            console.error(e);
            alert('Falha ao enviar mensagem.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="text-indigo-400 font-bold tracking-widest uppercase text-sm animate-pulse flex items-center gap-3">
                    <Package className="w-5 h-5 animate-spin" /> Carregando Portal...
                </div>
            </div>
        );
    }

    if (!clientSession) {
        return <ClientLogin onLoginSuccess={setClientSession} />;
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Header */}
            <header className="h-20 bg-[#0f172a]/60 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-white tracking-tight">Meus Pedidos</h1>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">{clientSession.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <a
                        href="/?view=public_catalog"
                        target="_blank"
                        className="hidden md:flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest px-4 py-2 bg-indigo-500/10 rounded-lg transition-colors border border-indigo-500/20"
                    >
                        Catálogo Público
                    </a>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-widest px-4 py-2 bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                    >
                        <LogOut className="w-4 h-4" /> Sair
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
                {/* Financial Info Banner */}
                {companySettings?.bank_info && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 md:p-8 flex flex-col md:flex-row items-start gap-4 animate-in slide-in-from-top-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="text-emerald-400 font-black text-lg md:text-xl">$</span>
                        </div>
                        <div className="flex-1 w-full overflow-hidden">
                            <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] md:text-xs mb-2">Dados para Pagamento / PIX</h3>
                            <p className="text-slate-300 text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words">{companySettings.bank_info}</p>
                        </div>
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-[#0f172a] rounded-3xl border border-slate-800">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Nenhum pedido encontrado</h3>
                        <p className="text-slate-400">Você ainda não possui pedidos registrados em nosso sistema.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {orders.map(order => {
                            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                            const StatusIcon = Clock;

                            return (
                                <div key={order.id} className="bg-[#0f172a] rounded-3xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors">
                                    <div className="p-5 md:p-8 flex flex-col items-start md:flex-row md:items-center justify-between gap-5 md:gap-6">
                                        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border shrink-0 ${statusConfig?.color || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                                <StatusIcon className="w-6 h-6 md:w-8 md:h-8" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg md:text-2xl font-black text-white truncate">Pedido #{order.orderNumber}</h3>
                                                </div>
                                                <p className="text-xs md:text-sm font-medium text-slate-400">
                                                    Feito em {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full md:w-auto bg-[#1e293b] p-4 rounded-2xl justify-between flex-1 md:flex-none">
                                            <div className="w-full sm:w-auto">
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Atual</p>
                                                <p className={`text-xs md:text-sm font-black uppercase tracking-wider ${statusConfig?.color ? statusConfig.color.split(' ')[1] : 'text-slate-300'}`}>
                                                    {statusConfig?.label || order.status}
                                                </p>
                                            </div>
                                            <div className="w-full h-px sm:w-px sm:h-8 bg-slate-700"></div>
                                            <div className="w-full sm:w-auto">
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previsão</p>
                                                <p className="text-xs md:text-sm font-black text-slate-200">
                                                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'A definir'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                            <a
                                                href={`/?view=tracker&order=${order.id}`}
                                                target="_blank"
                                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                                            >
                                                Timeline do Pedido
                                            </a>
                                            <button
                                                onClick={() => openChat(order)}
                                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                                            >
                                                <MessageCircle className="w-5 h-5" /> Falar com Vendedor
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Chat Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-md bg-[#0f172a] h-full border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right-8">
                        {/* Header */}
                        <div className="h-20 bg-[#1e293b]/50 flex items-center justify-between px-6 border-b border-slate-800">
                            <div>
                                <h2 className="text-lg font-black text-white">Atendimento</h2>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pedido #{selectedOrder.orderNumber}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="text-center pb-6 border-b border-slate-800/50 mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Início do Atendimento</p>
                                <p className="text-[10px] text-slate-600">Este chat é focado exclusivamente no pedido #{selectedOrder.orderNumber}</p>
                            </div>

                            {messages.map((msg) => {
                                const isClient = msg.sender === 'client';
                                return (
                                    <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-4 ${isClient ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#1e293b] text-slate-200 border border-slate-800 rounded-tl-sm'}`}>
                                            <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                            <p className={`text-[10px] font-bold mt-2 ${isClient ? 'text-indigo-200' : 'text-slate-500'} text-right`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                                    <MessageCircle className="w-12 h-12" />
                                    <p className="text-sm font-medium text-center">Nenhuma mensagem ainda.<br />Envie sua dúvida abaixo.</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#1e293b]/50 border-t border-slate-800">
                            <form onSubmit={sendMessage} className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-xl py-4 pl-4 pr-14 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPortal;
