import React from 'react';
import { CreditCard, Calendar, Users, RefreshCw, Zap, CheckCheck, Copy, XCircle, PhoneCall, Mail } from 'lucide-react';

interface SaaSOverviewProps {
  tenants: any[];
  profiles: any[];
  statusFilter: 'todos' | 'ativos' | 'vencidos' | 'bloqueados';
  setStatusFilter: (f: 'todos' | 'ativos' | 'vencidos' | 'bloqueados') => void;
  onEditTenant: (t: any) => void;
  onGenerateMPLink: (t: any) => Promise<void>;
  onUpdateActive: (id: string, active: boolean) => void;
  onDeleteTenant: (id: string, name: string) => void;
  generatingMPLink: string | null;
  handleCopyLink: (link: string) => void;
}

// ─── MP Status Badge ─────────────────────────────────────────────────────────
const MPStatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    none:       { label: 'Sem MP',    cls: 'bg-slate-800 text-slate-400 border-slate-700' },
    pending:    { label: 'Pendente',  cls: 'bg-amber-900/30 text-amber-400 border-amber-700/50' },
    authorized: { label: 'Ativo ✓',  cls: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50' },
    paused:     { label: 'Pausado',   cls: 'bg-blue-900/30 text-blue-400 border-blue-700/50' },
    cancelled:  { label: 'Cancelado', cls: 'bg-rose-900/30 text-rose-400 border-rose-700/50' },
  };
  const c = cfg[status] || cfg.none;
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${c.cls}`}>
      MP: {c.label}
    </span>
  );
};

export const SaaSOverview: React.FC<SaaSOverviewProps> = ({
  tenants,
  profiles,
  statusFilter,
  setStatusFilter,
  onEditTenant,
  onGenerateMPLink,
  onUpdateActive,
  onDeleteTenant,
  generatingMPLink,
  handleCopyLink,
}) => {
  const calcDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 0;
    return Math.ceil((new Date(endDateStr).getTime() - Date.now()) / 86400000);
  };

  const daysColor = (days: number) => {
    if (days > 15) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (days > 5)  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (days > 0)  return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  const mrr = tenants.filter(t => t.active).reduce((s, t) => s + Number(t.plan_price || 0), 0);
  const mpActive = tenants.filter(t => t.mp_subscription_status === 'authorized').length;
  const overdueMRR = tenants.filter(t => calcDaysRemaining(t.subscription_end_date) <= 0 && t.active)
    .reduce((s, t) => s + Number(t.plan_price || 0), 0);

  const filteredTenants = tenants.filter(t => {
    const d = calcDaysRemaining(t.subscription_end_date);
    if (statusFilter === 'ativos')    return t.active && d > 0;
    if (statusFilter === 'vencidos')  return t.active && d <= 0;
    if (statusFilter === 'bloqueados') return !t.active;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Empresas',       value: tenants.length,    cls: 'text-slate-100' },
          { label: 'Ativas',         value: tenants.filter(t => t.active && calcDaysRemaining(t.subscription_end_date) > 0).length, cls: 'text-emerald-400' },
          { label: 'MP Autorizado',  value: mpActive,          cls: 'text-white' },
          { label: 'Inadimplência',  value: `R$ ${overdueMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, cls: 'text-rose-300' },
          { label: 'MRR',            value: `R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, cls: 'text-white/80' },
        ].map((k, i) => (
          <div key={i} className="bg-[#0f172a] p-5 rounded-3xl border border-[#1e293b] shadow-xl">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.cls}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 bg-[#0f172a] p-1.5 rounded-2xl border border-[#1e293b] w-fit">
        {(['todos', 'ativos', 'vencidos', 'bloqueados'] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              statusFilter === f ? 'bg-[#8B5CF6] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tenant Cards */}
      <div className="space-y-4">
        {filteredTenants.length === 0 && (
          <p className="text-slate-500 text-center py-10 font-bold">Nenhum assinante neste filtro.</p>
        )}
        {filteredTenants.map(t => {
          const tenantProfiles = profiles.filter(p => p.tenant_id === t.id);
          const days = calcDaysRemaining(t.subscription_end_date);
          const mpStatus = t.mp_subscription_status || 'none';
          return (
            <div key={t.id} className="bg-[#0f172a] rounded-3xl p-6 border border-[#1e293b] shadow-lg flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 hover:border-slate-700 transition-colors">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">{t.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${t.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                    {t.active ? 'Ativo' : 'Bloqueado'}
                  </span>
                  <MPStatusBadge status={mpStatus} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] px-3 py-1.5 rounded-xl">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black uppercase text-slate-300">
                      {t.plan} · R$ {Number(t.plan_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-500 bg-[#1C1C26] px-1 rounded">{t.billing_cycle || 'Mensal'}</span>
                  </div>
                  <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl ${daysColor(days)}`}>
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">
                      {days <= 0 ? 'Vencida' : `${days}d restantes`}
                    </span>
                  </div>
                  {t.admin_whatsapp && (
                    <span className="flex items-center gap-1 text-[9px] text-slate-500">
                      <PhoneCall className="w-3 h-3" />{t.admin_whatsapp}
                    </span>
                  )}
                  {t.admin_email && (
                    <span className="flex items-center gap-1 text-[9px] text-slate-500">
                      <Mail className="w-3 h-3" />{t.admin_email}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                <div className="bg-[#1C1C26] rounded-2xl p-3 border border-[#1e293b] w-full xl:w-48 hidden md:block">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">
                    <Users className="w-3 h-3 inline mr-1" />Acessos ({tenantProfiles.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tenantProfiles.slice(0, 3).map(p => (
                      <span key={p.id} className="text-slate-400 bg-[#0f172a] px-2 py-1 rounded-md font-black text-[9px] uppercase border border-[#1e293b] truncate max-w-[80px]">
                        {p.full_name?.split(' ')[0] || 'User'}
                      </span>
                    ))}
                    {tenantProfiles.length > 3 && (
                      <span className="text-slate-500 text-[10px] font-bold">+{tenantProfiles.length - 3}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full xl:w-44 shrink-0">
                  <button
                    onClick={() => onEditTenant(t)}
                    className="w-full px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Editar / Módulos
                  </button>
                  {mpStatus === 'authorized' ? (
                    <div className="w-full px-4 py-2.5 bg-emerald-900/20 border border-emerald-500/30 text-emerald-500 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 cursor-default">
                      <CheckCheck className="w-3 h-3" /> MP Autorizado
                    </div>
                  ) : (
                    <button
                      onClick={() => onGenerateMPLink(t)}
                      disabled={generatingMPLink === t.id}
                      className="w-full px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {generatingMPLink === t.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      Gerar Link MP
                    </button>
                  )}
                  {t.payment_link && (
                    <button
                      onClick={() => handleCopyLink(t.payment_link)}
                      className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all"
                    >
                      <Copy className="w-3 h-3" /> Copiar Link
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateActive(t.id, !t.active)}
                      className={`flex-1 px-4 py-2.5 border rounded-xl font-black uppercase text-[10px] transition-all ${
                        t.active
                          ? 'border-rose-500/50 text-rose-500 hover:bg-rose-500/10'
                          : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {t.active ? 'Suspender' : 'Reativar'}
                    </button>
                    <button
                      onClick={() => onDeleteTenant(t.id, t.name)}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl font-black uppercase transition-all"
                      title="Excluir Permanentemente"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
