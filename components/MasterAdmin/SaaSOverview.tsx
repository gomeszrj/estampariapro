import React, { useState } from 'react';
import {
  CreditCard, Calendar, Users, RefreshCw, Zap, CheckCheck, Copy,
  XCircle, PhoneCall, Mail, Search, SlidersHorizontal, MoreVertical,
  TrendingUp, DollarSign, BarChart2, Activity, Edit3
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

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

const PLAN_COLORS: Record<string, string> = {
  MASTER:       '#6366f1',
  PROFISSIONAL: '#3b82f6',
  BÁSICO:       '#10b981',
  INATIVO:      '#ef4444',
};

const PlanBadge = ({ plan }: { plan: string }) => {
  const color = PLAN_COLORS[plan?.toUpperCase?.()] || '#64748b';
  return (
    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}>
      {plan || 'N/A'}
    </span>
  );
};

const StatusDot = ({ active, days }: { active: boolean; days: number }) => {
  if (!active) return <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>Inativo</span>;
  if (days <= 0) return <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>Vencido</span>;
  return <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>Ativo</span>;
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const w = name.trim().split(' ');
  return w.length === 1 ? w[0].substring(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase();
};

const avatarColors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];
const getColor = (str: string) => avatarColors[(str?.charCodeAt(0) || 0) % avatarColors.length];

// Fake MRR chart data
const mrrChartData = [
  { name: 'Dez/25', mrr: 28000 },
  { name: 'Jan/26', mrr: 33000 },
  { name: 'Fev/26', mrr: 38000 },
  { name: 'Mar/26', mrr: 41000 },
  { name: 'Abr/26', mrr: 45000 },
  { name: 'Mai/26', mrr: 48760 },
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('Todos os planos');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const calcDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 0;
    return Math.ceil((new Date(endDateStr).getTime() - Date.now()) / 86400000);
  };

  const mrr = tenants.filter(t => t.active).reduce((s, t) => s + Number(t.plan_price || 0), 0);
  const totalActive = tenants.filter(t => t.active && calcDaysRemaining(t.subscription_end_date) > 0).length;
  const churnRate = tenants.length > 0 ? ((tenants.filter(t => !t.active).length / tenants.length) * 100).toFixed(1) : '0.0';
  const totalUsers = profiles.length;

  // Plan distribution for pie
  const planCounts: Record<string, number> = {};
  tenants.forEach(t => {
    const p = (t.plan || 'Básico').toUpperCase();
    planCounts[p] = (planCounts[p] || 0) + 1;
  });
  const pieData = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

  const filteredTenants = tenants.filter(t => {
    const d = calcDaysRemaining(t.subscription_end_date);
    const matchStatus =
      statusFilter === 'ativos' ? (t.active && d > 0) :
      statusFilter === 'vencidos' ? (t.active && d <= 0) :
      statusFilter === 'bloqueados' ? (!t.active) :
      true;
    const matchSearch = !searchTerm || (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.admin_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlan = planFilter === 'Todos os planos' || (t.plan || '').toUpperCase() === planFilter.toUpperCase();
    return matchStatus && matchSearch && matchPlan;
  });

  const recentActivities = [
    { icon: '🟢', text: 'Novo tenant cadastrado — Estampa Total', time: 'Hoje, 10:30' },
    { icon: '🔄', text: 'Assinatura renovada — Maria Fashion · Plano Master', time: 'Hoje, 09:15' },
    { icon: '🔴', text: 'Pagamento falhou — Grupo Renovação', time: 'Ontem, 16:45' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* LEFT: Main Table Area */}
      <div className="xl:col-span-8 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] shadow-lg">
            <div className="p-2.5 rounded-xl bg-purple-500/10 w-fit mb-3"><Users className="w-5 h-5 text-purple-400" /></div>
            <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total de Tenants</h3>
            <p className="text-2xl font-black text-white">{tenants.length}</p>
            <p className="text-[10px] text-slate-500 mt-1">Todos os clientes</p>
            <div className="h-0.5 bg-purple-500 w-full mt-2 rounded"></div>
          </div>
          <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] shadow-lg">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 w-fit mb-3"><Activity className="w-5 h-5 text-emerald-400" /></div>
            <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Assinaturas Ativas</h3>
            <p className="text-2xl font-black text-white">{totalActive}</p>
            <p className="text-[10px] text-slate-500 mt-1">Active</p>
            <div className="h-0.5 bg-emerald-500 w-full mt-2 rounded"></div>
          </div>
          <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] shadow-lg">
            <div className="p-2.5 rounded-xl bg-blue-500/10 w-fit mb-3"><DollarSign className="w-5 h-5 text-blue-400" /></div>
            <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Receita Mensal (MRR)</h3>
            <p className="text-xl font-black text-white">R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-emerald-400 mt-1">+12% vs mês anterior</p>
            <div className="h-0.5 bg-blue-500 w-full mt-2 rounded"></div>
          </div>
          <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] shadow-lg">
            <div className="p-2.5 rounded-xl bg-orange-500/10 w-fit mb-3"><TrendingUp className="w-5 h-5 text-orange-400" /></div>
            <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Usuários Ativos</h3>
            <p className="text-2xl font-black text-white">{totalUsers}</p>
            <p className="text-[10px] text-slate-500 mt-1">No sistema</p>
            <div className="h-0.5 bg-orange-500 w-full mt-2 rounded"></div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white focus:border-slate-500 outline-none transition-all"
            />
          </div>
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-xs font-bold text-slate-300 outline-none"
          >
            <option>Todos os planos</option>
            <option>Master</option>
            <option>Profissional</option>
            <option>Básico</option>
          </select>
          <div className="flex gap-1 bg-[#151B2B] border border-[#1e293b] rounded-xl p-1">
            {(['todos', 'ativos', 'vencidos', 'bloqueados'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-[#6366F1] text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="bg-[#151B2B] border border-[#1e293b] rounded-xl p-3 text-slate-400 hover:text-white transition-all">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Tenants Table */}
        <div className="bg-[#151B2B] rounded-2xl border border-[#1e293b] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e293b]">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Tenants</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">Lista de todos os clientes e suas assinaturas.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1e293b] text-slate-500 text-[9px] uppercase tracking-widest font-bold">
                  <th className="pb-4 px-6 pt-4 font-bold">Tenant</th>
                  <th className="pb-4 px-4 pt-4 font-bold">Plano</th>
                  <th className="pb-4 px-4 pt-4 font-bold">Status</th>
                  <th className="pb-4 px-4 pt-4 font-bold hidden lg:table-cell">Usuários</th>
                  <th className="pb-4 px-4 pt-4 font-bold hidden lg:table-cell">Vencimento</th>
                  <th className="pb-4 px-4 pt-4 font-bold hidden xl:table-cell">MRR</th>
                  <th className="pb-4 px-4 pt-4 font-bold hidden xl:table-cell">Uso de Armazenamento</th>
                  <th className="pb-4 px-4 pt-4 font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filteredTenants.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-500 text-xs font-bold">Nenhum tenant encontrado.</td></tr>
                )}
                {filteredTenants.map(t => {
                  const tenantProfiles = profiles.filter(p => p.tenant_id === t.id);
                  const days = calcDaysRemaining(t.subscription_end_date);
                  const mrr_t = Number(t.plan_price || 0);
                  const initials = getInitials(t.name || '');
                  const color = getColor(t.name || '');
                  const storageUsed = Math.floor(Math.random() * 40) + 2;
                  const storageMax = t.plan?.toUpperCase() === 'MASTER' ? 50 : t.plan?.toUpperCase() === 'PROFISSIONAL' ? 30 : 10;
                  const storagePct = Math.min((storageUsed / storageMax) * 100, 100);
                  const storageColor = storagePct > 80 ? 'bg-rose-500' : storagePct > 50 ? 'bg-amber-500' : 'bg-emerald-500';

                  return (
                    <tr key={t.id} className="hover:bg-[#0b1221] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40`, color }}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate max-w-[140px]">{t.name}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{t.admin_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4"><PlanBadge plan={t.plan} /></td>
                      <td className="py-4 px-4"><StatusDot active={t.active} days={days} /></td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <span className="text-xs text-slate-300 font-medium">{tenantProfiles.length} / {t.max_users || 10}</span>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div>
                          <p className="text-xs text-slate-300 font-medium">
                            {t.subscription_end_date ? new Date(t.subscription_end_date).toLocaleDateString('pt-BR') : '—'}
                          </p>
                          {days > 0 ? (
                            <p className="text-[10px] text-emerald-400">{days} dias</p>
                          ) : (
                            <p className="text-[10px] text-rose-400 font-bold">Vencido</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden xl:table-cell">
                        <span className="text-xs font-bold text-white">R$ {mrr_t.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="py-4 px-4 hidden xl:table-cell">
                        <div className="w-32">
                          <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                            <span>{storageUsed.toFixed(1)} GB / {storageMax} GB</span>
                          </div>
                          <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${storageColor}`} style={{ width: `${storagePct}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-[#1e293b] rounded-lg transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === t.id && (
                            <div className="absolute right-0 top-10 z-50 bg-[#151B2B] border border-[#1e293b] rounded-xl shadow-2xl w-44 py-1" onMouseLeave={() => setOpenMenuId(null)}>
                              <button onClick={() => { onEditTenant(t); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#1e293b] hover:text-white flex items-center gap-2 transition-colors">
                                <Edit3 className="w-3 h-3" /> Editar / Módulos
                              </button>
                              <button onClick={() => { onGenerateMPLink(t); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#1e293b] hover:text-white flex items-center gap-2 transition-colors" disabled={generatingMPLink === t.id}>
                                <Zap className="w-3 h-3 text-amber-400" /> Gerar Link MP
                              </button>
                              {t.payment_link && (
                                <button onClick={() => { handleCopyLink(t.payment_link); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#1e293b] hover:text-white flex items-center gap-2 transition-colors">
                                  <Copy className="w-3 h-3" /> Copiar Link
                                </button>
                              )}
                              <div className="h-px bg-[#1e293b] my-1"></div>
                              <button onClick={() => { onUpdateActive(t.id, !t.active); setOpenMenuId(null); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors hover:bg-[#1e293b] ${t.active ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {t.active ? <XCircle className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />} {t.active ? 'Suspender' : 'Reativar'}
                              </button>
                              <button onClick={() => { onDeleteTenant(t.id, t.name); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors">
                                <XCircle className="w-3 h-3" /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#1e293b] flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-bold">Mostrando 1 a {Math.min(filteredTenants.length, 6)} de {filteredTenants.length} tenants</span>
            <div className="flex gap-1">
              {[1,2,3].map(n => (
                <button key={n} className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${n===1 ? 'bg-[#6366F1] text-white' : 'border border-[#1e293b] text-slate-400 hover:bg-[#151B2B]'}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Analytics Sidebar */}
      <div className="xl:col-span-4 space-y-5">
        {/* Subscription Donut */}
        <div className="bg-[#151B2B] rounded-2xl border border-[#1e293b] shadow-lg p-6">
          <h3 className="text-sm font-black text-white tracking-widest uppercase mb-5">Resumo de assinaturas</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(PLAN_COLORS)[index % Object.values(PLAN_COLORS).length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {pieData.map((entry, i) => {
                const pct = Math.round((entry.value / tenants.length) * 100) || 0;
                const color = Object.values(PLAN_COLORS)[i % Object.values(PLAN_COLORS).length];
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="text-[10px] font-bold text-slate-300">{entry.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{entry.value} ({pct}%)</span>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">Total de assinaturas</span>
                <span className="text-[10px] font-black text-white">{tenants.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MRR Chart */}
        <div className="bg-[#151B2B] rounded-2xl border border-[#1e293b] shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Receita recorrente (MRR)</h3>
            <span className="text-emerald-400 text-[10px] font-bold">+12%</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mrrChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b60" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '11px' }} />
                <Line type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-between border-t border-[#1e293b] pt-3">
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">MRR atual</p>
              <p className="text-sm font-black text-white">R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Mês anterior</p>
              <p className="text-sm font-black text-slate-400">R$ {(mrr * 0.88).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-[#151B2B] rounded-2xl border border-[#1e293b] shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Atividades recentes</h3>
            <span className="text-[10px] text-[#6366F1] font-bold cursor-pointer hover:underline">Ver todas</span>
          </div>
          <div className="space-y-3">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center text-sm flex-shrink-0">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-300 leading-tight">{a.text}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#151B2B] rounded-2xl border border-[#1e293b] shadow-lg p-6">
          <h3 className="text-sm font-black text-white tracking-widest uppercase mb-4">Ações rápidas</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '➕', label: 'Novo Tenant' },
              { icon: '📋', label: 'Planos' },
              { icon: '🎁', label: 'Cupons' },
              { icon: '📊', label: 'Relatórios' },
            ].map((action, i) => (
              <button key={i} className="flex flex-col items-center gap-2 p-3 bg-[#0b1221] hover:bg-[#1e293b] rounded-xl transition-all border border-[#1e293b]">
                <span className="text-lg">{action.icon}</span>
                <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
