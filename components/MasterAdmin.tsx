import React, { useState, useEffect } from 'react';
import { tenantService } from '../services/tenantService';
import { ShieldAlert, Users, Calendar, Activity, CheckCircle2, XCircle, Plus, LayoutList, CreditCard, Save } from 'lucide-react';

const MasterAdmin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ativos' | 'novo' | 'planos'>('ativos');

    const [tenants, setTenants] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newName, setNewName] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [newPlan, setNewPlan] = useState('Pro Plus');
    const [newPrice, setNewPrice] = useState(149.90);
    const [newCycle, setNewCycle] = useState('Mensal');
    
    // Edit Modal States
    const [editingTenant, setEditingTenant] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editPlan, setEditPlan] = useState('');
    const [editPrice, setEditPrice] = useState(0);
    const [editCycle, setEditCycle] = useState('');
    const [editEndDate, setEditEndDate] = useState('');

    const load = async () => {
        setLoading(true);
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

    useEffect(() => { load(); }, []);

    const handleCreateTenant = async () => {
        if(!newName || !newDomain) return alert("Preencha o Nome e o Domínio.");
        try {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // Default 30 days
            
            await tenantService.createTenant({
                name: newName,
                domain: newDomain,
                plan: newPlan,
                plan_price: newPrice,
                billing_cycle: newCycle,
                subscription_end_date: endDate.toISOString(),
                active: true
            });
            alert("Inquilino Casastrado com Sucesso!");
            setNewName('');
            setNewDomain('');
            setActiveTab('ativos');
            load();
        } catch(e) {
            alert("Erro ao criar inquilino.");
            console.error(e);
        }
    };

    const handleUpdateActive = async (id: string, active: boolean) => {
        await tenantService.updateTenant(id, { active });
        load();
    }

    const handleSaveEdit = async () => {
        if(!editingTenant) return;
        try {
            await tenantService.updateTenant(editingTenant.id, {
                name: editName,
                plan: editPlan,
                plan_price: editPrice,
                billing_cycle: editCycle,
                subscription_end_date: editEndDate
            });
            setEditingTenant(null);
            load();
            alert("Dados do Inquilino atualizados!");
        } catch(e) {
            alert("Erro ao salvar alterações.");
        }
    };

    const openEdit = (t: any) => {
        setEditingTenant(t);
        setEditName(t.name);
        setEditPlan(t.plan);
        setEditPrice(t.plan_price);
        setEditCycle(t.billing_cycle || 'Mensal');
        setEditEndDate(t.subscription_end_date?.split('T')[0] || '');
    };

    const calculateDaysRemaining = (endDateStr: string) => {
        if(!endDateStr) return 0;
        const end = new Date(endDateStr);
        const today = new Date();
        const diff = end.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getRemainingBgColor = (days: number) => {
        if(days > 15) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if(days > 5) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if(days > 0) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    };

    const mrr = tenants.filter(t => t.active).reduce((acc, current) => acc + Number(current.plan_price || 0), 0);

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500 p-6 max-w-7xl mx-auto space-y-8 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6 gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter flex items-center justify-center md:justify-start gap-3">
                        <ShieldAlert className="w-8 h-8 text-rose-500" /> Gestão SaaS
                    </h2>
                    <p className="text-slate-500 font-medium mt-2">Controle de Assinaturas e Inquilinos do Sistema.</p>
                </div>

                <div className="flex flex-wrap justify-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1 shadow-xl">
                  <button
                    onClick={() => setActiveTab('ativos')}
                    className={`px-5 py-3 flex items-center gap-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ativos' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  >
                    <Activity className="w-4 h-4"/> Assinantes
                  </button>
                  <button
                    onClick={() => setActiveTab('novo')}
                    className={`px-5 py-3 flex items-center gap-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'novo' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  >
                    <Plus className="w-4 h-4"/> Cadastrar
                  </button>
                  <button
                    onClick={() => setActiveTab('planos')}
                    className={`px-5 py-3 flex items-center gap-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'planos' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  >
                    <LayoutList className="w-4 h-4"/> Planos SaaS
                  </button>
                </div>
            </div>

            {loading ? (
                <div className="text-slate-500 font-bold p-10 text-center">Carregando dados globais...</div>
            ) : (
                <>
                {/* ---------- ABA: ASSINANTES ATIVOS ---------- */}
                {activeTab === 'ativos' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* KPI Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Empresas Cadastradas</p>
                                <p className="text-3xl font-black text-slate-100">{tenants.length}</p>
                            </div>
                            <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Assinaturas Ativas</p>
                                <p className="text-3xl font-black text-emerald-400">{tenants.filter(t => t.active).length}</p>
                            </div>
                            <div className="bg-indigo-900/10 p-6 rounded-3xl border border-indigo-500/20 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Receita Mensal (MRR)</p>
                                <p className="text-3xl font-black text-indigo-300">R$ {mrr.toFixed(2).replace('.',',')}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {tenants.map(t => {
                                const tenantProfiles = profiles.filter(p => p.tenant_id === t.id);
                                const daysRemaining = calculateDaysRemaining(t.subscription_end_date);
                                const isExpired = daysRemaining <= 0;

                                return (
                                    <div key={t.id} className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 shadow-lg flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 hover:border-slate-700 transition-colors">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">{t.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${t.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                    {t.active ? 'Ativo' : 'Bloqueado'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                                ID: <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded select-all">{t.id}</span>
                                            </p>
                                            
                                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                                                    <CreditCard className="w-4 h-4 text-slate-500"/>
                                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{t.plan} • R$ {Number(t.plan_price || 0).toFixed(2).replace('.',',')}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-950 px-1 rounded">{t.billing_cycle || 'Mensal'}</span>
                                                </div>

                                                <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl ${getRemainingBgColor(daysRemaining)}`}>
                                                    <Calendar className="w-4 h-4"/>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {isExpired ? 'Assinatura Vencida' : `Vence em ${daysRemaining} dias`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto mt-4 xl:mt-0">
                                            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 w-full xl:w-64 shadow-inner hidden md:block">
                                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center justify-between">
                                                <span><Users className="w-4 h-4 inline mr-2 text-slate-400"/> Acessos Cadastrados ({tenantProfiles.length})</span>
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {tenantProfiles.slice(0,3).map(p => (
                                                        <span key={p.id} className="text-slate-400 bg-slate-900 px-2 py-1 rounded-md uppercase font-black text-[9px] tracking-widest border border-slate-800 truncate max-w-[100px]" title={p.full_name}>{p.full_name?.split(' ')[0] || 'Usuário'}</span>
                                                    ))}
                                                    {tenantProfiles.length > 3 && <span className="text-slate-500 text-[10px] font-bold">+{tenantProfiles.length - 3}</span>}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2 w-full xl:w-48 shrink-0">
                                                <button onClick={() => openEdit(t)} className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">
                                                    Editar Inquilino
                                                </button>
                                                <button onClick={() => handleUpdateActive(t.id, !t.active)} className={`w-full px-4 py-3 border rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${t.active ? 'bg-transparent border-rose-500/50 text-rose-500 hover:bg-rose-500/10' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                                    {t.active ? 'Suspender Acesso' : 'Reativar Acesso'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ---------- ABA: NOVO ASSINANTE ---------- */}
                {activeTab === 'novo' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto space-y-6 bg-[#0f172a] p-8 md:p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-3">
                                <Plus className="w-6 h-6 text-indigo-500"/> Adicionar Estamparia
                            </h3>
                            <p className="text-slate-500 text-sm mt-2">Cadastre um novo cliente SaaS. O ambiente dele será criado e isolado na hora.</p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Nome da Empresa</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ex: Alfa Estamparia LTDA"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Domínio / Cód Identificador (Sem espaços)</label>
                                <input
                                    value={newDomain}
                                    onChange={e => setNewDomain(e.target.value)}
                                    placeholder="Ex: alfa-estamparia"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Plano</label>
                                    <select
                                        value={newPlan}
                                        onChange={e => setNewPlan(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="Starter">Starter (Básico)</option>
                                        <option value="Pro Plus">Pro Plus</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Ciclo</label>
                                    <select
                                        value={newCycle}
                                        onChange={e => setNewCycle(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="Mensal">Mensal</option>
                                        <option value="Semestral">Semestral</option>
                                        <option value="Anual">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Valor Cobrado (R$)</label>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={e => setNewPrice(Number(e.target.value))}
                                    placeholder="149.90"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                        </div>

                        <div className="pt-6 border-t border-slate-800/50">
                            <button
                                onClick={handleCreateTenant}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                            >
                                <Save className="w-5 h-5"/> Criar Ambiente Agora
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------- ABA: PLANOS ---------- */}
                {activeTab === 'planos' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { name: 'Starter', price: '99', desc: 'Até 2 usuários. Controle de Pedidos Básico.' },
                                { name: 'Pro Plus', price: '149', desc: 'Até 10 usuários. Módulo Financeiro + Loja Inclusos.', color: 'border-indigo-500', popular: true },
                                { name: 'Enterprise', price: '299', desc: 'Usuários ilimitados. API Liberada.' }
                            ].map(p => (
                                <div key={p.name} className={`bg-[#0f172a] p-8 rounded-[3rem] border ${p.color || 'border-slate-800'} shadow-xl relative`}>
                                    {p.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Mais Vendido</div>}
                                    <h3 className="text-2xl font-black text-slate-100 uppercase">{p.name}</h3>
                                    <p className="text-4xl font-black text-emerald-400 my-4">R$ {p.price}<span className="text-sm text-slate-500">/mês</span></p>
                                    <p className="text-sm font-medium text-slate-400">{p.desc}</p>
                                    <button className="mt-8 w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">
                                        Editar Detalhes
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            {/* ---------- MODAL: EDIÇÃO ---------- */}
            {editingTenant && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-xl p-8 border border-slate-800 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Editar: {editingTenant.name}</h3>
                            <button onClick={() => setEditingTenant(null)} className="text-slate-500 hover:text-white"><XCircle /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome da Empresa</label>
                                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500"/>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plano</label>
                                    <select value={editPlan} onChange={e => setEditPlan(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none">
                                        <option value="Starter">Starter</option>
                                        <option value="Pro Plus">Pro Plus</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ciclo</label>
                                    <select value={editCycle} onChange={e => setEditCycle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none">
                                        <option value="Mensal">Mensal</option>
                                        <option value="Semestral">Semestral</option>
                                        <option value="Anual">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor Cobrado (R$)</label>
                                    <input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expiração da Assinatura</label>
                                    <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"/>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setEditingTenant(null)} className="flex-1 py-3 bg-slate-900 text-slate-400 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
};
export default MasterAdmin;
