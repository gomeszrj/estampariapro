import React, { useState, useEffect, useCallback } from 'react';
import {
    Smartphone, QrCode, Hash, Loader2, CheckCircle2, AlertCircle,
    RefreshCw, Power, Wifi, WifiOff, Settings, ExternalLink, Copy,
    AlertTriangle, Terminal, Eye, EyeOff, ChevronRight, Zap
} from 'lucide-react';
import { whatsappService } from '../services/whatsappService';
import { settingsService } from '../services/settingsService';
import { supabase } from '../services/supabase';
import { CRMFullScreen } from './CRM/CRMFullScreen';
import { notify } from './ui/toast';

type ConnectionState = 'checking' | 'connected' | 'disconnected' | 'qr' | 'api_not_configured' | 'api_unreachable';

interface DiagnosticInfo {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
    rawError?: string;
    rawResponse?: string;
}

export const WhatsAppManager: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);
    const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);
    const [showDiagnostic, setShowDiagnostic] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    // Inline URL editor for quick fix
    const [editingUrl, setEditingUrl] = useState('');
    const [isSavingUrl, setIsSavingUrl] = useState(false);

    const checkStatus = useCallback(async () => {
        const settings = await settingsService.getSettings();
        const { evolution_api_url: url, evolution_api_key: key, evolution_instance_name: instance } = settings;

        setDiagnostic({
            apiUrl: url || '(não configurado)',
            apiKey: key || '(não configurado)',
            instanceName: instance || '(não configurado)',
        });

        if (!url || !key) {
            setConnectionState('api_not_configured');
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(
                `${url}/instance/connectionState/${encodeURIComponent(instance || '')}`,
                {
                    headers: {
                        'apikey': key,
                        'Bypass-Tunnel-Reminder': 'true',
                    },
                    signal: controller.signal,
                }
            );
            clearTimeout(timeoutId);

            const text = await response.text();
            let data: any = {};
            try { data = JSON.parse(text); } catch {}

            setDiagnostic(prev => ({ ...prev!, rawResponse: text.substring(0, 500) }));

            if (!response.ok) {
                setConnectionState('api_unreachable');
                return;
            }

            const state = data?.instance?.state;
            if (state === 'open') {
                setConnectionState('connected');
                setQrCode(null);
                setPairingCode(null);
            } else if (state === 'connecting') {
                setConnectionState('disconnected');
            } else {
                if (connectionState !== 'qr') {
                    setConnectionState('disconnected');
                }
            }
        } catch (e: any) {
            setDiagnostic(prev => ({
                ...prev!,
                rawError: e?.message || String(e),
            }));
            setConnectionState('api_unreachable');
        }
    }, [connectionState]);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 8000);
        return () => clearInterval(interval);
    }, []);

    const handleGenerateQr = async () => {
        setLoadingAction(true);
        setPairingCode(null);
        try {
            const settings = await settingsService.getSettings();
            const { evolution_api_url: url, evolution_api_key: key, evolution_instance_name: instance } = settings;

            const response = await fetch(
                `${url}/instance/connect/${encodeURIComponent(instance || '')}`,
                { headers: { 'apikey': key!, 'Bypass-Tunnel-Reminder': 'true' } }
            );

            if (!response.ok) {
                const errorText = await response.text();
                notify.error(`Erro da API (${response.status}): ${errorText.substring(0, 100)}`);
                setLoadingAction(false);
                return;
            }

            const data = await response.json();

            // The QR code can come in different fields depending on Evolution API version
            const qr = data?.base64 || data?.qrcode?.base64 || data?.qrCode?.base64 || null;

            if (qr) {
                // Ensure it has the data URI prefix
                const qrDataUri = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
                setQrCode(qrDataUri);
                setConnectionState('qr');
                notify.success('QR Code gerado! Escaneie com seu WhatsApp.');
            } else {
                // Maybe already connected or in different state
                notify.warning('A instância já pode estar conectada. Aguarde a verificação automática.');
                await checkStatus();
            }
        } catch (e: any) {
            notify.error(`Erro de conexão: ${e?.message}`);
        } finally {
            setLoadingAction(false);
        }
    };

    const handlePairingCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) return;
        setLoadingAction(true);
        setQrCode(null);

        try {
            const settings = await settingsService.getSettings();
            const { evolution_api_url: url, evolution_api_key: key, evolution_instance_name: instance } = settings;
            const cleanPhone = phoneNumber.replace(/\D/g, '');

            const response = await fetch(
                `${url}/instance/connect/${encodeURIComponent(instance || '')}?number=${cleanPhone}`,
                { headers: { 'apikey': key!, 'Bypass-Tunnel-Reminder': 'true' } }
            );

            if (!response.ok) {
                const errorText = await response.text();
                notify.error(`Erro (${response.status}): ${errorText.substring(0, 150)}`);
                setLoadingAction(false);
                return;
            }

            const data = await response.json();
            const code = data?.pairingCode || data?.code || null;

            if (code) {
                setPairingCode(code);
                setConnectionState('qr');
                notify.success('Código de pareamento gerado!');
            } else {
                notify.warning('Não foi possível gerar o código. Resposta: ' + JSON.stringify(data).substring(0, 100));
            }
        } catch (e: any) {
            notify.error(`Erro: ${e?.message}`);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleLogout = async () => {
        setLoadingAction(true);
        await whatsappService.logout();
        setConnectionState('disconnected');
        setQrCode(null);
        setPairingCode(null);
        setLoadingAction(false);
        notify.success('WhatsApp desconectado.');
    };

    const handleSaveQuickUrl = async () => {
        if (!editingUrl.trim()) return;
        setIsSavingUrl(true);
        try {
            const current = await settingsService.getSettings();
            await settingsService.saveSettings({
                ...current,
                evolution_api_url: editingUrl.trim(),
            });
            notify.success('URL salva! Verificando conexão...');
            setEditingUrl('');
            await checkStatus();
        } catch (e: any) {
            notify.error('Erro ao salvar: ' + e?.message);
        } finally {
            setIsSavingUrl(false);
        }
    };

    // If connected → go directly to CRM
    if (connectionState === 'connected') {
        return <CRMFullScreen onLogout={handleLogout} />;
    }

    return (
        <div className="min-h-screen bg-[#0A0D16] text-slate-200 p-6 md:p-10 font-['Inter']">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                            Central de Conexão WhatsApp
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm ml-13">
                        Conecte sua instância do WhatsApp via Evolution API para ativar o CRM de Atendimento.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* STATUS PANEL */}
                    <div className="lg:col-span-5 space-y-4">

                        {/* Main Status Card */}
                        <div className="bg-[#111625] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden">
                            {/* Background glow */}
                            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${
                                connectionState === 'connected' ? 'bg-emerald-500/10' :
                                connectionState === 'api_unreachable' ? 'bg-rose-500/10' :
                                connectionState === 'checking' ? 'bg-blue-500/10' :
                                'bg-amber-500/10'
                            }`}></div>

                            <div className="relative z-10 flex flex-col items-center text-center py-4">
                                {/* Icon */}
                                {connectionState === 'checking' && (
                                    <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
                                )}
                                {connectionState === 'connected' && (
                                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                                )}
                                {(connectionState === 'disconnected' || connectionState === 'qr') && (
                                    <WifiOff className="w-16 h-16 text-amber-400 mb-4 opacity-80" />
                                )}
                                {connectionState === 'api_unreachable' && (
                                    <AlertTriangle className="w-16 h-16 text-rose-400 mb-4" />
                                )}
                                {connectionState === 'api_not_configured' && (
                                    <Settings className="w-16 h-16 text-slate-400 mb-4" />
                                )}

                                {/* Status Label */}
                                <div className={`text-xs font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-3 ${
                                    connectionState === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    connectionState === 'checking' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    connectionState === 'api_unreachable' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    connectionState === 'api_not_configured' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                    {connectionState === 'checking' && 'Verificando...'}
                                    {connectionState === 'connected' && '✓ Conectado'}
                                    {connectionState === 'disconnected' && 'Desconectado'}
                                    {connectionState === 'qr' && 'Aguardando Escaneio'}
                                    {connectionState === 'api_unreachable' && '⚠ API Inacessível'}
                                    {connectionState === 'api_not_configured' && 'API Não Configurada'}
                                </div>

                                <h3 className="text-lg font-black text-white mb-1">
                                    {connectionState === 'checking' && 'Verificando Conexão'}
                                    {connectionState === 'connected' && 'WhatsApp Operacional'}
                                    {connectionState === 'disconnected' && 'Aguardando Conexão'}
                                    {connectionState === 'qr' && 'Escaneie o QR Code'}
                                    {connectionState === 'api_unreachable' && 'API Não Está Acessível'}
                                    {connectionState === 'api_not_configured' && 'Configure a URL da API'}
                                </h3>
                                <p className="text-slate-500 text-xs mb-6">
                                    {connectionState === 'api_unreachable' && `O sistema não conseguiu se conectar à URL configurada. Isso geralmente acontece porque a URL do localtunnel mudou ou a Evolution API não está rodando.`}
                                    {connectionState === 'api_not_configured' && 'Você precisa configurar a URL e a chave da Evolution API nas Configurações do sistema.'}
                                    {connectionState === 'disconnected' && 'A API está acessível. Gere um QR Code ou use o Código de Pareamento para conectar.'}
                                    {connectionState === 'qr' && 'Abra o WhatsApp > Aparelhos Conectados > Conectar Aparelho e escaneie.'}
                                    {connectionState === 'checking' && 'Aguardando resposta da Evolution API...'}
                                </p>

                                <button
                                    onClick={() => { setConnectionState('checking'); checkStatus(); }}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Verificar Novamente
                                </button>
                            </div>
                        </div>

                        {/* API Unreachable — Quick Fix */}
                        {connectionState === 'api_unreachable' && (
                            <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5 space-y-3">
                                <h4 className="text-rose-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Correção Rápida
                                </h4>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Cole abaixo o novo link do Localtunnel (gerado ao executar o arquivo <code className="text-rose-300 bg-rose-950/50 px-1 rounded">INICIAR_TUNNEL_API.bat</code>) e clique em Salvar:
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={editingUrl}
                                        onChange={e => setEditingUrl(e.target.value)}
                                        placeholder="https://xxxx.loca.lt"
                                        className="flex-1 bg-[#0b1221] border border-rose-500/30 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
                                    />
                                    <button
                                        onClick={handleSaveQuickUrl}
                                        disabled={isSavingUrl || !editingUrl.trim()}
                                        className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors"
                                    >
                                        {isSavingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Diagnostic Info */}
                        {diagnostic && (
                            <div className="bg-[#0b1221] border border-[#1e293b] rounded-2xl p-4">
                                <button
                                    onClick={() => setShowDiagnostic(!showDiagnostic)}
                                    className="w-full flex items-center justify-between text-slate-400 hover:text-white transition-colors"
                                >
                                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5" /> Diagnóstico da API
                                    </span>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${showDiagnostic ? 'rotate-90' : ''}`} />
                                </button>

                                {showDiagnostic && (
                                    <div className="mt-4 space-y-3 text-xs font-mono">
                                        <div>
                                            <span className="text-slate-500">URL:</span>
                                            <p className="text-white break-all mt-0.5">{diagnostic.apiUrl}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">API Key:</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-white break-all">
                                                    {showApiKey ? diagnostic.apiKey : diagnostic.apiKey.replace(/./g, '•')}
                                                </p>
                                                <button onClick={() => setShowApiKey(!showApiKey)}>
                                                    {showApiKey ? <EyeOff className="w-3 h-3 text-slate-500" /> : <Eye className="w-3 h-3 text-slate-500" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Instância:</span>
                                            <p className="text-white mt-0.5">{diagnostic.instanceName}</p>
                                        </div>
                                        {diagnostic.rawError && (
                                            <div>
                                                <span className="text-rose-500">Erro:</span>
                                                <p className="text-rose-300 mt-0.5 break-all">{diagnostic.rawError}</p>
                                            </div>
                                        )}
                                        {diagnostic.rawResponse && (
                                            <div>
                                                <span className="text-slate-500">Resposta:</span>
                                                <p className="text-slate-300 mt-0.5 break-all">{diagnostic.rawResponse}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* CONNECTION METHODS */}
                    <div className={`lg:col-span-7 space-y-5 ${(connectionState === 'checking' || connectionState === 'api_not_configured' || connectionState === 'api_unreachable') ? 'opacity-40 pointer-events-none select-none' : ''}`}>

                        {/* QR Code Method */}
                        <div className="bg-[#111625] border border-[#1e293b] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                                        <QrCode className="w-4 h-4 text-indigo-400" />
                                        Conectar via QR Code
                                    </h3>
                                    <p className="text-slate-500 text-xs mt-1">Método recomendado. Abra o WhatsApp e escaneie.</p>
                                </div>
                                <button
                                    onClick={handleGenerateQr}
                                    disabled={loadingAction}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                >
                                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                                    {loadingAction ? 'Gerando...' : 'Gerar QR Code'}
                                </button>
                            </div>

                            {qrCode && !pairingCode && (
                                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                                    <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-white/10">
                                        <img src={qrCode} alt="QR Code WhatsApp" className="w-52 h-52" />
                                    </div>
                                    <p className="text-slate-500 text-xs mt-3 text-center">
                                        QR Code válido por ~60 segundos. Caso expire, clique em "Gerar QR Code" novamente.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="h-px bg-[#1e293b] flex-1"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">ou use um código</span>
                            <div className="h-px bg-[#1e293b] flex-1"></div>
                        </div>

                        {/* Pairing Code Method */}
                        <div className="bg-[#111625] border border-[#1e293b] rounded-2xl p-6">
                            <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2 mb-1">
                                <Hash className="w-4 h-4 text-emerald-400" />
                                Conectar via Código de Pareamento
                            </h3>
                            <p className="text-slate-500 text-xs mb-5">
                                Ideal para celulares com câmera ruim. Insira o número com DDI (ex: 5521912345678).
                            </p>

                            {pairingCode ? (
                                <div className="text-center py-6 animate-in zoom-in-95 duration-300">
                                    <p className="text-slate-400 text-sm mb-3">
                                        No WhatsApp: <strong className="text-white">Aparelhos Conectados → Conectar com número de telefone</strong>
                                    </p>
                                    <div className="text-5xl font-black text-emerald-400 tracking-[0.25em] bg-emerald-950/30 py-5 rounded-2xl border border-emerald-800/30">
                                        {pairingCode}
                                    </div>
                                    <button
                                        onClick={() => { setPairingCode(null); setConnectionState('disconnected'); }}
                                        className="mt-4 text-slate-500 hover:text-slate-300 text-xs underline transition-colors"
                                    >
                                        Tentar novamente com outro número
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handlePairingCode} className="flex gap-3">
                                    <input
                                        type="tel"
                                        placeholder="5521912345678 (com DDI)"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        className="flex-1 bg-[#0b1221] border border-[#1e293b] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!phoneNumber || loadingAction}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    >
                                        {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Solicitar'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* How to get tunnel URL guide */}
                        {(connectionState === 'api_unreachable' || connectionState === 'api_not_configured') && (
                            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5">
                                <h4 className="text-indigo-300 font-black text-xs uppercase tracking-widest mb-3">
                                    Como obter o link do Túnel?
                                </h4>
                                <ol className="text-slate-400 text-xs space-y-2 list-none">
                                    <li className="flex gap-2"><span className="text-indigo-400 font-bold">1.</span> Execute o arquivo <code className="bg-indigo-950/50 text-indigo-300 px-1 rounded">INICIAR_TUNNEL_API.bat</code> na pasta do projeto.</li>
                                    <li className="flex gap-2"><span className="text-indigo-400 font-bold">2.</span> Copie o link <code className="bg-indigo-950/50 text-indigo-300 px-1 rounded">https://xxxx.loca.lt</code> que aparecer.</li>
                                    <li className="flex gap-2"><span className="text-indigo-400 font-bold">3.</span> Cole no campo "Correção Rápida" ao lado e salve.</li>
                                    <li className="flex gap-2"><span className="text-indigo-400 font-bold">4.</span> Ou vá em <strong className="text-white">Ajustes → Integração Evolution API</strong> e atualize a URL.</li>
                                </ol>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
