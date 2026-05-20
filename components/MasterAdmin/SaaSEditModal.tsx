import React, { useState, useEffect } from 'react';
import { XCircle, PhoneCall, Mail, LayoutList, ChevronUp, ChevronDown, KeyRound } from 'lucide-react';
import { tenantService } from '../../services/tenantService';
import { PermissionsPanel } from './PermissionsPanel';
import { Permissions, ALL_PERMISSIONS_OFF, PermissionKey, MODULE_LIST } from './types';
import { notify } from '../ui/toast';

interface SaaSEditModalProps {
  tenant: any;
  profiles: any[];
  saasPlans: any[];
  onClose: () => void;
  onSave: (updatedFields: any, permissions: Permissions) => Promise<void>;
  onResetPassword: (userId: string, newPassword: string, userName: string) => Promise<void>;
}

export const SaaSEditModal: React.FC<SaaSEditModalProps> = ({
  tenant,
  profiles,
  saasPlans,
  onClose,
  onSave,
  onResetPassword,
}) => {
  const [editName, setEditName] = useState(tenant.name || '');
  const [editPlan, setEditPlan] = useState(tenant.plan || '');
  const [editPrice, setEditPrice] = useState(tenant.plan_price || 0);
  const [editCycle, setEditCycle] = useState(tenant.billing_cycle || 'Mensal');
  const [editEndDate, setEditEndDate] = useState(tenant.subscription_end_date?.split('T')[0] || '');
  const [editPaymentLink, setEditPaymentLink] = useState(tenant.payment_link || '');
  const [editAdminWhatsapp, setEditAdminWhatsapp] = useState(tenant.admin_whatsapp || '');
  const [editAdminEmail, setEditAdminEmail] = useState(tenant.admin_email || '');
  
  const [editPermissions, setEditPermissions] = useState<Permissions>({ ...ALL_PERMISSIONS_OFF });
  const [loadingEditPerms, setLoadingEditPerms] = useState(false);
  const [showEditPermissions, setShowEditPermissions] = useState(false);

  // Password reset state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoadingEditPerms(true);
      try {
        const tenantProfiles = profiles.filter(p => p.tenant_id === tenant.id);
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
      } catch (err) {
        console.error('Error loading permissions:', err);
        setEditPermissions({ ...ALL_PERMISSIONS_OFF });
      } finally {
        setLoadingEditPerms(false);
      }
    };

    loadPermissions();
  }, [tenant.id, profiles]);

  const toggleEdit = (key: PermissionKey) => setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  const applyPresetFromDb = (planName: string) => {
    const plan = saasPlans.find(p => p.name === planName);
    if (!plan) return;
    const perms = { ...ALL_PERMISSIONS_OFF, ...(plan.permissions || {}) };
    setEditPermissions(perms);
  };

  const handleSave = async () => {
    if (!editName) return notify.warning('Preencha o Nome da Empresa.');
    setIsSaving(true);
    try {
      const updatedFields = {
        name: editName,
        plan: editPlan,
        plan_price: editPrice,
        billing_cycle: editCycle,
        subscription_end_date: editEndDate ? new Date(editEndDate + 'T23:59:59').toISOString() : undefined,
        payment_link: editPaymentLink || null,
        admin_whatsapp: editAdminWhatsapp || null,
        admin_email: editAdminEmail || null,
      };
      await onSave(updatedFields, editPermissions);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPasswordClick = async (userId: string, userName: string) => {
    if (!resetNewPassword || resetNewPassword.length < 6) {
      return notify.warning('A senha deve ter pelo menos 6 caracteres.');
    }
    setResettingPassword(true);
    try {
      await onResetPassword(userId, resetNewPassword, userName);
      setResetUserId(null);
      setResetNewPassword('');
    } finally {
      setResettingPassword(false);
    }
  };

  const tenantProfiles = profiles.filter(p => p.tenant_id === tenant.id);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-2xl p-8 border border-slate-800 shadow-2xl animate-in zoom-in-95 my-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Editar: {tenant.name}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle /></button>
        </div>

        <div className="space-y-4">
          {/* Basic fields */}
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome da Empresa</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plano</label>
              <select
                value={editPlan}
                onChange={e => setEditPlan(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"
              >
                {saasPlans.map(plan => (
                  <option key={plan.id} value={plan.name}>{plan.name}</option>
                ))}
                <option value="Trial 7 Dias">Trial 7 Dias</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ciclo</label>
              <select
                value={editCycle}
                onChange={e => setEditCycle(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"
              >
                <option value="Mensal">Mensal</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor (R$)</label>
              <input
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(Number(e.target.value))}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expiração</label>
              <input
                type="date"
                value={editEndDate}
                onChange={e => setEditEndDate(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Link de Pagamento</label>
            <input
              value={editPaymentLink}
              onChange={e => setEditPaymentLink(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
            <div>
              <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <PhoneCall className="w-3 h-3" /> WhatsApp Admin
              </label>
              <input
                value={editAdminWhatsapp}
                onChange={e => setEditAdminWhatsapp(e.target.value)}
                placeholder="11999999999"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <Mail className="w-3 h-3" /> E-mail Admin (MP)
              </label>
              <input
                value={editAdminEmail}
                onChange={e => setEditAdminEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Permissions Panel */}
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
                  onApplyPreset={() => applyPresetFromDb(editPlan)}
                  selectedPlan={editPlan}
                  saasPlans={saasPlans}
                />
              </div>
            )}
          </div>

          {/* Password Reset */}
          <div className="pt-2 border-t border-slate-800/50">
            <button
              onClick={() => setShowResetPassword(!showResetPassword)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              {showResetPassword ? 'Ocultar Senhas' : 'Gerenciar Senhas de Acesso'}
            </button>

            {showResetPassword && (
              <div className="mt-4 space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                <p className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest">Usuários deste Inquilino</p>
                {tenantProfiles.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum usuário encontrado.</p>
                ) : (
                  tenantProfiles.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-sm font-black text-slate-200">{p.full_name || 'Sem Nome'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{p.role} · {p.id.substring(0, 8)}...</p>
                      </div>
                      {resetUserId === p.id ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            value={resetNewPassword}
                            onChange={e => setResetNewPassword(e.target.value)}
                            placeholder="Nova senha (min 6)"
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-40"
                          />
                          <button
                            onClick={() => handleResetPasswordClick(p.id, p.full_name)}
                            disabled={resettingPassword}
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase whitespace-nowrap disabled:opacity-50"
                          >
                            {resettingPassword ? '...' : 'Salvar'}
                          </button>
                          <button
                            onClick={() => { setResetUserId(null); setResetNewPassword(''); }}
                            className="text-slate-500 hover:text-white"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setResetUserId(p.id); setResetNewPassword(''); }}
                          className="px-3 py-2 bg-slate-900 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all"
                        >
                          <KeyRound className="w-3 h-3" /> Redefinir Senha
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-900 text-slate-400 rounded-xl font-black uppercase text-[10px]">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
