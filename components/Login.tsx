import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, AlertCircle, Search, Truck, Package, ArrowRight, Phone, User, Store, Shirt, Sparkles, BarChart2, Zap, ShieldCheck } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import { Order } from '../types';
import { clientService } from '../services/clientService';
import { notify } from './ui/toast';
import { EstampariaProLogo } from './ui/EstampariaProLogo';

const Login: React.FC = () => {
    const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'tracker' | 'client_login' | 'forgot_password' | 'register'>('login');
    const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remembered_email')); // FIX BUG-107: estado real de lembrar-me
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
                // FIX BUG-107: Salvar email no localStorage se "Lembrar-me" estiver marcado
                if (rememberMe) {
                    localStorage.setItem('remembered_email', email);
                } else {
                    localStorage.removeItem('remembered_email');
                }
                window.location.href = '/';
            } else if (mode === 'register') {
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/`
                    }
                });
                if (error) throw error;
                if (data.session) {
                    window.location.href = '/';
                } else {
                    notify.success('Registro realizado! Verifique seu e-mail para confirmar a conta.');
                    setMode('login');
                }
            } else if (mode === 'client_login') {
                const clientUser = await clientService.getByPhoneAndPassword(email, password);
                if (!clientUser) throw new Error('Email, WhatsApp/Documento ou Senha incorretos.');
                // FIX SEC-402: Adicionar expiração de 7 dias à sessão do cliente
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);
                localStorage.setItem('client_session', JSON.stringify({
                    id: clientUser.id,
                    name: clientUser.name,
                    phone: clientUser.whatsapp,
                    expires_at: expiresAt.toISOString()
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
            <div className="fixed inset-0 z-[9999] bg-[#080910] flex flex-col items-center justify-center p-6 select-none">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');
                    @keyframes splashFillProgress {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }
                    @keyframes splashFadeIn {
                        0% { opacity: 0; transform: translateY(16px) scale(0.94); }
                        100% { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes splashTitleIn {
                        0% { opacity: 0; transform: translateY(8px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    .splash-wrap {
                        animation: splashFadeIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
                    .splash-title {
                        animation: splashTitleIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
                    }
                `}</style>

                <div className="flex flex-col items-center max-w-xs w-full text-center gap-8 splash-wrap">

                    {/* Logo — usa logo customizado se disponível, senão o SVG profissional */}
                    {splashSettings.logoUrl ? (
                        <div className="relative w-24 h-24 bg-[#0f172a] border border-[#1a1d2e] rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
                            <img src={splashSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                        </div>
                    ) : (
                        <EstampariaProLogo size={96} animated={true} />
                    )}

                    {/* Nome do sistema */}
                    <div className="splash-title space-y-1">
                        <h2
                            className="text-[28px] font-black text-white uppercase"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.18em' }}
                        >
                            ESTAMPARIA
                        </h2>
                        <span
                            className="block text-[22px] font-black uppercase"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.35em', color: '#00CFFF' }}
                        >
                            PRO
                        </span>
                        <p className="text-[10px] font-semibold text-slate-600 tracking-[0.2em] uppercase mt-2">
                            {splashSettings.message}
                        </p>
                    </div>

                    {/* Barra de progresso ciano */}
                    <div className="w-32">
                        <div className="w-full bg-[#0f172a] border border-[#1a1d2e] h-[2px] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    background: '#00CFFF',
                                    boxShadow: '0 0 12px #00CFFF',
                                    animation: `splashFillProgress ${splashSettings.duration}ms cubic-bezier(0.25, 1, 0.5, 1) forwards`
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080910] text-white flex select-none relative overflow-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');

                /* Textura sutil de trama de tecido na coluna esquerda */
                .ep-left-bg::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image:
                        repeating-linear-gradient(0deg,   transparent, transparent 19px, rgba(0,207,255,0.025) 20px),
                        repeating-linear-gradient(90deg,  transparent, transparent 19px, rgba(0,207,255,0.025) 20px);
                    pointer-events: none;
                    z-index: 0;
                }

                @keyframes ep-left-fade-in {
                    from { opacity: 0; transform: translateX(-24px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes ep-feature-in {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .ep-branding-in  { animation: ep-left-fade-in 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
                .ep-feature-card { animation: ep-feature-in 0.6s cubic-bezier(0.22,1,0.36,1) both; }
                .ep-feature-card:nth-child(1) { animation-delay: 0.3s; }
                .ep-feature-card:nth-child(2) { animation-delay: 0.45s; }
                .ep-feature-card:nth-child(3) { animation-delay: 0.6s; }
                .ep-feature-card:nth-child(4) { animation-delay: 0.75s; }
            `}</style>

            {/* ── LEFT COLUMN - Branding (Hidden on mobile) ── */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 z-10 ep-left-bg" style={{ background: '#06070D' }}>

                {/* Glow de fundo — posicionado na parte inferior */}
                <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(0,207,255,0.07) 0%, transparent 65%)' }} />
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)' }} />

                {/* Linha vertical decorativa lateral direita */}
                <div className="absolute top-0 right-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,207,255,0.15) 30%, rgba(0,207,255,0.15) 70%, transparent)' }} />

                {/* Centro — Logo + Título */}
                <div className="flex-1 flex flex-col items-start justify-center gap-10 ep-branding-in relative z-10">

                    <EstampariaProLogo size={100} animated={true} />

                    <div>
                        <h1
                            className="text-[58px] font-black text-white uppercase leading-none"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em' }}
                        >
                            ESTAMPARIA
                        </h1>
                        <span
                            className="block text-[46px] font-black uppercase leading-none"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em', color: '#00CFFF' }}
                        >
                            PRO
                        </span>
                        <p className="text-slate-500 mt-4 text-[13px] font-medium leading-relaxed max-w-[300px]">
                            O sistema <span style={{ color: '#00CFFF', fontWeight: 700 }}>inteligente</span> que transforma
                            a gestão da sua estamparia em resultados reais.
                        </p>
                    </div>

                    {/* Features em coluna — mais elegante */}
                    <div className="grid grid-cols-2 gap-3 w-full max-w-[380px]">
                        {[
                            { icon: <Package className="w-4 h-4" />, title: 'Pedidos', desc: 'Controle total do fluxo de produção' },
                            { icon: <BarChart2 className="w-4 h-4" />, title: 'Financeiro', desc: 'Receita, custo e lucro em tempo real' },
                            { icon: <Zap className="w-4 h-4" />, title: 'Automação', desc: 'Bot de vendas integrado ao WhatsApp' },
                            { icon: <ShieldCheck className="w-4 h-4" />, title: 'Segurança', desc: 'Dados encriptados e acessos por perfil' },
                        ].map((f) => (
                            <div key={f.title} className="ep-feature-card flex items-start gap-3 p-3 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,207,255,0.08)' }}
                            >
                                <div className="mt-0.5 flex-shrink-0" style={{ color: '#00CFFF' }}>{f.icon}</div>
                                <div>
                                    <p className="text-white text-[11px] font-bold uppercase tracking-wider">{f.title}</p>
                                    <p className="text-slate-600 text-[10px] mt-0.5 leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rodapé da coluna esquerda */}
                <div className="flex items-center gap-2 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00CFFF' }} />
                    <span className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.25em]">Gomesz Speed Print · Sistema v26</span>
                </div>
            </div>

            {/* ── RIGHT COLUMN - Form ── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10 relative z-10" style={{ background: '#080910' }}>

                <div className="w-full max-w-[460px] relative">

                    {/* Card com borda ciano sutil */}
                    <div className="relative rounded-2xl shadow-2xl"
                        style={{ background: '#0D0F1C', border: '1px solid rgba(0,207,255,0.15)', boxShadow: '0 0 60px rgba(0,207,255,0.05), 0 24px 80px rgba(0,0,0,0.6)' }}
                    >

                        {/* Decoração: 4 crosshairs nos cantos (referência serigrafia) */}
                        {[['top-3 left-3', 'border-t border-l'], ['top-3 right-3', 'border-t border-r'], ['bottom-3 left-3', 'border-b border-l'], ['bottom-3 right-3', 'border-b border-r']].map(([pos, border]) => (
                            <div key={pos} className={`absolute ${pos} w-4 h-4 ${border} pointer-events-none`}
                                style={{ borderColor: 'rgba(0,207,255,0.25)' }} />
                        ))}

                        <div className="relative p-8 lg:p-10 overflow-hidden">

                            {/* Mini logo no topo — visível no mobile também */}
                            <div className="flex items-center gap-3 mb-8">
                                <EstampariaProLogo size={36} animated={false} />
                                <div>
                                    <span
                                        className="block text-white text-[13px] font-black uppercase leading-none"
                                        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.08em' }}
                                    >ESTAMPARIA</span>
                                    <span
                                        className="block text-[10px] font-black uppercase leading-none mt-0.5"
                                        style={{ color: '#00CFFF', letterSpacing: '0.3em', fontFamily: "'Barlow Condensed', sans-serif" }}
                                    >PRO</span>
                                </div>
                            </div>

                            {/* Header do modo */}
                            <div className="mb-8">
                                <span className="text-[10px] font-bold text-slate-600 mb-1.5 block uppercase tracking-[0.2em]">
                                    {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Novo Acesso' : mode === 'client_login' ? 'Portal do Cliente' : mode === 'forgot_password' ? 'Recuperar Acesso' : 'Rastreamento'}
                                </span>
                                <h2
                                    className="font-black text-white leading-tight"
                                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '32px', letterSpacing: '0.03em' }}
                                >
                                    {mode === 'login' ? 'Acesse sua '
                                        : mode === 'register' ? 'Crie sua '
                                        : mode === 'client_login' ? 'Seu '
                                        : mode === 'forgot_password' ? 'Recuperar '
                                        : 'Buscar '}
                                    <span style={{ color: '#00CFFF' }}>
                                        {mode === 'login' ? 'conta'
                                            : mode === 'register' ? 'conta'
                                            : mode === 'client_login' ? 'espaço'
                                            : mode === 'forgot_password' ? 'senha'
                                            : 'pedido'}
                                    </span>
                                </h2>
                                <p className="text-[12px] text-slate-500 font-medium mt-2 leading-relaxed">
                                    {mode === 'login' ? 'Entre com suas credenciais para acessar o sistema.'
                                     : mode === 'register' ? 'Preencha os dados abaixo para começar.'
                                     : mode === 'client_login' ? 'Acesse com seu e-mail, WhatsApp ou documento.'
                                     : mode === 'forgot_password' ? 'Informe seu e-mail e enviaremos um link de recuperação.'
                                     : 'Digite o número do seu pedido para ver o status.'}
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
                                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                                            <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                                              rememberMe ? 'bg-purple-500 border-purple-500' : 'border-slate-600 group-hover:border-purple-500 bg-[#13141C]'
                                            }`}>
                                                {rememberMe && (
                                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
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
                                                {mode === 'client_login' ? 'Acessar Portal' : mode === 'register' ? 'Criar minha conta' : 'Entrar no sistema'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>



                                {/* Secondary Actions Navigation (Footer) */}
                                <div className="text-center text-[13px] text-slate-400 flex flex-col gap-3 font-medium">

                                    
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
                    </div>{/* /inner p-8 */}
                    </div>{/* /rounded-2xl card */}
                </div>
            </div>
        </div>
    );
};

export default Login;
