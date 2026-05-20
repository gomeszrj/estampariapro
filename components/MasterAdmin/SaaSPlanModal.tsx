import React, { useState } from 'react';
import { XCircle, Edit3, Plus } from 'lucide-react';
import { PermissionsPanel } from './PermissionsPanel';
import { Permissions, ALL_PERMISSIONS_OFF, PermissionKey } from './types';
import { notify } from '../ui/toast';

interface SaaSPlanModalProps {
  plan: any; // Se plan.isNew for true, é criação
  onClose: () => void;
  onSave: (planData: any) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
}

export const SaaSPlanModal: React.FC<SaaSPlanModalProps> = ({
  plan,
  onClose,
  onSave,
  onDelete,
}) => {
  const isNew = !!plan.isNew;
  const [dbPlanName, setDbPlanName] = useState(isNew ? '' : plan.name || '');
  const [dbPlanPrice, setDbPlanPrice] = useState(isNew ? 0 : Number(plan.price) || 0);
  const [dbPlanCycle, setDbPlanCycle] = useState(isNew ? 'Mensal' : plan.billing_cycle || 'Mensal');
  const [dbPlanDesc, setDbPlanDesc] = useState(isNew ? '' : plan.description || '');
  const [dbPlanPermissions, setDbPlanPermissions] = useState<Permissions>(
    isNew ? { ...ALL_PERMISSIONS_OFF } : { ...ALL_PERMISSIONS_OFF, ...(plan.permissions || {}) }
  );
  const [isSaving, setIsSaving] = useState(false);

  const togglePlanDb = (key: PermissionKey) => setDbPlanPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!dbPlanName) return notify.warning('Preencha o Nome do Plano.');
    setIsSaving(true);
    try {
      const payload = {
        name: dbPlanName,
        price: dbPlanPrice,
        billing_cycle: dbPlanCycle,
        description: dbPlanDesc,
        permissions: dbPlanPermissions,
      };
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-xl p-8 border border-slate-800 shadow-2xl animate-in zoom-in-95 my-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
            {isNew ? (
              <>
                <Plus className="w-5 h-5 text-indigo-400" /> Criar Plano SaaS
              </>
            ) : (
              <>
                <Edit3 className="w-5 h-5 text-indigo-400" /> Editar Preset: {plan.name}
              </>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome do Plano</label>
            <input
              value={dbPlanName}
              onChange={e => setDbPlanName(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor Padrão (R$)</label>
              <input
                type="number"
                value={dbPlanPrice}
                onChange={e => setDbPlanPrice(Number(e.target.value))}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ciclo Padrão</label>
              <select
                value={dbPlanCycle}
                onChange={e => setDbPlanCycle(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none"
              >
                <option value="Mensal">Mensal</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
            <input
              value={dbPlanDesc}
              onChange={e => setDbPlanDesc(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
            />
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
          <button onClick={onClose} className="flex-1 py-3 bg-slate-900 text-slate-400 rounded-xl font-black uppercase text-[10px]">
            Cancelar
          </button>
          {!isNew && (
            <button
              onClick={() => onDelete(plan.id, plan.name)}
              className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl font-black uppercase text-[10px] transition-all"
            >
              Excluir
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Plano'}
          </button>
        </div>
      </div>
    </div>
  );
};
