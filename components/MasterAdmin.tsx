
import React, { useState, useEffect, useCallback } from 'react';
import { tenantService } from '../services/tenantService';
import {
  ShieldAlert, Users, Calendar, Activity, XCircle, Plus,
  LayoutList, CreditCard, Save, KeyRound,
  Copy, RefreshCw, Zap, CheckCheck,
  PhoneCall, Mail, ChevronDown, ChevronUp, Edit3
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type PermissionKey =
  | 'can_view_dashboard' | 'can_view_orders' | 'can_view_kanban' | 'can_view_art_queue'
  | 'can_view_products' | 'can_view_catalog' | 'can_view_clients' | 'can_view_crm'
  | 'can_view_inventory' | 'can_view_finance' | 'can_view_settings' | 'can_view_store'
  | 'can_create_orders' | 'can_delete_orders' | 'can_export_reports';

type Permissions = Record<PermissionKey, boolean>;

// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_PERMISSIONS_OFF: Permissions = {
  can_view_dashboard: false, can_view_orders: false, can_view_kanban: false,
  can_view_art_queue: false, can_view_products: false, can_view_catalog: false,
  can_view_clients: false, can_view_crm: false, can_view_inventory: false,
  can_view_finance: false, can_view_settings: false, can_view_store: false,
  can_create_orders: false, can_delete_orders: false, can_export_reports: false,
};

const MODULE_LIST: { key: PermissionKey; label: string; desc: string }[] = [
  { key: 'can_view_dashboard',  label: 'Agenda / Dashboard',    desc: 'KPIs e visão geral de produção' },
  { key: 'can_view_orders',     label: 'Pedidos',               desc: 'Lista de pedidos e detalhes' },
  { key: 'can_create_orders',   label: '└ Criar Pedidos',       desc: 'Permissão para cadastrar novos pedidos' },
  { key: 'can_delete_orders',   label: '└ Excluir Pedidos',     desc: 'Permissão para deletar pedidos' },
  { key: 'can_view_kanban',     label: 'Kanban / Fluxo',        desc: 'Acompanhamento do fluxo de produção' },
  { key: 'can_view_art_queue',  label: 'Fila de Arte',          desc: 'Painel de artes e aprovações' },
  { key: 'can_view_products',   label: 'Produtos',              desc: 'Catálogo, preços e cadastro de produtos' },
  { key: 'can_view_catalog',    label: 'Solicitações',          desc: 'Pedidos recebidos do catálogo público' },
  { key: 'can_view_clients',    label: 'Clientes',              desc: 'Cadastro, histórico 360° e inadimplência' },
  { key: 'can_view_crm',        label: 'Chats / CRM',           desc: 'Atendimento via WhatsApp integrado' },
  { key: 'can_view_inventory',  label: 'Estoque',               desc: 'Controle de insumos e matéria-prima' },
  { key: 'can_view_finance',    label: 'Financeiro',            desc: 'DRE, contas a pagar e receber' },
  { key: 'can_export_reports',  label: '└ Exportar Relatórios', desc: 'Exportar PDFs e planilhas financeiras' },
  { key: 'can_view_store',      label: 'Loja / Vitrine',        desc: 'Gerenciar loja e pedidos online' },
  { key: 'can_view_settings',   label: 'Ajustes',               desc: 'Configurações da empresa' },
];

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

// ─── Reusable Permission Toggles Panel ───────────────────────────────────────
const PermissionsPanel = ({
  permissions,
  onChange,
  onApplyPreset,
  selectedPlan,
  saasPlans,
  isPlanEditor = false
}: {
  permissions: Permissions;
  onChange: (key: PermissionKey) => void;
  onApplyPreset?: () => void;
  selectedPlan?: string;
  saasPlans?: any[];
  isPlanEditor?: boolean;
}) => (
  <div className="space-y-3">
    {/* Locked items */}
    {!isPlanEditor && (
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-3 space-y-1.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-2">
          Bloqueado para todos os assinantes (exclusivo Admin Master)
        </p>
        {[
          { label: 'Extrator de Pedidos IA', desc: 'Usa chave de API privada' },
          { label: 'Configurações de IA / API', desc: 'Ícone superior do header' },
          { label: 'Gestão SaaS', desc: 'Painel de assinantes' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded border border-rose-500/40 bg-rose-500/10 flex items-center justify-center shrink-0">
              <XCircle className="w-3 h-3 text-rose-500" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              {item.label} <span className="text-slate-600">{item.desc}</span>
            </span>
          </div>
        ))}
      </div>
    )}

    {/* Header with preset button */}
    {!isPlanEditor && onApplyPreset && selectedPlan && saasPlans && saasPlans.length > 0 && (
      <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-2xl">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
          Preset: {selectedPlan}
        </p>
        <div className="flex gap-2">
           <button
             type="button"
             onClick={onApplyPreset}
             className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
           >
             Aplicar Padrão do Plano
           </button>
        </div>
      </div>
    )}

    {/* Toggleable modules */}
    <div className="grid grid-cols-1 gap-1.5">
      {MODULE_LIST.map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`flex items-center gap-3 w-full p-3 rounded-xl border text-left transition-all ${
            permissions[item.key]
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900/50 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
          }`}
        >
          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
            permissions[item.key] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700 bg-slate-950'
          }`}>
            {permissions[item.key] && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-black uppercase tracking-widest block leading-tight">{item.label}</span>
            <span className="text-[9px] text-slate-500 leading-tight">{item.desc}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const MasterAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'novo' | 'planos'>('ativos');
  const [tenants, setTenants] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [saasPlans, setSaasPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'vencidos' | 'bloqueados'>('todos');
  const [runningExpire, setRunningExpire] = useState(false);

  // ── New Tenant Form ──
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newCycle, setNewCycle] = useState('Mensal');
  const [newIsTrial, setNewIsTrial] = useState(false);
  const [newPaymentLink, setNewPaymentLink] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminWhatsapp, setNewAdminWhatsapp] = useState('');
  const [newPermissions, setNewPermissions] = useState<Permissions>({ ...ALL_PERMISSIONS_OFF });
  const [showNewPermissions, setShowNewPermissions] = useState(false);

  // ── Edit Modal ──
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editCycle, setEditCycle] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editPaymentLink, setEditPaymentLink] = useState('');
  const [editAdminWhatsapp, setEditAdminWhatsapp] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editPermissions, setEditPermissions] = useState<Permissions>({ ...ALL_PERMISSIONS_OFF });
  const [loadingEditPerms, setLoadingEditPerms] = useState(false);
  const [showEditPermissions, setShowEditPermissions] = useState(false);

  // ── Password Reset ──
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // ── SaaS Plans Editor ──
  const [editingPlanDb, setEditingPlanDb] = useState<any>(null);
  const [dbPlanName, setDbPlanName] = useState('');
  const [dbPlanPrice, setDbPlanPrice] = useState(0);
  const [dbPlanCycle, setDbPlanCycle] = useState('Mensal');
  const [dbPlanDesc, setDbPlanDesc] = useState('');
  const [dbPlanPermissions, setDbPlanPermissions] = useState<Permissions>({ ...ALL_PERMISSIONS_OFF });

  // ── MP ──
  const [generatingMPLink, setGeneratingMPLink] = useState<string | null>(null);

  // ─── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedTenants, fetchedProfiles, fetchedPlans] = await Promise.all([
        tenantService.getAllTenants(),
        tenantService.getAllProfiles(),
        tenantService.getAllSaasPlans()
      ]);
      setTenants(fetchedTenants || []);
      setProfiles(fetchedProfiles || []);
      setSaasPlans(fetchedPlans || []);
      
      if (fetchedPlans && fetchedPlans.length > 0 && !newPlan) {
        const defaultPlan = fetchedPlans[0];
        setNewPlan(defaultPlan.name);
        setNewPrice(Number(defaultPlan.price));
        setNewCycle(defaultPlan.billing_cycle);
        if (defaultPlan.permissions) {
          setNewPermissions({ ...ALL_PERMISSIONS_OFF, ...defaultPlan.permissions });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [newPlan]);

  useEffect(() => { load(); }, [load]);

  // ─── Toggle helpers ────────────────────────────────────────────────────────
  const toggleNew = (key: PermissionKey) => setNewPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleEdit = (key: PermissionKey) => setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  const togglePlanDb = (key: PermissionKey) => setDbPlanPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  const applyPresetFromDb = (planName: string, target: 'new' | 'edit') => {
    const plan = saasPlans.find(p => p.name === planName);
    if (!plan) return;
    const perms = { ...ALL_PERMISSIONS_OFF, ...(plan.permissions || {}) };
    if (target === 'new') {
        setNewPermissions(perms);
        setNewPrice(Number(plan.price));
        setNewCycle(plan.billing_cycle);
    } else {
        setEditPermissions(perms);
    }
  };

  const handlePlanChangeNew = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pName = e.target.value;
    setNewPlan(pName);
    if (pName !== 'Trial 7 Dias') {
        applyPresetFromDb(pName, 'new');
    }
  };

  const clearEditPermissions = () => setEditPermissions({ ...ALL_PERMISSIONS_OFF });

  // ─── Create Tenant ─────────────────────────────────────────────────────────
  const handleCreateTenant = async () => {
    if (!newName || !newDomain) return alert('Preencha o Nome e o Domínio.');
    if (!newAdminEmail || !newAdminPassword) return alert('Preencha o E-mail e a Senha do Administrador.');
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (newIsTrial ? 7 : 30));

      const tenant = await tenantService.createTenant({
        name: newName,
        domain: newDomain,
        plan: newIsTrial ? 'Trial 7 Dias' : newPlan,
        plan_price: newIsTrial ? 0 : newPrice,
        billing_cycle: newCycle,
        subscription_end_date: endDate.toISOString(),
        payment_link: newPaymentLink || null,
        admin_email: newAdminEmail || null,
        admin_whatsapp: newAdminWhatsapp || null,
        active: true,
      });

      if (tenant?.id) {
        await tenantService.createTenantAdmin(newAdminEmail, newAdminPassword, tenant.id, `Admin ${newName}`);

        // Small delay for DB trigger to create the profile, then save permissions
        await new Promise(r => setTimeout(r, 1500));
        const allProfiles = await tenantService.getAllProfiles();
        const newProfile = allProfiles?.find((p: any) => p.tenant_id === tenant.id);
        if (newProfile?.id) {
          await tenantService.upsertUserPermissions(newProfile.id, tenant.id, newPermissions);
        }
      }

      alert('✅ Inquilino e Administrador Cadastrados com Sucesso!');
      setNewName(''); setNewDomain(''); setNewAdminEmail('');
      setNewAdminPassword(''); setNewAdminWhatsapp(''); setNewPaymentLink('');
      setShowNewPermissions(false);
      setActiveTab('ativos');
      load();
    } catch (e: any) {
      alert('Erro ao criar inquilino: ' + (e?.message || 'Verifique os dados e tente novamente.'));
      console.error(e);
    }
  };

  // ─── Open Edit Modal ───────────────────────────────────────────────────────
  const openEdit = async (t: any) => {
    setEditingTenant(t);
    setEditName(t.name);
    setEditPlan(t.plan);
    setEditPrice(t.plan_price);
    setEditCycle(t.billing_cycle || 'Mensal');
    setEditEndDate(t.subscription_end_date?.split('T')[0] || '');
    setEditPaymentLink(t.payment_link || '');
    setEditAdminWhatsapp(t.admin_whatsapp || '');
    setEditAdminEmail(t.admin_email || '');
    setShowResetPassword(false);
    setResetUserId(null);
    setShowEditPermissions(false);

    setLoadingEditPerms(true);
    try {
      const tenantProfiles = profiles.filter(p => p.tenant_id === t.id);
      if (tenantProfiles.length > 0) {
        const existingPerms = await tenantService.getUserPermissions(tenantProfiles[0].id);
        if (existingPerms) {
          const loaded: Permissions = { ...ALL_PERMISSIONS_OFF };
          (Object.keys(ALL_PERMISSIONS_OFF) as PermissionKey[]).forEach(k => {
            if (existingPerms[k] !== undefined) loaded[k] = existingPerms[k];
          });
          setEditPermissions(loaded);
        } else {
          setEditPermissions({ ...ALL_PERMISSIONS_OFF });
        }
      } else {
        setEditPermissions({ ...ALL_PERMISSIONS_OFF });
      }
    } catch {
      setEditPermissions({ ...ALL_PERMISSIONS_OFF });
    } finally {
      setLoadingEditPerms(false);
    }
  };

  // ─── Save Edit ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editingTenant) return;
    try {
      await tenantService.updateTenant(editingTenant.id, {
        name: editName,
        plan: editPlan,
        plan_price: editPrice,
        billing_cycle: editCycle,
        subscription_end_date: editEndDate ? new Date(editEndDate + 'T23:59:59').toISOString() : undefined,
        payment_link: editPaymentLink || null,
        admin_whatsapp: editAdminWhatsapp || null,
        admin_email: editAdminEmail || null,
      });

      const tenantProfiles = profiles.filter(p => p.tenant_id === editingTenant.id);
      for (const profile of tenantProfiles) {
        await tenantService.upsertUserPermissions(profile.id, editingTenant.id, editPermissions);
      }

      setEditingTenant(null);
      load();
      alert('✅ Dados do Inquilino e Permissões atualizados!');
    } catch (e: any) {
      alert('Erro ao salvar: ' + (e?.message || 'Tente novamente.'));
    }
  };

  // ─── SaaS Plans DB ─────────────────────────────────────────────────────────
  const openPlanDbEdit = (plan: any) => {
      setEditingPlanDb(plan);
      setDbPlanName(plan.name);
      setDbPlanPrice(Number(plan.price));
      setDbPlanCycle(plan.billing_cycle);
      setDbPlanDesc(plan.description);
      setDbPlanPermissions({ ...ALL_PERMISSIONS_OFF, ...(plan.permissions || {}) });
  };

  const openNewPlanDb = () => {
      setEditingPlanDb({ isNew: true });
      setDbPlanName('');
      setDbPlanPrice(0);
      setDbPlanCycle('Mensal');
      setDbPlanDesc('');
      setDbPlanPermissions({ ...ALL_PERMISSIONS_OFF });
  };

  const handleSavePlanDb = async () => {
      if (!editingPlanDb) return;
      try {
          const payload = {
              name: dbPlanName,
              price: dbPlanPrice,
              billing_cycle: dbPlanCycle,
              description: dbPlanDesc,
              permissions: dbPlanPermissions
          };
          
          if (editingPlanDb.isNew) {
              await tenantService.createSaasPlan(payload);
              alert('✅ Novo plano criado com sucesso!');
          } else {
              await tenantService.updateSaasPlan(editingPlanDb.id, payload);
              alert('✅ Plano atualizado com sucesso!');
          }
          setEditingPlanDb(null);
          load();
      } catch (e: any) {
          alert('Erro ao salvar plano: ' + e.message);
      }
  };

  const handleDeletePlanDb = async (id: string, name: string) => {
      if (confirm(`Tem certeza que deseja excluir o plano "${name}"? Essa ação não afeta assinantes atuais, mas remove o preset da lista.`)) {
          try {
              await tenantService.deleteSaasPlan(id);
              alert('✅ Plano excluído!');
              setEditingPlanDb(null);
              load();
          } catch (e: any) {
              alert('Erro ao excluir plano: ' + e.message);
          }
      }
  };


  // ─── Other handlers ────────────────────────────────────────────────────────
  const handleUpdateActive = async (id: string, active: boolean) => {
    await tenantService.updateTenant(id, { active });
    load();
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (confirm(`⚠️ ALERTA DE EXCLUSÃO!\n\nTem certeza que deseja DELETAR PERMANENTEMENTE o assinante "${name}"?\nTodos os dados (pedidos, clientes, produtos) serão perdidos.\n\nEssa ação NÃO PODE SER DESFEITA!`)) {
      try {
        await tenantService.deleteTenant(id);
        alert(`✅ Assinante "${name}" excluído com sucesso!`);
        load();
      } catch (e: any) {
        alert('Erro ao excluir assinante: ' + (e?.message || 'Erro desconhecido. Verifique as restrições do banco.'));
        console.error(e);
      }
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!resetNewPassword || resetNewPassword.length < 6) return alert('A senha deve ter pelo menos 6 caracteres.');
    if (!confirm(`Redefinir a senha de "${userName}"?\n\nNova senha: ${resetNewPassword}`)) return;
    setResettingPassword(true);
    try {
      await tenantService.resetUserPassword(userId, resetNewPassword);
      alert(`✅ Senha de "${userName}" redefinida!\n\nNova senha: ${resetNewPassword}`);
      setResetUserId(null);
      setResetNewPassword('');
    } catch (e: any) {
      alert('Erro: ' + (e?.message || 'Erro desconhecido'));
    } finally {
      setResettingPassword(false);
    }
  };

  const handleGenerateMPLink = async (tenant: any) => {
    if (!tenant.admin_email) return alert('Configure o e-mail do admin antes de gerar o link MP.');
    setGeneratingMPLink(tenant.id);
    try {
      const result = await tenantService.generateMercadoPagoLink(
        tenant.id, tenant.plan, tenant.admin_email, tenant.name
      );
      await navigator.clipboard.writeText(result.checkoutUrl).catch(() => {});
      alert(`✅ Link MP gerado e copiado!\n\n${result.checkoutUrl}\n\nEnvie para o cliente assinar.`);
      load();
    } catch (e: any) {
      alert('Erro ao gerar link MP: ' + (e?.message || 'Verifique os secrets no Supabase.'));
    } finally {
      setGeneratingMPLink(null);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => alert('Link copiado!')).catch(() => {});
  };

  const handleRunExpireCheck = async () => {
    if (!confirm('Executar verificação manual de vencimentos? Tenants vencidos serão bloqueados.')) return;
    setRunningExpire(true);
    try {
      const result = await tenantService.runAutoExpireCheck();
      alert(`Concluído!\n• ${result.expired} bloqueado(s)\n• ${result.notified} notificação(ões)`);
      load();
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setRunningExpire(false);
    }
  };

  // ─── Computed ──────────────────────────────────────────────────────────────
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 p-6 max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500" /> Gestão SaaS
          </h2>
          <p className="text-slate-500 font-medium mt-2">Controle de Assinaturas, Módulos e Mercado Pago.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleRunExpireCheck}
            disabled={runningExpire}
            className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {runningExpire ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Verificar Vencimentos
          </button>
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
            {(['ativos', 'novo', 'planos'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                {tab === 'ativos' && <Activity className="w-4 h-4" />}
                {tab === 'novo' && <Plus className="w-4 h-4" />}
                {tab === 'planos' && <LayoutList className="w-4 h-4" />}
                {tab === 'ativos' ? 'Assinantes' : tab === 'novo' ? 'Cadastrar' : 'Planos SaaS'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 font-bold p-10 text-center animate-pulse">Carregando dados globais...</div>
      ) : (
        <>
          {/* ═══════════════ ABA: ASSINANTES ═══════════════ */}
          {activeTab === 'ativos' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Empresas',       value: tenants.length,    cls: 'text-slate-100' },
                  { label: 'Ativas',         value: tenants.filter(t => t.active && calcDaysRemaining(t.subscription_end_date) > 0).length, cls: 'text-emerald-400' },
                  { label: 'MP Autorizado',  value: mpActive,          cls: 'text-indigo-400' },
                  { label: 'Inadimplência',  value: `R$ ${overdueMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, cls: 'text-rose-300' },
                  { label: 'MRR',            value: `R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, cls: 'text-indigo-300' },
                ].map((k, i) => (
                  <div key={i} className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{k.label}</p>
                    <p className={`text-2xl font-black ${k.cls}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-fit">
                {(['todos', 'ativos', 'vencidos', 'bloqueados'] as const).map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
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
                    <div key={t.id} className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 shadow-lg flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 hover:border-slate-700 transition-colors">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">{t.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${t.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {t.active ? 'Ativo' : 'Bloqueado'}
                          </span>
                          <MPStatusBadge status={mpStatus} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                            <CreditCard className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-black uppercase text-slate-300">{t.plan} · R$ {Number(t.plan_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-slate-500 bg-slate-950 px-1 rounded">{t.billing_cycle || 'Mensal'}</span>
                          </div>
                          <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl ${daysColor(days)}`}>
                            <Calendar className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">{days <= 0 ? 'Vencida' : `${days}d restantes`}</span>
                          </div>
                          {t.admin_whatsapp && <span className="flex items-center gap-1 text-[9px] text-slate-500"><PhoneCall className="w-3 h-3" />{t.admin_whatsapp}</span>}
                          {t.admin_email && <span className="flex items-center gap-1 text-[9px] text-slate-500"><Mail className="w-3 h-3" />{t.admin_email}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 w-full xl:w-48 hidden md:block">
                          <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">
                            <Users className="w-3 h-3 inline mr-1" />Acessos ({tenantProfiles.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {tenantProfiles.slice(0, 3).map(p => (
                              <span key={p.id} className="text-slate-400 bg-slate-900 px-2 py-1 rounded-md font-black text-[9px] uppercase border border-slate-800 truncate max-w-[80px]">{p.full_name?.split(' ')[0] || 'User'}</span>
                            ))}
                            {tenantProfiles.length > 3 && <span className="text-slate-500 text-[10px] font-bold">+{tenantProfiles.length - 3}</span>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full xl:w-44 shrink-0">
                          <button onClick={() => openEdit(t)} className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">
                            Editar / Módulos
                          </button>
                          {mpStatus === 'authorized' ? (
                            <div className="w-full px-4 py-2.5 bg-emerald-900/20 border border-emerald-500/30 text-emerald-500 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 cursor-default">
                              <CheckCheck className="w-3 h-3" /> MP Autorizado
                            </div>
                          ) : (
                            <button onClick={() => handleGenerateMPLink(t)} disabled={generatingMPLink === t.id}
                              className="w-full px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                              {generatingMPLink === t.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              Gerar Link MP
                            </button>
                          )}
                          {t.payment_link && (
                            <button onClick={() => handleCopyLink(t.payment_link)}
                              className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all">
                              <Copy className="w-3 h-3" /> Copiar Link
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateActive(t.id, !t.active)}
                              className={`flex-1 px-4 py-2.5 border rounded-xl font-black uppercase text-[10px] transition-all ${t.active ? 'border-rose-500/50 text-rose-500 hover:bg-rose-500/10' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20'}`}>
                              {t.active ? 'Suspender' : 'Reativar'}
                            </button>
                            <button onClick={() => handleDeleteTenant(t.id, t.name)}
                              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl font-black uppercase transition-all" title="Excluir Permanentemente">
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
          )}

          {/* ═══════════════ ABA: NOVO ASSINANTE ═══════════════ */}
          {activeTab === 'novo' && (
            <div className="animate-in fade-in duration-300 max-w-2xl mx-auto space-y-5 bg-[#0f172a] p-8 md:p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
              <div>
                <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-3">
                  <Plus className="w-6 h-6 text-indigo-500" /> Adicionar Estamparia
                </h3>
                <p className="text-slate-500 text-sm mt-1">Ambiente isolado criado na hora.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Nome da Empresa</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Alfa Estamparia LTDA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Domínio / Identificador</label>
                  <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="Ex: alfa-estamparia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Plano Base</label>
                    <select value={newPlan} onChange={handlePlanChangeNew}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                      {saasPlans.map(plan => (
                          <option key={plan.id} value={plan.name}>{plan.name}</option>
                      ))}
                      <option value="Trial 7 Dias">Trial 7 Dias</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Ciclo</label>
                    <select value={newCycle} onChange={e => setNewCycle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                      <option value="Mensal">Mensal</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Valor (R$)</label>
                  <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>

                <div className="border-t border-slate-800/50 pt-4 space-y-3">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3" /> Contato do Admin</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">E-mail *</label>
                      <input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="admin@empresa.com.br"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">WhatsApp</label>
                      <input value={newAdminWhatsapp} onChange={e => setNewAdminWhatsapp(e.target.value)} placeholder="11999999999"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Senha de Acesso *</label>
                    <input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                  <input type="checkbox" id="trial" checked={newIsTrial} onChange={e => setNewIsTrial(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
                  <label htmlFor="trial" className="text-xs font-black text-indigo-400 uppercase tracking-widest cursor-pointer">Ativar Teste Grátis de 7 Dias</label>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowNewPermissions(!showNewPermissions)}
                    className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutList className="w-4 h-4 text-rose-400" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">Personalizar Módulos do Assinante</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        ({Object.values(newPermissions).filter(Boolean).length}/{MODULE_LIST.length} ativos)
                      </span>
                    </div>
                    {showNewPermissions ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  {showNewPermissions && (
                    <div className="p-4 border-t border-slate-800">
                      <PermissionsPanel
                        permissions={newPermissions}
                        onChange={toggleNew}
                        onApplyPreset={() => applyPresetFromDb(newPlan, 'new')}
                        selectedPlan={newPlan}
                        saasPlans={saasPlans}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/50">
                <button onClick={handleCreateTenant}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3">
                  <Save className="w-5 h-5" /> {newIsTrial ? 'Criar Ambiente de Teste' : 'Criar Ambiente Agora'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ ABA: PLANOS ═══════════════ */}
          {activeTab === 'planos' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="flex items-center justify-between">
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 flex-1 mr-4">
                  <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Editor Central de Planos</p>
                    <p className="text-xs text-slate-400 mt-1">Configure o valor padrão e os módulos embarcados de cada plano. Isso facilitará a criação de novos usuários.</p>
                  </div>
                </div>
                
                <button onClick={openNewPlanDb} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 shrink-0">
                  <Plus className="w-4 h-4" /> Novo Plano
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {saasPlans.map(p => (
                  <div key={p.id} className={`bg-[#0f172a] p-8 rounded-[3rem] border ${p.is_popular ? 'border-indigo-500' : 'border-slate-800'} shadow-xl relative`}>
                    {p.is_popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Mais Vendido</div>}
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black text-slate-100 uppercase">{p.name}</h3>
                        <button onClick={() => openPlanDbEdit(p)} className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all" title="Editar Preset">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-4xl font-black text-emerald-400 my-4">R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-sm text-slate-500">/{p.billing_cycle === 'Mensal' ? 'mês' : p.billing_cycle === 'Semestral' ? 'semestre' : 'ano'}</span></p>
                    <p className="text-sm font-medium text-slate-400">{p.description}</p>
                    <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-between">
                          Módulos Ativos <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{Object.values(p.permissions || {}).filter(Boolean).length}</span>
                      </p>
                      <div className="flex flex-wrap gap-1">
                          {Object.entries(p.permissions || {}).filter(([_, v]) => v).map(([k]) => {
                              const mod = MODULE_LIST.find(m => m.key === k);
                              if (!mod) return null;
                              return <span key={k} className="text-[8px] uppercase tracking-widest text-slate-500 bg-slate-950 border border-slate-800 px-2 py-1 rounded-md">{mod.label.replace('└ ', '')}</span>;
                          })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════ MODAL: EDIÇÃO TENANT ═══════════════ */}
          {editingTenant && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto">
              <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-2xl p-8 border border-slate-800 shadow-2xl animate-in zoom-in-95 my-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Editar: {editingTenant.name}</h3>
                  <button onClick={() => setEditingTenant(null)} className="text-slate-500 hover:text-white"><XCircle /></button>
                </div>

                <div className="space-y-4">
                  {/* Basic fields */}
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome da Empresa</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plano</label>
                      <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none">
                        {saasPlans.map(plan => (
                            <option key={plan.id} value={plan.name}>{plan.name}</option>
                        ))}
                        <option value="Trial 7 Dias">Trial 7 Dias</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ciclo</label>
                      <select value={editCycle} onChange={e => setEditCycle(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none">
                        <option value="Mensal">Mensal</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor (R$)</label>
                      <input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expiração</label>
                      <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Link de Pagamento</label>
                    <input value={editPaymentLink} onChange={e => setEditPaymentLink(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                    <div>
                      <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><PhoneCall className="w-3 h-3" /> WhatsApp Admin</label>
                      <input value={editAdminWhatsapp} onChange={e => setEditAdminWhatsapp(e.target.value)} placeholder="11999999999"
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail Admin (MP)</label>
                      <input value={editAdminEmail} onChange={e => setEditAdminEmail(e.target.value)} placeholder="admin@empresa.com"
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                  </div>

                  {/* ── Permissions in Edit ── */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowEditPermissions(!showEditPermissions)}
                      className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <LayoutList className="w-4 h-4 text-rose-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">Módulos Liberados</span>
                        {loadingEditPerms ? (
                          <span className="text-[9px] text-slate-500 animate-pulse">Carregando...</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">
                            ({Object.values(editPermissions).filter(Boolean).length}/{MODULE_LIST.length} ativos)
                          </span>
                        )}
                      </div>
                      {showEditPermissions ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {showEditPermissions && !loadingEditPerms && (
                      <div className="p-4 border-t border-slate-800">
                        <PermissionsPanel
                          permissions={editPermissions}
                          onChange={toggleEdit}
                          onApplyPreset={() => applyPresetFromDb(editPlan, 'edit')}
                          selectedPlan={editPlan}
                          saasPlans={saasPlans}
                        />
                      </div>
                    )}
                  </div>

                  {/* Password Reset */}
                  <div className="pt-2 border-t border-slate-800/50">
                    <button onClick={() => setShowResetPassword(!showResetPassword)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors">
                      <KeyRound className="w-4 h-4" />
                      {showResetPassword ? 'Ocultar Senhas' : 'Gerenciar Senhas de Acesso'}
                    </button>

                    {showResetPassword && (
                      <div className="mt-4 space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                        <p className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest">Usuários deste Inquilino</p>
                        {profiles.filter(p => p.tenant_id === editingTenant.id).length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhum usuário encontrado.</p>
                        ) : profiles.filter(p => p.tenant_id === editingTenant.id).map(p => (
                          <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div>
                              <p className="text-sm font-black text-slate-200">{p.full_name || 'Sem Nome'}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{p.role} · {p.id.substring(0, 8)}...</p>
                            </div>
                            {resetUserId === p.id ? (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input type="text" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)}
                                  placeholder="Nova senha (min 6)"
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-40" />
                                <button onClick={() => handleResetPassword(p.id, p.full_name)} disabled={resettingPassword}
                                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase whitespace-nowrap disabled:opacity-50">
                                  {resettingPassword ? '...' : 'Salvar'}
                                </button>
                                <button onClick={() => { setResetUserId(null); setResetNewPassword(''); }} className="text-slate-500 hover:text-white">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => { setResetUserId(p.id); setResetNewPassword(''); }}
                                className="px-3 py-2 bg-slate-900 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                                <KeyRound className="w-3 h-3" /> Redefinir Senha
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => setEditingTenant(null)} className="flex-1 py-3 bg-slate-900 text-slate-400 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
                  <button onClick={handleSaveEdit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20">Salvar Alterações</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ MODAL: EDIÇÃO SaaS PLAN ═══════════════ */}
          {editingPlanDb && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-start justify-center p-4 overflow-y-auto">
              <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-xl p-8 border border-slate-800 shadow-2xl animate-in zoom-in-95 my-6">
                 <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2"><Edit3 className="w-5 h-5 text-indigo-400"/> Editar Preset: {editingPlanDb.name}</h3>
                  <button onClick={() => setEditingPlanDb(null)} className="text-slate-500 hover:text-white"><XCircle /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome do Plano</label>
                    <input value={dbPlanName} onChange={e => setDbPlanName(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor Padrão (R$)</label>
                        <input type="number" value={dbPlanPrice} onChange={e => setDbPlanPrice(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                     <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ciclo Padrão</label>
                      <select value={dbPlanCycle} onChange={e => setDbPlanCycle(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none">
                        <option value="Mensal">Mensal</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
                    <input value={dbPlanDesc} onChange={e => setDbPlanDesc(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>

                  <div className="pt-4 border-t border-slate-800/50 mt-4">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Módulos Ativados Neste Plano</p>
                      <PermissionsPanel
                          permissions={dbPlanPermissions}
                          onChange={togglePlanDb}
                          isPlanEditor={true}
                      />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => setEditingPlanDb(null)} className="flex-1 py-3 bg-slate-900 text-slate-400 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
                  {!editingPlanDb.isNew && (
                      <button onClick={() => handleDeletePlanDb(editingPlanDb.id, editingPlanDb.name)} className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl font-black uppercase text-[10px] transition-all">
                          Excluir
                      </button>
                  )}
                  <button onClick={handleSavePlanDb} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20">Salvar Plano</button>
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
