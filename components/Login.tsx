import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, AlertCircle, Search, Truck, Package, ArrowRight, Phone, User, Store, Sparkles } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import { Order } from '../types';
import { clientService } from '../services/clientService';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'tracker' | 'client_login' | 'forgot_password'>('login');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSent, setForgotSent] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    // Tracker State
    const [trackNumber, setTrackNumber] = useState('');
    const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

    // Splash Screen State
    const [splashVisible, setSplashVisible] = useState(true);
    const [splashSettings, setSplashSettings] = useState({
        enabled: true,
        duration: 1600,
        logoUrl: '',
        message: 'Carregando estrutura digital...'
    });

    React.useEffect(() => {
        const loadSettingsAndTimer = async () => {
            try {
                const { settingsService } = await import('../services/settingsService');
                const s = await settingsService.getSettings();

                const localEnabled = localStorage.getItem('splash_enabled');
                const localDuration = localStorage.getItem('splash_duration');
                const localLogoUrl = localStorage.getItem('splash_logo_url');
                const localMessage = localStorage.getItem('splash_message');

                const enabled = localEnabled !== null ? localEnabled === 'true' : (s.splash_enabled !== undefined ? !!s.splash_enabled : true);
                const duration = localDuration ? parseInt(localDuration, 10) : (s.splash_duration ? parseInt(String(s.splash_duration), 10) : 1600);
                const logoUrl = localLogoUrl || s.splash_logo_url || s.logo_url || '';
                const message = localMessage || s.splash_message || 'Carregando estrutura digital...';

                setSplashSettings({ enabled, duration, logoUrl, message });

                if (!enabled) {
                    setSplashVisible(false);
                } else {
                    const timer = setTimeout(() => {
                        setSplashVisible(false);
                    }, duration);
                    return () => clearTimeout(timer);
                }
            } catch (err) {
                console.error('Failed to load splash settings, using defaults', err);
                const timer = setTimeout(() => {
                    setSplashVisible(false);
                }, 1600);
                return () => clearTimeout(timer);
            }
        };

        loadSettingsAndTimer();
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (!data.session) {
                    throw new Error("Login bem-sucedido, mas nenhuma sessão foi retornada. Verifique se o e-mail precisa ser confirmado ou se o Supabase está enviando os tokens corretamente.");
                }
                window.location.href = '/';
            } else if (mode === 'client_login') {
                const clientUser = await clientService.getByPhoneAndPassword(email, password);
                if (!clientUser) throw new Error('Email, WhatsApp/Documento ou Senha incorretos.');
                localStorage.setItem('client_session', JSON.stringify({
                    id: clientUser.id,
                    name: clientUser.name,
                    phone: clientUser.whatsapp
                }));
                window.location.href = '/?view=client_portal';
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) return;
        setForgotLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                redirectTo: `${window.location.origin}/?reset_password=true`
            });
            if (error) throw error;
            setForgotSent(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar e-mail. Verifique o endereço informado.');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackNumber) return;
        window.location.href = `/?view=tracker&order=${trackNumber}`;
    };

    // ── LOGIN CARD ────────────────────────────────────────────────────────────
    const [showPassword, setShowPassword] = useState(false);

    // ── SPLASH SCREEN ─────────────────────────────────────────────────────────
    if (splashVisible && splashSettings.enabled) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#0b1221] flex flex-col items-center justify-center p-6 select-none">
                <style>{`
                    @keyframes fillProgress {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }
                    @keyframes splashFadeIn {
                        0% { opacity: 0; transform: translateY(12px) scale(0.97); }
                        100% { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes splashLogoGlow {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(189,255,63,0); }
                        50% { box-shadow: 0 0 40px 4px rgba(189,255,63,0.08); }
                    }
                    .splash-animate {
                        animation: splashFadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
                    .splash-logo-glow {
                        animation: splashLogoGlow 3s ease-in-out infinite;
                    }
                `}</style>

                <div className="flex flex-col items-center max-w-xs w-full text-center space-y-10 splash-animate">

                    {/* Logo Container — CRM style: slate-900 + slate-800 border */}
                    <div className="relative">
                        {/* Outer glow ring */}
                        <div className="absolute inset-0 rounded-[2.2rem] bg-[#8B5CF6]/5 blur-xl scale-125 pointer-events-none" />
                        <div
                            className="relative w-24 h-24 bg-[#0f172a] border border-[#1e293b] rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden splash-logo-glow"
                        >
                            {/* Inner subtle grid texture */}
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 8px)' }}
                            />
                            {splashSettings.logoUrl ? (
                                <img src={splashSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-4 relative z-10" />
                            ) : (
                                <Package className="w-11 h-11 text-white relative z-10" />
                            )}
                        </div>
                    </div>

                    {/* App Name & Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Estamparia Pro</h2>
                        <p className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase max-w-[220px] mx-auto leading-relaxed">
                            {splashSettings.message}
                        </p>
                    </div>

                    {/* Premium Progress Bar — CRM styled */}
                    <div className="w-36 space-y-2">
                        <div className="w-full bg-[#0f172a] border border-[#1e293b] h-[3px] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                style={{
                                    animation: `fillProgress ${splashSettings.duration}ms cubic-bezier(0.25, 1, 0.5, 1) forwards`
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05050A] text-white flex select-none font-['Inter'] relative overflow-hidden">

            {/* ── LEFT COLUMN - Branding (Hidden on mobile) ── */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-12 z-10">
                
                {/* Background Wave Effect Simulation */}
                <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#1A365D]/30 via-purple-900/10 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-0 left-0 w-full h-[30%] opacity-40 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)' }} />

                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-40 left-20 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
                
                {/* Center Logo Area */}
                <div className="flex flex-col items-center mb-16 relative">
                    <div className="flex items-center justify-center relative mb-8">
                        {/* Abstract EP Logo simulation matching the reference image's EP graphic */}
                        <div className="relative flex items-center justify-center h-32 w-48">
                            {/* We use basic blocks to simulate the geometric E P logo */}
                            <div className="absolute top-0 left-4 w-8 h-8 bg-[#48C6EF] rounded-sm" />
                            <div className="absolute top-0 left-16 w-12 h-8 bg-[#48C6EF] rounded-sm" />
                            <div className="absolute top-12 left-4 w-8 h-8 bg-[#3B82F6] rounded-sm" />
                            <div className="absolute top-12 left-16 w-16 h-8 bg-[#3B82F6] rounded-sm" />
                            <div className="absolute top-24 left-4 w-8 h-8 bg-[#8B5CF6] rounded-sm" />
                            <div className="absolute top-24 left-16 w-12 h-8 bg-[#8B5CF6] rounded-sm" />
                            
                            {/* The "P" loop */}
                            <div className="absolute top-12 right-0 w-16 h-16 bg-gradient-to-b from-[#3B82F6] to-[#8B5CF6] rounded-r-3xl rounded-bl-sm rounded-tl-sm flex items-center justify-center">
                                <div className="w-8 h-8 bg-[#05050A] rounded-r-xl rounded-l-sm" />
                            </div>
                            
                            {/* Connection lines */}
                            <div className="absolute top-4 left-12 w-4 h-[1px] bg-blue-400" />
                            <div className="absolute top-16 left-12 w-4 h-[1px] bg-blue-500" />
                            <div className="absolute top-28 left-12 w-4 h-[1px] bg-purple-500" />
                            <div className="absolute top-8 left-8 w-[1px] h-4 bg-blue-400" />
                            <div className="absolute top-20 left-8 w-[1px] h-4 bg-purple-500" />
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-black tracking-widest text-white uppercase mb-1">ESTAMPARIA</h1>
                    <span className="text-3xl font-black bg-gradient-to-r from-[#48C6EF] to-[#8B5CF6] bg-clip-text text-transparent uppercase tracking-widest">PRO</span>
                    <p className="text-slate-400 mt-6 text-sm font-medium tracking-wide">
                        O sistema <span className="bg-gradient-to-r from-[#48C6EF] to-[#8B5CF6] bg-clip-text text-transparent font-bold">inteligente</span> da sua estamparia.
                    </p>
                </div>

                {/* Bottom Features */}
                <div className="absolute bottom-12 left-0 right-0 px-12 grid grid-cols-4 gap-4 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#48C6EF] border border-[#3B82F6]/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"><Package className="w-5 h-5"/></div>
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Organize</h3>
                        <p className="text-[9px] text-slate-500">Centralize pedidos,<br/>clientes e arquivos.</p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#A855F7] border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]"><ArrowRight className="w-5 h-5"/></div>
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Automatize</h3>
                        <p className="text-[9px] text-slate-500">Fluxos inteligentes<br/>que otimizam seu tempo.</p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#48C6EF] border border-[#3B82F6]/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <div className="flex gap-1 items-end h-5">
                                <div className="w-1.5 h-3 bg-[#48C6EF] rounded-sm" />
                                <div className="w-1.5 h-5 bg-[#48C6EF] rounded-sm" />
                                <div className="w-1.5 h-4 bg-[#48C6EF] rounded-sm" />
                            </div>
                        </div>
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Acompanhe</h3>
                        <p className="text-[9px] text-slate-500">Tenha controle total<br/>da produção em tempo real.</p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#A855F7] border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                            <div className="w-5 h-5 rounded-full border-2 border-[#A855F7] border-t-transparent flex items-center justify-center" />
                        </div>
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Evolua</h3>
                        <p className="text-[9px] text-slate-500">Mais produtividade<br/>e resultados para o seu negócio.</p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT COLUMN - Form ── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
                <div className="absolute top-0 right-0 w-full h-full bg-[#05050A] pointer-events-none -z-10" />

                <div className="w-full max-w-[480px] relative">
                    
                    {/* Gradient Border Wrapper */}
                    <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-br from-[#48C6EF]/80 via-[#0b1221] to-[#8B5CF6]/80 shadow-2xl">
                        
                        {/* Inner Glassmorphic Panel */}
                        <div className="relative bg-[#0F111A] rounded-[1.9rem] p-8 lg:p-10 overflow-hidden h-full">
                            
                            {/* Top right tech decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-30 pointer-events-none">
                                <div className="absolute top-12 right-12 w-2 h-2 bg-[#3B82F6]" />
                                <div className="absolute top-16 right-20 w-3 h-3 bg-[#8B5CF6]" />
                                <div className="absolute top-20 right-10 w-1.5 h-1.5 bg-[#48C6EF]" />
                                <div className="absolute top-16 right-12 w-8 h-[1px] bg-[#3B82F6]/50" />
                                <div className="absolute top-12 right-20 w-[1px] h-4 bg-[#8B5CF6]/50" />
                            </div>

                            {/* Theme Toggle (Visual Placeholder to match image) */}
                            <div className="absolute top-6 right-8 flex items-center gap-2 text-slate-400 text-xs font-medium cursor-not-allowed opacity-60">
                                <span>Tema</span>
                                <div className="flex items-center gap-1 bg-[#1A1C26] rounded-full p-1 border border-[#1e293b]">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-slate-500"><Sparkles className="w-3 h-3" /></div>
                                    <div className="w-5 h-5 rounded-full bg-[#1e293b] flex items-center justify-center text-white"><div className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent rotate-45" /></div>
                                </div>
                            </div>

                            <div className="mb-10 mt-4">
                                <span className="text-[12px] font-medium text-slate-400 mb-2 block">
                                    {mode === 'login' ? 'Bem-vindo de volta! 👋' : mode === 'client_login' ? 'PORTAL DO CLIENTE 👋' : mode === 'forgot_password' ? 'RECUPERAR ACESSO 🔑' : 'RASTREAMENTO 👋'}
                                </span>
                                <h2 className="text-[32px] font-bold text-white mb-3">
                                    {mode === 'login' ? 'Acesse ' : mode === 'client_login' ? 'Seu ' : mode === 'forgot_password' ? 'Recuperar ' : 'Buscar '}
                                    <span className="bg-gradient-to-r from-[#48C6EF] to-[#8B5CF6] bg-clip-text text-transparent">
                                        {mode === 'login' ? 'sua conta' : mode === 'client_login' ? 'espaço' : mode === 'forgot_password' ? 'senha' : 'pedido'}
                                    </span>
                                </h2>
                                <p className="text-sm text-slate-400 font-medium">
                                    {mode === 'login' ? 'Entre com suas credenciais para acessar' : 
                                     mode === 'client_login' ? 'Acesse com seu documento ou telefone' :
                                     mode === 'forgot_password' ? 'Informe seu e-mail e enviaremos um link para redefinir sua senha.' :
                                     'Digite o número do seu pedido para ver o status.'}
                                     <br/>
                                     {mode === 'login' && (
                                         <>o sistema <span className="text-[#3B82F6]">Estamparia</span> <span className="text-[#8B5CF6]">Pro.</span></>
                                     )}
                                </p>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-semibold">{error}</span>
                                </div>
                            )}

                            {/* ── TRACKER MODE ── */}
                            {mode === 'tracker' ? (
                                <div className="space-y-6">
                                    <form onSubmit={handleTrack} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                NÚMERO DO PEDIDO
                                            </label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    type="text"
                                                    value={trackNumber}
                                                    onChange={(e) => setTrackNumber(e.target.value)}
                                                    className="w-full bg-[#13141C] border border-[#1e293b] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-bold text-base uppercase tracking-widest"
                                                    placeholder="#0000"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || !trackNumber}
                                            className="w-full bg-gradient-to-r from-[#48C6EF] to-[#8B5CF6] hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/20 disabled:opacity-40 flex items-center justify-center gap-2 text-sm mt-4"
                                        >
                                            {loading ? 'Buscando...' : <><Truck className="w-4 h-4" /> Rastrear Agora</>}
                                        </button>
                                    </form>

                                    {trackedOrder && (
                                        <div className="bg-[#13141C] border border-[#1e293b] rounded-xl p-5 space-y-4 mt-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Status Atual</span>
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${STATUS_CONFIG[trackedOrder.status]?.color || 'bg-[#0f172a] text-slate-400 border-[#1e293b]'}`}>
                                                        {STATUS_CONFIG[trackedOrder.status]?.label || trackedOrder.status}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Previsão</span>
                                                    <span className="text-white font-bold text-sm">
                                                        {new Date(trackedOrder.deliveryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-[#1e293b]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
                                                        <Package className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{trackedOrder.clientName}</p>
                                                        <p className="text-xs text-slate-500">{trackedOrder.items.length} itens no pedido</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => { setMode('login'); setError(null); setTrackedOrder(null); }}
                                            className="text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                                        >
                                            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Voltar para o Login
                                        </button>
                                    </div>
                                </div>

                            ) : mode === 'forgot_password' ? (
                                /* ── FORGOT PASSWORD MODE ── */
                                <div className="space-y-6">
                                    {forgotSent ? (
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
                                            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <h3 className="text-white font-black text-lg">E-mail enviado!</h3>
                                            <p className="text-slate-400 text-sm">Verifique sua caixa de entrada (e o spam) em <span className="text-white font-bold">{forgotEmail}</span>. O link expira em 1 hora.</p>
                                            <button
                                                onClick={() => { setMode('login'); setError(null); setForgotSent(false); }}
                                                className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white font-bold rounded-xl text-sm mt-2"
                                            >
                                                Voltar para o Login
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleForgotPassword} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">E-MAIL DA CONTA</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                    <input
                                                        type="email"
                                                        value={forgotEmail}
                                                        onChange={(e) => setForgotEmail(e.target.value)}
                                                        className="w-full bg-[#13141C] border border-[#1e293b] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#48C6EF]/50 focus:ring-1 focus:ring-[#48C6EF]/30 transition-all text-sm font-medium"
                                                        placeholder="seu@email.com"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={forgotLoading}
                                                className="w-full bg-gradient-to-r from-[#2563EB] via-[#48C6EF] to-[#8B5CF6] hover:opacity-90 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                                            >
                                                {forgotLoading ? (
                                                    <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Enviando...</>
                                                ) : (
                                                    <>Enviar link de recuperação <ArrowRight className="w-4 h-4" /></>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setMode('login'); setError(null); }}
                                                className="w-full text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 pt-2"
                                            >
                                                <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Voltar para o Login
                                            </button>
                                        </form>
                                    )}
                                </div>

                            ) : (
                            /* ── LOGIN / CLIENT LOGIN MODE ── */
                            <>
                                <form onSubmit={handleAuth} className="space-y-5">
                                    {/* Email / Identifier field */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                            {mode === 'client_login' ? 'E-MAIL, WHATSAPP OU DOCUMENTO' : 'E-MAIL'}
                                        </label>
                                        <div className="relative">
                                            {mode === 'client_login' ? (
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            ) : (
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            )}
                                            <input
                                                type={mode === 'client_login' ? 'text' : 'email'}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-[#13141C] border border-[#1e293b] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#48C6EF]/50 focus:ring-1 focus:ring-[#48C6EF]/30 transition-all text-sm font-medium"
                                                placeholder={mode === 'client_login' ? 'ex: joao@email.com, 11999999999' : 'seu@email.com'}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password field */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">SENHA</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-[#13141C] border border-[#1e293b] rounded-xl py-3.5 pl-11 pr-11 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#48C6EF]/50 focus:ring-1 focus:ring-[#48C6EF]/30 transition-all text-sm font-medium tracking-widest"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Options row (Checkbox & Forgot password) */}
                                    <div className="flex items-center justify-between pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="w-4 h-4 rounded-[4px] border border-slate-600 group-hover:border-purple-500 flex items-center justify-center transition-colors bg-[#13141C]">
                                                {/* Empty for design accuracy */}
                                            </div>
                                            <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors font-medium">Lembrar-me</span>
                                        </label>
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => { setMode('forgot_password'); setError(null); setForgotSent(false); setForgotEmail(''); }}
                                                className="text-xs text-[#3B82F6] hover:text-[#8B5CF6] font-medium transition-colors"
                                            >
                                                Esqueci minha senha
                                            </button>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-[#2563EB] via-[#48C6EF] to-[#8B5CF6] hover:opacity-90 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(72,198,239,0.2)] disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 mt-4"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                Processando...
                                            </>
                                        ) : (
                                            <>
                                                {mode === 'client_login' ? 'Acessar Portal' : 'Entrar no sistema'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="my-6 flex items-center gap-3 opacity-60">
                                    <div className="flex-1 h-[1px] bg-slate-700/50" />
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">OU</span>
                                    <div className="flex-1 h-[1px] bg-slate-700/50" />
                                </div>

                                {/* Google Login Button */}
                                <button
                                    type="button"
                                    onClick={() => alert("Login com Google em desenvolvimento")}
                                    className="w-full bg-[#13141C] border border-[#1e293b] hover:bg-[#1A1C26] text-white text-sm font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 mb-8"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                    Entrar com Google
                                </button>

                                {/* Secondary Actions Navigation (Footer) */}
                                <div className="text-center text-[13px] text-slate-400 flex flex-col gap-3 font-medium">
                                    <div>
                                        Ainda não tem uma conta? <a href="#" className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-80 transition-opacity font-semibold">Crie sua conta</a>
                                    </div>
                                    
                                    {/* Keep existing sub-modes accessible visually separated */}
                                    <div className="flex justify-center items-center gap-4 mt-2 opacity-50 hover:opacity-100 transition-opacity text-xs">
                                        <button onClick={() => { setMode('tracker'); setError(null); }} className="hover:text-white transition-colors flex items-center gap-1"><Truck className="w-3 h-3"/> Rastrear</button>
                                        <span className="opacity-20">|</span>
                                        {mode === 'client_login' ? (
                                            <button onClick={() => { setMode('login'); setError(null); }} className="hover:text-white transition-colors flex items-center gap-1"><Store className="w-3 h-3"/> Área Lojista</button>
                                        ) : (
                                            <button onClick={() => { setMode('client_login'); setError(null); }} className="hover:text-white transition-colors flex items-center gap-1"><User className="w-3 h-3"/> Sou Cliente</button>
                                        )}
                                    </div>
                                </div>
                            </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
