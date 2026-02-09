import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, Truck, Search, ArrowRight, ShoppingCart } from 'lucide-react';
import { orderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';

interface OrderTrackerProps {
    orderId?: string;
    onBack?: () => void;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({ orderId, onBack }) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchCode, setSearchCode] = useState('');
    const [error, setError] = useState('');

    // Status Steps Configuration
    const steps = [
        { id: OrderStatus.RECEIVED, label: 'Recebido', icon: Package, description: 'Pedido confirmado e ordem de serviço gerada.' },
        { id: OrderStatus.FINALIZATION, label: 'Arte & Preparação', icon: Search, description: 'Preparação de artefinal, telas e matrizes.' },
        { id: OrderStatus.IN_PRODUCTION, label: 'Em Produção', icon: Clock, description: 'Estamparia e acabamento em andamento.' },
        { id: OrderStatus.FINISHED, label: 'Pronto / Entregue', icon: CheckCircle, description: 'Pedido finalizado e disponível para retirada.' }
    ];

    const getStepStatus = (stepId: OrderStatus, currentStatus: OrderStatus) => {
        const stepIndex = steps.findIndex(s => s.id === stepId);
        const currentIndex = steps.findIndex(s => s.id === currentStatus);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'pending';
    };

    useEffect(() => {
        if (orderId) {
            loadOrder(orderId);
        } else {
            setLoading(false);
        }
    }, [orderId]);

    const loadOrder = async (idOrNumber: string) => {
        setLoading(true);
        setError('');
        try {
            let data;
            // Simple heuristic: if it looks like a UUID, assume ID. Else Order Number.
            if (idOrNumber.length > 10 && idOrNumber.includes('-')) {
                data = await orderService.getById(idOrNumber);
            } else {
                data = await orderService.getByOrderNumber(idOrNumber);
            }

            setOrder(data);
        } catch (e) {
            console.error(e);
            setError('Pedido não encontrado. Verifique o código e tente novamente.');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchCode) return;
        loadOrder(searchCode);
    };

    if (loading && orderId) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">

            {/* Header / Search State (if no order loaded) */}
            {!order && (
                <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center">
                    <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl w-full max-w-md text-center space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
                            <Truck className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Rastrear Pedido</h1>
                            <p className="text-slate-500 text-sm font-medium">Acompanhe o status da sua produção em tempo real.</p>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-4">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Digite o Nº do Pedido (Ex: 1024)"
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center text-xl font-black tracking-widest text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase placeholder:text-slate-800"
                                value={searchCode}
                                onChange={e => setSearchCode(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!searchCode}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Buscar Pedido
                            </button>
                        </form>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold animate-in fade-in">
                                {error}
                            </div>
                        )}

                        {onBack && (
                            <button onClick={onBack} className="text-slate-600 text-xs font-bold uppercase tracking-widest hover:text-slate-400 transition-colors">
                                Voltar para Login
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tracker View */}
            {order && (
                <div className="container mx-auto px-4 py-8 max-w-4xl cursor-default pb-32">
                    <header className="flex justify-between items-center mb-12 animate-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Pedido #{order.orderNumber}</h1>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cliente: {order.clientName}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {/* Only show "Back/Search" if not embedded or direct link implies navigation? 
                     We'll assume the user might want to search another if they arrived here. 
                  */}
                            <button onClick={() => setOrder(null)} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-slate-400 hover:text-white transition-all">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    {/* Timeline */}
                    <div className="relative mb-16 px-4 animate-in fade-in duration-1000 delay-200">
                        {/* Connecting Line */}
                        <div className="absolute left-8 top-8 bottom-8 w-1 bg-slate-800 rounded-full md:left-0 md:right-0 md:top-6 md:h-1 md:w-full md:bottom-auto"></div>
                        {/* Progress Line */}
                        <div
                            className="absolute left-8 top-8 w-1 bg-indigo-500 rounded-full transition-all duration-1000 md:left-0 md:top-6 md:h-1 md:w-0 md:bottom-auto shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                            style={{
                                height: window.innerWidth < 768 ? `${(steps.findIndex(s => s.id === order.status) / (steps.length - 1)) * 100}%` : '4px',
                                width: window.innerWidth >= 768 ? `${(steps.findIndex(s => s.id === order.status) / (steps.length - 1)) * 100}%` : '4px'
                            }}
                        ></div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                            {steps.map((step, idx) => {
                                const status = getStepStatus(step.id, order.status);
                                const isCurrent = status === 'current';
                                const isCompleted = status === 'completed';

                                return (
                                    <div key={step.id} className="flex md:flex-col items-start md:items-center md:text-center gap-4 group">
                                        <div className={`w-12 h-12 rounded-full border-4 relative z-10 flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/50' :
                                                isCurrent ? 'bg-[#020617] border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110' :
                                                    'bg-[#020617] border-slate-800 text-slate-700'
                                            }`}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <div className="pt-1 md:pt-4">
                                            <h3 className={`font-black uppercase tracking-wider text-sm ${isCurrent ? 'text-white' : isCompleted ? 'text-indigo-200' : 'text-slate-600'}`}>
                                                {step.label}
                                            </h3>
                                            <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed max-w-[150px] mx-auto hidden md:block">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-300">

                        {/* Delivery Date Card */}
                        <div className="bg-[#0f172a] rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Clock className="w-24 h-24 text-indigo-500" />
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 mb-2">Previsão de Entrega</p>
                            <p className="text-4xl font-black text-white tracking-tighter">
                                {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-indigo-400 text-xs font-bold mt-2 flex items-center gap-2">
                                <Truck className="w-3 h-3" />
                                {order.status === OrderStatus.FINISHED ? 'Pedido Disponível!' : 'Em processamento'}
                            </p>
                        </div>

                        {/* Items Summary (No Prices) */}
                        <div className="bg-[#0f172a] rounded-[2rem] p-8 border border-slate-800 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Resumo do Pedido</h4>
                            </div>

                            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-800/50 last:border-0">
                                        <div>
                                            <p className="text-slate-200 font-bold text-xs uppercase">{item.productName}</p>
                                            <p className="text-slate-500 text-[9px] font-black tracking-wider">{item.gradeLabel} - {item.size} - {item.fabricName}</p>
                                        </div>
                                        <div className="bg-slate-900 text-slate-300 font-mono text-xs font-bold px-3 py-1 rounded-lg">
                                            x{item.quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center border-t border-slate-900 pt-8 animate-in fade-in delay-500">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Estamparia Pro • Rastreamento Oficial</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTracker;
