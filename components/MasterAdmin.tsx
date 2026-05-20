import React, { useState, useEffect, useCallback } from 'react';
import { tenantService } from '../services/tenantService';
import { ShieldAlert, Activity, Plus, LayoutList, RefreshCw, Zap } from 'lucide-react';
import { notify } from './ui/toast';
import { ConfirmModal } from './ui/ConfirmModal';

import { SaaSOverview } from './MasterAdmin/SaaSOverview';
import { SaaSCreateForm } from './MasterAdmin/SaaSCreateForm';
import { SaaSPlansList } from './MasterAdmin/SaaSPlansList';
import { SaaSEditModal } from './MasterAdmin/SaaSEditModal';
import { SaaSPlanModal } from './MasterAdmin/SaaSPlanModal';
import { Permissions } from './MasterAdmin/types';

const MasterAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'novo' | 'planos'>('ativos');
  const [tenants, setTenants] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [saasPlans, setSaasPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'vencidos' | 'bloqueados'>('todos');
  const [runningExpire, setRunningExpire] = useState(false);

  // Modals editing state
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editingPlanDb, setEditingPlanDb] = useState<any>(null);
  const [generatingMPLink, setGeneratingMPLink] = useState<string | null>(null);

  // Dynamic Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning',
  });

  const requestConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'warning'
  ) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      variant,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedTenants, fetchedProfiles, fetchedPlans] = await Promise.all([
        tenantService.getAllTenants(),
        tenantService.getAllProfiles(),
        tenantService.getAllSaasPlans(),
      ]);
      setTenants(fetchedTenants || []);
      setProfiles(fetchedProfiles || []);
      setSaasPlans(fetchedPlans || []);
    } catch (e) {
      console.error('Error loading MasterAdmin data:', e);
      notify.error('Erro ao carregar dados do Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Save Tenant changes and custom modules permissions
  const handleSaveEdit = async (updatedFields: any, permissions: Permissions) => {
    if (!editingTenant) return;
    try {
      await tenantService.updateTenant(editingTenant.id, updatedFields);

      const tenantProfiles = profiles.filter(p => p.tenant_id === editingTenant.id);
      for (const profile of tenantProfiles) {
        await tenantService.upsertUserPermissions(profile.id, editingTenant.id, permissions);
      }

      setEditingTenant(null);
      await load();
      notify.success('Dados do Inquilino e Permissões atualizados!');
    } catch (e: any) {
      notify.error('Erro ao salvar: ' + (e?.message || 'Tente novamente.'));
    }
  };

  // Create or Update SaaS Plan DB preset
  const handleSavePlanDb = async (planData: any) => {
    if (!editingPlanDb) return;
    try {
      if (editingPlanDb.isNew) {
        await tenantService.createSaasPlan(planData);
        notify.success('Novo plano criado com sucesso!');
      } else {
        await tenantService.updateSaasPlan(editingPlanDb.id, planData);
        notify.success('Plano atualizado com sucesso!');
      }
      setEditingPlanDb(null);
      await load();
    } catch (e: any) {
      notify.error('Erro ao salvar plano: ' + e.message);
    }
  };

  const handleDeletePlanDb = async (id: string, name: string) => {
    requestConfirm(
      'Excluir Plano SaaS',
      `Tem certeza que deseja excluir o plano "${name}"? Essa ação não afeta assinantes atuais, mas remove o preset da lista.`,
      async () => {
        try {
          await tenantService.deleteSaasPlan(id);
          notify.success('Plano excluído!');
          setEditingPlanDb(null);
          await load();
        } catch (e: any) {
          notify.error('Erro ao excluir plano: ' + e.message);
        }
      },
      'danger'
    );
  };

  const handleUpdateActive = async (id: string, active: boolean) => {
    try {
      await tenantService.updateTenant(id, { active });
      await load();
      notify.success(active ? 'Assinatura reativada!' : 'Assinatura suspensa!');
    } catch (e: any) {
      notify.error('Erro ao alterar status: ' + e.message);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    requestConfirm(
      'ALERTA DE EXCLUSÃO PERMANENTE!',
      `Tem certeza que deseja DELETAR PERMANENTEMENTE o assinante "${name}"? Todos os dados (pedidos, clientes, produtos) serão perdidos. Essa ação NÃO PODE SER DESFEITA!`,
      async () => {
        try {
          await tenantService.deleteTenant(id);
          notify.success(`Assinante "${name}" excluído com sucesso!`);
          await load();
        } catch (e: any) {
          notify.error('Erro ao excluir assinante: ' + (e?.message || 'Erro desconhecido.'));
          console.error(e);
        }
      },
      'danger'
    );
  };

  const handleResetPassword = async (userId: string, newPassword: string, userName: string) => {
    requestConfirm(
      'Redefinir Senha',
      `Redefinir a senha de "${userName}"? Nova senha: ${newPassword}`,
      async () => {
        try {
          await tenantService.resetUserPassword(userId, newPassword);
          notify.success(`Senha de "${userName}" redefinida com sucesso!`);
        } catch (e: any) {
          notify.error('Erro: ' + (e?.message || 'Erro desconhecido'));
        }
      },
      'warning'
    );
  };

  const handleGenerateMPLink = async (tenant: any) => {
    if (!tenant.admin_email) return notify.warning('Configure o e-mail do admin antes de gerar o link MP.');
    setGeneratingMPLink(tenant.id);
    try {
      const result = await tenantService.generateMercadoPagoLink(
        tenant.id,
        tenant.plan,
        tenant.admin_email,
        tenant.name
      );
      await navigator.clipboard.writeText(result.checkoutUrl).catch(() => {});
      notify.success('Link Mercado Pago gerado e copiado para a área de transferência!');
      await load();
    } catch (e: any) {
      notify.error('Erro ao gerar link MP: ' + (e?.message || 'Verifique os secrets no Supabase.'));
    } finally {
      setGeneratingMPLink(null);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard
      .writeText(link)
      .then(() => notify.success('Link copiado!'))
      .catch(() => {});
  };

  const handleRunExpireCheck = async () => {
    requestConfirm(
      'Verificar Vencimentos',
      'Executar verificação manual de vencimentos? Tenants vencidos serão bloqueados.',
      async () => {
        setRunningExpire(true);
        try {
          const result = await tenantService.runAutoExpireCheck();
          notify.success(`Concluído! • ${result.expired} bloqueado(s) • ${result.notified} notificação(ões)`);
          await load();
        } catch (e: any) {
          notify.error('Erro: ' + e.message);
        } finally {
          setRunningExpire(false);
        }
      },
      'warning'
    );
  };

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
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
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
          {activeTab === 'ativos' && (
            <SaaSOverview
              tenants={tenants}
              profiles={profiles}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onEditTenant={setEditingTenant}
              onGenerateMPLink={handleGenerateMPLink}
              onUpdateActive={handleUpdateActive}
              onDeleteTenant={handleDeleteTenant}
              generatingMPLink={generatingMPLink}
              handleCopyLink={handleCopyLink}
            />
          )}

          {activeTab === 'novo' && (
            <SaaSCreateForm
              saasPlans={saasPlans}
              onTenantCreated={() => {
                setActiveTab('ativos');
                load();
              }}
            />
          )}

          {activeTab === 'planos' && (
            <SaaSPlansList
              saasPlans={saasPlans}
              onEditPlan={setEditingPlanDb}
              onCreatePlan={() => setEditingPlanDb({ isNew: true })}
            />
          )}

          {editingTenant && (
            <SaaSEditModal
              tenant={editingTenant}
              profiles={profiles}
              saasPlans={saasPlans}
              onClose={() => setEditingTenant(null)}
              onSave={handleSaveEdit}
              onResetPassword={handleResetPassword}
            />
          )}

          {editingPlanDb && (
            <SaaSPlanModal
              plan={editingPlanDb}
              onClose={() => setEditingPlanDb(null)}
              onSave={handleSavePlanDb}
              onDelete={handleDeletePlanDb}
            />
          )}

          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            variant={confirmConfig.variant}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          />
        </>
      )}
    </div>
  );
};

export default MasterAdmin;
