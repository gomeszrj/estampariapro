import React, { useState, useEffect } from 'react';
import { Plus, Zap, LayoutList, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { tenantService } from '../../services/tenantService';
import { PermissionsPanel } from './PermissionsPanel';
import { Permissions, ALL_PERMISSIONS_OFF, PermissionKey, MODULE_LIST } from './types';
import { notify } from '../ui/toast';

interface SaaSCreateFormProps {
  saasPlans: any[];
  onTenantCreated: () => void;
}

export const SaaSCreateForm: React.FC<SaaSCreateFormProps> = ({
  saasPlans,
  onTenantCreated,
}) => {
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newCycle, setNewCycle] = useState('Mensal');
  const [newIsTrial, setNewIsTrial] = useState(false);
  const [newTrialDays, setNewTrialDays] = useState(7);
  const [newPaymentLink, setNewPaymentLink] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminWhatsapp, setNewAdminWhatsapp] = useState('');
  const [newPermissions, setNewPermissions] = useState<Permissions>({ ...ALL_PERMISSIONS_OFF });
  const [showNewPermissions, setShowNewPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (saasPlans && saasPlans.length > 0 && !newPlan) {
      const defaultPlan = saasPlans[0];
      setNewPlan(defaultPlan.name);
      setNewPrice(Number(defaultPlan.price));
      setNewCycle(defaultPlan.billing_cycle);
      if (defaultPlan.permissions) {
        setNewPermissions({ ...ALL_PERMISSIONS_OFF, ...defaultPlan.permissions });
      }
    }
  }, [saasPlans, newPlan]);

  const toggleNew = (key: PermissionKey) => setNewPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  const applyPresetFromDb = (planName: string) => {
    const plan = saasPlans.find(p => p.name === planName);
    if (!plan) return;
    const perms = { ...ALL_PERMISSIONS_OFF, ...(plan.permissions || {}) };
    setNewPermissions(perms);
    setNewPrice(Number(plan.price));
    setNewCycle(plan.billing_cycle);
  };

  const handlePlanChangeNew = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pName = e.target.value;
    setNewPlan(pName);
    if (pName !== 'Trial 7 Dias') {
      applyPresetFromDb(pName);
    }
  };

  const handleCreateTenant = async () => {
    if (!newName || !newDomain) return notify.warning('Preencha o Nome e o Domínio.');
    if (!newAdminEmail || !newAdminPassword) return notify.warning('Preencha o E-mail e a Senha do Administrador.');
    if (newAdminPassword.length < 6) return notify.warning('A senha do administrador deve ter pelo menos 6 caracteres.');
    
    setIsSaving(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (newIsTrial ? newTrialDays : 30));

      const tenant = await tenantService.createTenant({
        name: newName,
        domain: newDomain,
        plan: newIsTrial ? `Trial ${newTrialDays} Dias` : newPlan,
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

      notify.success('Inquilino e Administrador Cadastrados com Sucesso!');
      setNewName('');
      setNewDomain('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminWhatsapp('');
      setNewPaymentLink('');
      setShowNewPermissions(false);
      onTenantCreated();
    } catch (e: any) {
      notify.error('Erro ao criar inquilino: ' + (e?.message || 'Verifique os dados e tente novamente.'));
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Ex: Alfa Estamparia LTDA"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Domínio / Identificador</label>
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="Ex: alfa-estamparia"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Plano Base</label>
            <select
              value={newPlan}
              onChange={handlePlanChangeNew}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              {saasPlans.map(plan => (
                <option key={plan.id} value={plan.name}>{plan.name}</option>
              ))}
              <option value="Trial 7 Dias">Trial 7 Dias</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Ciclo</label>
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
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Valor (R$)</label>
          <input
            type="number"
            value={newPrice}
            onChange={e => setNewPrice(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="border-t border-slate-800/50 pt-4 space-y-3">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3" /> Contato do Admin
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">E-mail *</label>
              <input
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                placeholder="admin@empresa.com.br"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">WhatsApp</label>
              <input
                value={newAdminWhatsapp}
                onChange={e => setNewAdminWhatsapp(e.target.value)}
                placeholder="11999999999"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Senha de Acesso *</label>
            <input
              type="password"
              value={newAdminPassword}
              onChange={e => setNewAdminPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="trial"
              checked={newIsTrial}
              onChange={e => setNewIsTrial(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="trial" className="text-xs font-black text-indigo-400 uppercase tracking-widest cursor-pointer">
              Ativar Teste Grátis (Trial)
            </label>
          </div>
          {newIsTrial && (
            <div className="pl-8 flex items-center gap-3 animate-in fade-in duration-300">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração (Dias):</label>
              <input
                type="number"
                min="1"
                max="365"
                value={newTrialDays}
                onChange={e => setNewTrialDays(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-indigo-500/30 text-indigo-400 font-bold text-center rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          )}
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
                onApplyPreset={() => applyPresetFromDb(newPlan)}
                selectedPlan={newPlan}
                saasPlans={saasPlans}
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/50">
        <button
          onClick={handleCreateTenant}
          disabled={isSaving}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? (
            <span>Criando ambiente...</span>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {newIsTrial ? `Criar Teste de ${newTrialDays} Dias` : 'Criar Ambiente Agora'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
