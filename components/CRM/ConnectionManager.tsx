import React, { useEffect, useState } from 'react';
import { evolutionService, EvolutionStatus } from '../services/evolutionService';
import { Loader2, RefreshCw, LogOut, QrCode as QrIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ConnectionManager: React.FC = () => {
    const [status, setStatus] = useState<EvolutionStatus>({ state: 'connecting', status: 'Verificando...' });
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const checkConnection = async () => {
        setIsLoading(true);
        const st = await evolutionService.checkStatus();
        setStatus(st);

        if (st.state !== 'open') {
            // If not connected, try to get QR Code
            const conn = await evolutionService.connect();
            if (conn.qrcode) {
                setQrCode(conn.qrcode);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        checkConnection();
        // Poll every 10s if not connected
        const interval = setInterval(() => {
            if (status.state !== 'open') {
                checkConnection();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [status.state]);

    const handleLogout = async () => {
        if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
            setIsLoading(true);
            await evolutionService.logout();
            setQrCode(null);
            await checkConnection();
        }
    };

    return (
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                <QrIcon className="w-4 h-4 text-emerald-400" />
                Conexão WhatsApp
            </h3>

            <div className="flex flex-col items-center justify-center space-y-4">
                {isLoading && <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />}

                {!isLoading && status.state === 'open' && (
                    <div className="text-center space-y-3 animate-in zoom-in">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-emerald-400 font-bold text-sm">CONECTADO</p>
                        <p className="text-slate-500 text-xs max-w-[200px]">O sistema está pronto para enviar e receber mensagens.</p>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-rose-400 hover:text-white underline decoration-rose-500/30 font-medium"
                        >
                            Desconectar Instância
                        </button>
                    </div>
                )}

                {!isLoading && status.state !== 'open' && (
                    <div className="text-center space-y-4">
                        {qrCode ? (
                            <div className="bg-white p-2 rounded-xl">
                                <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
                            </div>
                        ) : (
                            <div className="w-48 h-48 bg-slate-800 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-700">
                                <p className="text-xs text-slate-500 font-bold uppercase">Aguardando QR Code...</p>
                            </div>
                        )}

                        <div className="text-slate-400 text-xs">
                            <p className="font-bold mb-1">Status: {status.state.toUpperCase()}</p>
                            <p>Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar</p>
                        </div>

                        <button
                            onClick={checkConnection}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto transition-all"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Atualizar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
