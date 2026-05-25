import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Hash, Loader2, CheckCircle2, AlertCircle, RefreshCw, Power, Sparkles } from 'lucide-react';
import { whatsappService } from '../services/whatsappService';
import { CRMFullScreen } from './CRM/CRMFullScreen';
import { notify } from './ui/toast';

export const WhatsAppManager: React.FC = () => {
    const [connectionState, setConnectionState] = useState<'loading' | 'connected' | 'disconnected' | 'qr'>('loading');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);
    const [bypassConnection, setBypassConnection] = useState(() => {
        return localStorage.getItem('crm_bypass_connection') === 'true';
    });
    
    // polling for status
    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        const { state } = await whatsappService.getConnectionState();
        if (state === 'open') {
            setConnectionState('connected');
        } else if (state === 'connecting') {
            setConnectionState('loading');
        } else {
            // closed or unconfigured
            if (connectionState !== 'qr') {
                setConnectionState('disconnected');
            }
        }
    };

    const handleGenerateQr = async () => {
        setLoadingAction(true);
        setPairingCode(null);
        const qr = await whatsappService.getQrCode();
        if (qr) {
            setQrCode(qr);
            setConnectionState('qr');
        } else {
            notify.error('Falha ao gerar QR Code. Verifique se a Evolution API está rodando e configurada em Configurações.');
        }
        setLoadingAction(false);
    };

    const handlePairingCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) return;
        setLoadingAction(true);
        setQrCode(null);
        const code = await whatsappService.connectPairingCode(phoneNumber);
        if (code) {
            setPairingCode(code);
            setConnectionState('qr');
        } else {
            notify.error('Falha ao solicitar Pairing Code. Verifique o número e a Evolution API.');
        }
        setLoadingAction(false);
    };

    const handleLogout = async () => {
        setLoadingAction(true);
        await whatsappService.logout();
        setConnectionState('disconnected');
        setQrCode(null);
        setPairingCode(null);
        setLoadingAction(false);
    };

    if (connectionState === 'connected' || bypassConnection) {
        return (
            <CRMFullScreen 
                onLogout={async () => {
                    if (bypassConnection) {
                        setBypassConnection(false);
                        localStorage.removeItem('crm_bypass_connection');
                        notify.success('Modo de simulação encerrado.');
                    } else {
                        await handleLogout();
                    }
                }} 
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-3">
                    <Smartphone className="w-8 h-8 text-emerald-500" />
                    Central WhatsApp
                </h2>
                <p className="text-slate-500 font-medium">Conecte seu WhatsApp para habilitar o Mega CRM.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* STATUS PANEL */}
                <div className="bg-[#0f172a] p-8 rounded-2xl border border-[#1e293b] shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {connectionState === 'loading' && (
                        <>
                            <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-slate-200">Verificando...</h3>
                        </>
                    )}

                    {(connectionState as string) === 'connected' && (
                        <>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                            <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4" />
                            <h3 className="text-2xl font-black text-slate-100 mb-2 uppercase tracking-widest">Conectado</h3>
                            <p className="text-slate-400 mb-8 text-sm">Seu WhatsApp está operando e pronto para o Mega CRM.</p>
                            <button
                                onClick={handleLogout}
                                disabled={loadingAction}
                                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold px-6 py-3 rounded-xl transition-colors border border-rose-500/20"
                            >
                                {loadingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                                Desconectar Aparelho
                            </button>
                        </>
                    )}

                    {(connectionState === 'disconnected' || connectionState === 'qr') && (
                        <>
                            <AlertCircle className="w-16 h-16 text-rose-500 mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-slate-200 mb-2">Aparelho Desconectado</h3>
                            <p className="text-slate-500 text-sm mb-4">Conecte seu WhatsApp para utilizar o CRM.</p>
                            
                            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                                <button
                                    onClick={checkStatus}
                                    className="flex items-center justify-center gap-2 text-white hover:text-white/80 font-bold text-sm py-2 px-4 rounded-xl hover:bg-slate-800/40 transition-all duration-300 w-full border border-transparent hover:border-[#1e293b]"
                                >
                                    <RefreshCw className="w-4 h-4" /> Atualizar Status
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setBypassConnection(true);
                                        localStorage.setItem('crm_bypass_connection', 'true');
                                        notify.success('Entrando no CRM em Modo de Teste Local.');
                                    }}
                                    className="flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-xs uppercase tracking-wider py-3 px-5 rounded-xl transition-all duration-300 w-full shadow-lg shadow-white/10 border border-white/20 group"
                                >
                                    <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                                    Acessar CRM (Modo Teste)
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* CONNECTION METHODS */}
                <div className={`space-y-6 ${((connectionState as string) === 'connected' || connectionState === 'loading') ? 'opacity-30 pointer-events-none' : ''}`}>
                    
                    {/* QR CODE METHOD */}
                    <div className="bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-black text-slate-100 flex items-center gap-2 uppercase tracking-widest text-sm">
                                    <QrCode className="w-4 h-4 text-white" />
                                    Via QR Code
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Abra o WhatsApp e escaneie a tela.</p>
                            </div>
                            <button 
                                onClick={handleGenerateQr}
                                disabled={loadingAction}
                                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-colors shadow-lg shadow-white/5 disabled:opacity-50"
                            >
                                Gerar QR
                            </button>
                        </div>
                        {qrCode && !pairingCode && (
                            <div className="flex justify-center mt-6 bg-white p-4 rounded-2xl w-max mx-auto border-4 border-white/20 animate-in zoom-in-95">
                                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-600">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">OU</span>
                        <div className="h-px bg-slate-800 flex-1"></div>
                    </div>

                    {/* PAIRING CODE METHOD */}
                    <div className="bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
                        <div className="mb-4">
                            <h3 className="font-black text-slate-100 flex items-center gap-2 uppercase tracking-widest text-sm">
                                <Hash className="w-4 h-4 text-emerald-400" />
                                Via Código (Pairing Code)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Ideal se a câmera do seu celular estiver ruim.</p>
                        </div>

                        {pairingCode ? (
                            <div className="text-center py-6 animate-in zoom-in-95">
                                <p className="text-sm text-slate-400 mb-3">Digite o código abaixo no seu WhatsApp:</p>
                                <div className="text-4xl font-black text-emerald-400 tracking-[0.2em] bg-emerald-950/30 py-4 rounded-xl border border-emerald-900/50">
                                    {pairingCode}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handlePairingCode} className="flex gap-2 mt-4">
                                <input 
                                    type="text"
                                    placeholder="Ex: 5511999999999"
                                    value={phoneNumber}
                                    onChange={e => setPhoneNumber(e.target.value)}
                                    className="flex-1 bg-[#0b1221] border border-slate-700 rounded-xl px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                                />
                                <button 
                                    type="submit"
                                    disabled={!phoneNumber || loadingAction}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-3 rounded-xl transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    Gerar
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
