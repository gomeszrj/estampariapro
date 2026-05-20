import React, { useState, useEffect } from 'react';
import { Save, X, Key, Database, Brain, RefreshCw, MessageCircle } from 'lucide-react';
import { getConfig, CONFIG_KEYS } from '../utils/config';

interface ApiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
    const [evolutionStore, setEvolutionStore] = useState({
        url: localStorage.getItem('evolution_api_url') || '',
        key: localStorage.getItem('evolution_api_key') || '',
        instance: localStorage.getItem('evolution_instance_name') || 'GomeszSpeedPrint'
    });

    // The original `apiKey` state was likely a remnant or intended for a different purpose.
    // The `geminiKey` is managed within the `keys` state object.
    // Removing the separate `apiKey` state as it's not used in the new save logic for Gemini.
    const [keys, setKeys] = useState({
        supabaseUrl: '',
        supabaseKey: '',
        geminiKey: '',
        openaiKey: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setKeys({
                supabaseUrl: getConfig(CONFIG_KEYS.SUPABASE_URL) || '',
                supabaseKey: getConfig(CONFIG_KEYS.SUPABASE_ANON_KEY) || ''
            });
        }
    }, [isOpen]);

    const handleSave = () => {
        setLoading(true);

        // Restore saving to LocalStorage because the app depends on it if not using .env
        localStorage.setItem(CONFIG_KEYS.SUPABASE_URL, keys.supabaseUrl);
        localStorage.setItem(CONFIG_KEYS.SUPABASE_ANON_KEY, keys.supabaseKey);

        // Save Evolution API Config
        if (evolutionStore.url) localStorage.setItem('evolution_api_url', evolutionStore.url);
        if (evolutionStore.key) localStorage.setItem('evolution_api_key', evolutionStore.key);
        if (evolutionStore.instance) localStorage.setItem('evolution_instance_name', evolutionStore.instance);

        // Force reload to re-init services
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f172a] rounded-[2rem] border border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
                            <Key className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Ajustes de Sistema & API</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Configure as credenciais externas do sistema.
                            </p>
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-red-200">
                                    <strong>Aviso de Segurança:</strong> Salvar credenciais aqui as manterá no <code className="bg-red-500/20 px-1 rounded">LocalStorage</code> do navegador, onde podem ser vistas no "Inspecionar" por quem usar este computador. Para segurança máxima em produção, adicione-as nas variáveis de ambiente (.env / Vercel) e deixe estes campos em branco.
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">

                    {/* Supabase Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <Database className="w-4 h-4" /> Banco de Dados (Supabase)
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Project URL</label>
                                <input
                                    type="text"
                                    value={keys.supabaseUrl}
                                    onChange={e => setKeys(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="https://xyz.supabase.co"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Anon Key</label>
                                <input
                                    type="password"
                                    value={keys.supabaseKey}
                                    onChange={e => setKeys(prev => ({ ...prev, supabaseKey: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800/50"></div>

                    {/* AI Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Brain className="w-4 h-4" /> Inteligência Artificial
                        </h4>
                        <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-2xl">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                As chaves de Inteligência Artificial (Gemini / OpenAI) agora são gerenciadas com segurança diretamente no **Backend (Edge Functions do Supabase)** para evitar exposição no navegador.
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800/50"></div>

                    {/* WhatsApp Evolution API Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" /> WhatsApp Automação (Evolution API)
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Base URL</label>
                                <input
                                    type="text"
                                    value={evolutionStore.url}
                                    onChange={(e) => setEvolutionStore({ ...evolutionStore, url: e.target.value })}
                                    placeholder="https://api.seudominio.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Global API Key</label>
                                <input
                                    type="password"
                                    value={evolutionStore.key}
                                    onChange={(e) => setEvolutionStore({ ...evolutionStore, key: e.target.value })}
                                    placeholder="Global Key da Evolution"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Instance Name</label>
                                <input
                                    type="text"
                                    value={evolutionStore.instance}
                                    onChange={(e) => setEvolutionStore({ ...evolutionStore, instance: e.target.value })}
                                    placeholder="Nome da Instância"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-800 bg-slate-900/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</span>
                        {loading ? 'Salvando e Reiniciando...' : 'Salvar e Recarregar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiSettingsModal;
