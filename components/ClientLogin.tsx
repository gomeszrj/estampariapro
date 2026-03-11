import React, { useState } from 'react';
import { Package, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ClientLoginProps {
    onLoginSuccess: (session: { id: string; name: string; phone: string }) => void;
}

const ClientLogin: React.FC<ClientLoginProps> = ({ onLoginSuccess }) => {
    const [orderNumber, setOrderNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber || !phoneNumber) {
            setError('Preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const cleanOrderNumber = orderNumber.replace(/#/g, '').trim();
            const cleanPhone = phoneNumber.replace(/\D/g, '');

            if (cleanPhone.length < 8) {
                setError('Número de telefone inválido. Digite com o DDD.');
                setLoading(false);
                return;
            }

            // Converter para número para ignorar zeros à esquerda na busca
            const numForSearch = parseInt(cleanOrderNumber, 10);
            const searchStr = isNaN(numForSearch) ? cleanOrderNumber : numForSearch.toString();

            // Buscar possíveis pedidos que contenham o número digitado
            const { data: ordersData, error: orderError } = await supabase
                .from('orders')
                .select(`
                  id,
                  client_id,
                  order_number,
                  clients (
                    id,
                    name,
                    whatsapp,
                    document
                  )
                `)
                .ilike('order_number', `%${searchStr}%`)
                .limit(20);

            if (orderError || !ordersData || ordersData.length === 0) {
                setError('Pedido não encontrado. Verifique o número digitado.');
                setLoading(false);
                return;
            }

            // Pegar os últimos 8 dígitos do telefone digitado para uma comparação segura
            const phoneLast8 = cleanPhone.slice(-8);

            // Procurar dentro dos pedidos encontrados qual pertence ao telefone
            const matchingOrder = ordersData.find(order => {
                const client = order.clients as any;
                if (!client) return false;

                const dbWhatsapp = (client.whatsapp || '').replace(/\D/g, '');
                return dbWhatsapp && dbWhatsapp.endsWith(phoneLast8);
            });

            if (matchingOrder) {
                const client = matchingOrder.clients as any;
                // Sucesso
                const session = {
                    id: client.id,
                    name: client.name,
                    phone: client.whatsapp || cleanPhone
                };
                localStorage.setItem('client_session', JSON.stringify(session));
                onLoginSuccess(session);
            } else {
                setError('O telefone informado não confere com nenhum pedido com este número.');
            }

        } catch (err: any) {
            console.error(err);
            setError('Ocorreu um erro ao tentar acessar. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Elementos Decorativos de Fundo */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-6 rotate-3">
                        <Package className="w-8 h-8 text-white -rotate-3" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-2">Portal do Cliente</h1>
                    <p className="text-slate-400 text-xs md:text-sm font-medium">Acompanhe seus pedidos em tempo real.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Número do Pedido</label>
                        <div className="relative">
                            <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Ex: 5312"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 placeholder:font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Seu WhatsApp / Telefone</label>
                        <div className="relative">
                            <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                            <input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 placeholder:font-medium"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
                            </>
                        ) : (
                            <>
                                Acessar Meus Pedidos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Precisando de ajuda?{' '}
                        <a href="#" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-wider">
                            Fale com o suporte
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
