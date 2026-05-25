import React, { useState } from 'react';
import { Package, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ClientLoginProps {
    onLoginSuccess: (session: { id: string; name: string; phone: string }, options?: { openSupportChat?: boolean }) => void;
}

const ClientLogin: React.FC<ClientLoginProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'support'>('login');
    const [orderNumber, setOrderNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [supportName, setSupportName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'login' && (!orderNumber || !phoneNumber)) {
            setError('Preencha todos os campos obrigatórios.');
            return;
        }

        if (mode === 'support' && (!supportName || !phoneNumber)) {
            setError('Preencha seu nome e telefone.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');

            const response = await fetch('/api/client-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, phone: cleanPhone, orderNumber, supportName })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Ocorreu um erro ao tentar acessar. Tente novamente mais tarde.');
                setLoading(false);
                return;
            }

            // Sucesso
            localStorage.setItem('client_session', JSON.stringify(data.session));
            localStorage.setItem('client_token', data.token); // Secure JWT
            if (data.openSupportChat) {
                localStorage.setItem('open_support_chat', data.openSupportChat);
                onLoginSuccess(data.session, { openSupportChat: true });
            } else {
                onLoginSuccess(data.session);
            }

        } catch (err: any) {
            console.error(err);
            setError('Falha de conexão. Verifique sua internet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b1221] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Elementos Decorativos de Fundo */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 md:p-12 shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-white/5 mb-6 rotate-3">
                        <Package className="w-8 h-8 text-white -rotate-3" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-2">Portal do Cliente</h1>
                    <p className="text-slate-400 text-xs md:text-sm font-medium">Acompanhe seus pedidos em tempo real.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {mode === 'login' ? (
                        <>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Número do Pedido</label>
                                <div className="relative">
                                    <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input
                                        type="text"
                                        placeholder="Ex: 5312"
                                        value={orderNumber}
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl pl-12 pr-5 py-4 text-slate-100 font-bold focus:ring-1 focus:ring-slate-700/50 outline-none transition-all placeholder:text-slate-700 placeholder:font-medium"
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
                                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl pl-12 pr-5 py-4 text-slate-100 font-bold focus:ring-1 focus:ring-slate-700/50 outline-none transition-all placeholder:text-slate-700 placeholder:font-medium"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Seu Nome Completo</label>
                                <div className="relative">
                                    <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input
                                        type="text"
                                        placeholder="Ex: João Silva"
                                        value={supportName}
                                        onChange={(e) => setSupportName(e.target.value)}
                                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl pl-12 pr-5 py-4 text-slate-100 font-bold focus:ring-1 focus:ring-slate-700/50 outline-none transition-all placeholder:text-slate-700 placeholder:font-medium"
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
                                        className="w-full bg-[#1C1C26] border border-[#1e293b] rounded-2xl pl-12 pr-5 py-4 text-slate-100 font-bold focus:ring-1 focus:ring-slate-700/50 outline-none transition-all placeholder:text-slate-700 placeholder:font-medium"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
                            </>
                        ) : (
                            <>
                                {mode === 'login' ? 'Acessar Meus Pedidos' : 'Iniciar Atendimento'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-[#1e293b] text-center">
                    {mode === 'login' ? (
                        <p className="text-xs text-slate-500 font-medium">
                            Precisando de ajuda?{' '}
                            <button type="button" onClick={() => setMode('support')} className="text-white font-bold hover:text-white/80 transition-colors uppercase tracking-wider">
                                Fale com o suporte
                            </button>
                        </p>
                    ) : (
                        <p className="text-xs text-slate-500 font-medium">
                            Já tem um pedido?{' '}
                            <button type="button" onClick={() => setMode('login')} className="text-white font-bold hover:text-white/80 transition-colors uppercase tracking-wider">
                                Rastrear Pedido
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
