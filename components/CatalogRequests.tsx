import React, { useState, useEffect } from 'react';
import { catalogOrderService } from '../services/catalogOrderService';
import { orderService } from '../services/orderService';
import { CatalogOrder, OrderStatus, OrderType, PaymentStatus } from '../types';
import { CheckCircle2, XCircle, Clock, ShoppingBag } from 'lucide-react';
import { notify } from './ui/toast';
import { ConfirmModal } from './ui/ConfirmModal';

const CatalogRequests: React.FC = () => {
    const [requests, setRequests] = useState<CatalogOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmApprove, setConfirmApprove] = useState<CatalogOrder | null>(null);
    const [confirmReject, setConfirmReject] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await catalogOrderService.getAll();
            // Filter only pending for this view, or show all with status filter?
            // For now show all but emphasize pending
            setRequests((data || []) as CatalogOrder[]);
        } catch (error) {
            console.error("Failed to load requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: CatalogOrder) => {
        try {
            const nameMatch = request.clientName.match(/^(.*?)\s*\((.*?)\)$/);
            const finalClientName = nameMatch ? nameMatch[1].trim() : request.clientName;
            const clientTeam = nameMatch ? nameMatch[2].trim() : (request.clientTeam || '');

            await orderService.create({
                clientId: request.clientId,
                clientName: finalClientName,
                clientTeam: clientTeam,
                createdAt: new Date().toISOString(),
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                orderNumber: `CAT-${request.id.substring(0, 6).toUpperCase()}`,
                status: OrderStatus.RECEIVED,
                paymentStatus: PaymentStatus.PENDING,
                orderType: OrderType.SALE,
                totalValue: 0,
                notes: `Pedido vindo do Catálogo. Cliente: ${request.clientName} (${request.clientPhone}).`,
                internalNotes: 'Gerado automaticamente pelo módulo de Catálogo',
                items: request.items.map(item => ({
                    id: '',
                    productId: item.productId,
                    productName: item.productName,
                    gradeLabel: 'Masculino',
                    size: item.size,
                    quantity: item.quantity,
                    unitPrice: 0,
                    fabricName: 'Padrão',
                    fabricId: 'f1'
                })) as any
            });

            await catalogOrderService.updateStatus(request.id, 'approved');
            notify.success('Pedido gerado! Verifique na tela de Pedidos.');
            loadRequests();
        } catch (error) {
            console.error('Error approving request', error);
            notify.error('Erro ao aprovar pedido.');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await catalogOrderService.updateStatus(id, 'rejected');
            notify.info('Solicitação rejeitada.');
            loadRequests();
        } catch (error) {
            console.error('Error rejecting', error);
        }
    };

    const [viewingRequest, setViewingRequest] = useState<CatalogOrder | null>(null);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tight">Solicitações do Catálogo</h2>
                <p className="text-slate-500 font-bold">Gerencie os pedidos enviados pelo catálogo online.</p>
            </header>

            <div className="grid gap-4">
                {loading ? (
                    <p className="text-slate-500">Carregando...</p>
                ) : requests.length === 0 ? (
                    <div className="p-10 bg-[#0f172a] rounded-3xl border border-[#1e293b] text-center">
                        <ShoppingBag className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500 font-bold">Nenhuma solicitação encontrada.</p>
                    </div>
                ) : (
                    requests.map(request => (
                        <div
                            key={request.id}
                            onClick={() => setViewingRequest(request)}
                            className="bg-[#0f172a] p-6 rounded-xl border border-[#1e293b] flex flex-col md:flex-row gap-6 relative overflow-hidden group cursor-pointer hover:border-slate-700 transition-all"
                        >
                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${request.status === 'approved' ? 'bg-emerald-500' :
                                request.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                                }`} />

                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-200 uppercase group-hover:text-white transition-colors">{request.clientName}</h3>
                                        <p className="text-xs text-white font-bold flex items-center gap-2">
                                            {request.clientPhone}
                                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                            {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${request.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                        request.status === 'rejected' ? 'bg-rose-900/30 text-rose-400 border-rose-500/30' :
                                            'bg-amber-900/30 text-amber-400 border-amber-500/30'
                                        }`}>
                                        {request.status === 'pending' ? 'Pendente' : request.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                    </span>
                                </div>

                                <div className="bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b] space-y-2">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Resumo do Pedido ({request.items.length} itens)</p>
                                    {request.items.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 text-sm text-slate-300">
                                            <span className="font-bold bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-400">{item.quantity}x</span>
                                            <span className="flex-1 truncate">{item.productName}</span>
                                        </div>
                                    ))}
                                    {request.items.length > 2 && (
                                        <p className="text-[10px] text-slate-500 italic">+ {request.items.length - 2} outros itens...</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center px-4">
                                <Clock className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Request Detail Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1C1C26]/80 animate-in fade-in duration-200">
                    <div className="bg-[#0f172a] w-full max-w-3xl rounded-2xl border border-[#1e293b] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
                        {/* Header */}
                        <div className="p-8 border-b border-[#1e293b] flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                                    Detalhes da Solicitação
                                </h2>
                                <div className="flex items-center gap-4">
                                    <span className="text-white font-bold text-sm uppercase tracking-wide bg-white/10 px-3 py-1 rounded-lg border border-[#1e293b]">
                                        {viewingRequest.clientName}
                                    </span>
                                    <span className="text-slate-500 font-bold text-sm">
                                        {new Date(viewingRequest.createdAt).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                {(viewingRequest.clientTeam || viewingRequest.clientPhone) && (
                                    <div className="mt-3 flex gap-4 text-xs text-slate-400 font-medium">
                                        <span>📞 {viewingRequest.clientPhone}</span>
                                        {viewingRequest.clientTeam && <span>🏆 {viewingRequest.clientTeam}</span>}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setViewingRequest(null)} className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">

                            <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#0f172a] border-b border-[#1e293b] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <tr>
                                            <th className="p-4">Qtd</th>
                                            <th className="p-4">Produto</th>
                                            <th className="p-4">Tamanho</th>
                                            <th className="p-4">Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {viewingRequest.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/20">
                                                <td className="p-4 font-bold text-white">{item.quantity}</td>
                                                <td className="p-4 text-slate-300 font-medium">{item.productName}</td>
                                                <td className="p-4 text-slate-400 font-mono text-xs">{item.size || '-'}</td>
                                                <td className="p-4 text-slate-500 italic text-xs">{item.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Estimation (Optional if we add prices later) */}
                            <div className="flex justify-end">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Itens</p>
                                    <p className="text-2xl font-black text-white">{viewingRequest.items.reduce((acc, i) => acc + i.quantity, 0)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-[#1e293b] bg-[#0f172a]/30 flex justify-end gap-4 rounded-b-[2.5rem]">
                            <button
                                onClick={() => setViewingRequest(null)}
                                className="px-6 py-4 rounded-xl font-bold uppercase text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Fechar
                            </button>

                            {viewingRequest.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setConfirmReject(viewingRequest.id);
                                            setViewingRequest(null);
                                        }}
                                        className="px-6 py-4 rounded-xl font-black uppercase text-xs text-rose-400 hover:bg-rose-950 border border-transparent hover:border-rose-900 transition-colors flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Rejeitar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setConfirmApprove(viewingRequest);
                                            setViewingRequest(null);
                                        }}
                                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Aprovar Pedido
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Approve Modal */}
            <ConfirmModal
                isOpen={!!confirmApprove}
                title={`Aprovar pedido de ${confirmApprove?.clientName}?`}
                message="Um Pedido de Venda será gerado automaticamente na tela de Pedidos."
                confirmLabel="Aprovar e Gerar Pedido"
                variant="success"
                onConfirm={() => { if (confirmApprove) { handleApprove(confirmApprove); setConfirmApprove(null); } }}
                onCancel={() => setConfirmApprove(null)}
            />

            {/* Confirm Reject Modal */}
            <ConfirmModal
                isOpen={!!confirmReject}
                title="Rejeitar solicitação?"
                message="Esta ação marcará a solicitação como rejeitada."
                confirmLabel="Rejeitar"
                variant="danger"
                onConfirm={() => { if (confirmReject) { handleReject(confirmReject); setConfirmReject(null); } }}
                onCancel={() => setConfirmReject(null)}
            />
        </div>
    );
};

export default CatalogRequests;
