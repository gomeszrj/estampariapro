import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { orderService } from '../services/orderService';
import { Lock, Mail, AlertCircle, Search, Truck, Package, ArrowRight, Phone, User, Store } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import { Order } from '../types';
import { clientService } from '../services/clientService.ts';

const Login: React.FC = () => {
    const [email, setEmail] = useState(''); // Serves as email or phone
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'register' | 'tracker' | 'client_login'>('login');

    // Tracker State
    const [trackNumber, setTrackNumber] = useState('');
    const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else if (mode === 'client_login') {
                const clientUser = await clientService.getByPhoneAndPassword(email, password);
                if (!clientUser) throw new Error('Email, WhatsApp/Documento ou Senha incorretos.');
                localStorage.setItem('client_session', JSON.stringify({
                    id: clientUser.id,
                    name: clientUser.name,
                    phone: clientUser.whatsapp
                }));
                window.location.href = '/?view=client_portal';
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Cadastro realizado! Verifique seu email ou faça login se a confirmação não for necessária.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackNumber) return;
        // Redirect to full tracker view
        window.location.href = `/?view=tracker&order=${trackNumber}`;
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Estamparia Pro</h1>
                    <p className="text-slate-400">
                        {mode === 'tracker' ? 'Rastreamento de Pedidos' :
                            mode === 'client_login' ? 'Portal do Cliente' :
                                'Acesso Administrativo'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {mode === 'tracker' ? (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <form onSubmit={handleTrack} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Número do Pedido</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={trackNumber}
                                        onChange={(e) => setTrackNumber(e.target.value)}
                                        className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-black text-lg uppercase tracking-widest"
                                        placeholder="#0000"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !trackNumber}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Buscando...' : <><Truck className="w-5 h-5" /> Rastrear Agora</>}
                            </button>
                        </form>

                        {trackedOrder && (
                            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 space-y-4 animate-in zoom-in-95">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Status Atual</span>
                                        <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest border ${STATUS_CONFIG[trackedOrder.status]?.color || 'bg-slate-800 text-slate-400'}`}>
                                            {STATUS_CONFIG[trackedOrder.status]?.label || trackedOrder.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Previsão</span>
                                        <span className="text-slate-200 font-bold text-sm">
                                            {new Date(trackedOrder.deliveryDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">{trackedOrder.clientName}</p>
                                            <p className="text-xs text-slate-500">{trackedOrder.items.length} itens no pedido</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => { setMode('login'); setError(null); setTrackedOrder(null); }}
                            className="w-full text-slate-500 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" /> Voltar para Login
                        </button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleAuth} className="space-y-6 animate-in slide-in-from-left-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {mode === 'client_login' ? 'Email, WhatsApp ou CPF/CNPJ' : 'Email'}
                                </label>
                                <div className="relative">
                                    {mode === 'client_login' ? (
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    ) : (
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    )}
                                    <input
                                        type={mode === 'client_login' ? 'text' : 'email'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                        placeholder={mode === 'client_login' ? 'ex: joao@email.com, 11999999999, 12345678909' : 'seu@email.com'}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Carregando...' : mode === 'register' ? 'Cadastrar' : 'Entrar'}
                            </button>
                        </form>

                        <div className="mt-8 space-y-4 text-center">
                            {mode !== 'client_login' && (
                                <button
                                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                    className="text-slate-400 hover:text-indigo-400 text-sm font-medium transition-colors block w-full"
                                >
                                    {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                                </button>
                            )}

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#0f172a] px-2 text-slate-500">Acessos</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setMode('tracker'); setError(null); }}
                                    className="text-emerald-500 hover:text-emerald-400 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl"
                                >
                                    <Truck className="w-4 h-4" /> Rastrear
                                </button>
                                {mode === 'client_login' ? (
                                    <button
                                        onClick={() => { setMode('login'); setError(null); }}
                                        className="text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl"
                                    >
                                        <Store className="w-4 h-4" /> Lojista
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setMode('client_login'); setError(null); }}
                                        className="text-amber-500 hover:text-amber-400 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl"
                                    >
                                        <User className="w-4 h-4" /> Sou Cliente
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
