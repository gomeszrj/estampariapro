import React, { useState, useEffect } from 'react';
import { tenantService } from '../services/tenantService';
import { ShieldAlert, Users, Calendar, Activity, CheckCircle2, XCircle } from 'lucide-react';

const MasterAdmin: React.FC = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const fetchedTenants = await tenantService.getAllTenants();
                const fetchedProfiles = await tenantService.getAllProfiles();
                setTenants(fetchedTenants || []);
                setProfiles(fetchedProfiles || []);
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500 p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-slate-100 flex items-center justify-center md:justify-start gap-3 uppercase tracking-tighter">
                        <ShieldAlert className="w-8 h-8 text-rose-500" /> Master Admin
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">Gestão global de assinaturas SaaS e Inquilinos.</p>
                </div>
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-4 gap-6 items-center shadow-xl">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Estamparias Ativas</p>
                        <p className="text-2xl font-black text-emerald-400">{tenants.filter(t => t.active).length}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-slate-500 font-bold p-10 text-center">Processando assinaturas...</div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {tenants.map(t => {
                        const tenantProfiles = profiles.filter(p => p.tenant_id === t.id);
                        return (
                            <div key={t.id} className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-colors">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">{t.name}</h3>
                                    <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        ID: <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded select-all">{t.id}</span>
                                    </p>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                            {t.active ? 'Status: ATIVO' : 'Status: BLOQUEADO'}
                                        </span>
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            Plano: {t.plan}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 w-full md:w-96 shadow-inner">
                                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center justify-between">
                                       <span><Users className="w-4 h-4 inline mr-2 text-slate-400"/> Acessos Cadastrados ({tenantProfiles.length})</span>
                                    </h4>
                                    <div className="space-y-3 max-h-32 overflow-y-auto pr-2 pt-2 custom-scrollbar">
                                        {tenantProfiles.length === 0 ? (
                                            <p className="text-xs text-slate-600 text-center italic">Nenhum perfil listado</p>
                                        ) : (
                                            tenantProfiles.map(p => (
                                                <div key={p.id} className="flex items-center justify-between text-xs border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                                    <div>
                                                        <span className="text-slate-300 font-bold truncate max-w-[200px] block" title={p.full_name || 'Sem nome'}>{p.full_name || 'Supervisor Padrão'}</span>
                                                        <span className="text-[9px] text-slate-500">{p.id.split('-')[0]}...</span>
                                                    </div>
                                                    <span className="text-slate-400 bg-slate-900 px-2 py-1 rounded-md uppercase font-black text-[9px] tracking-widest border border-slate-800">{p.role}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
export default MasterAdmin;
