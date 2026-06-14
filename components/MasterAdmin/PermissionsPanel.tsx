import React from 'react';
import { PermissionKey, Permissions, MODULE_LIST, ALL_PERMISSIONS_OFF } from './types';
import { XCircle } from 'lucide-react';

interface PermissionsPanelProps {
  permissions: Permissions;
  onChange: (key: PermissionKey) => void;
  onApplyPreset?: () => void;
  selectedPlan?: string;
  saasPlans?: any[];
  isPlanEditor?: boolean;
}

export const PermissionsPanel: React.FC<PermissionsPanelProps> = ({
  permissions,
  onChange,
  onApplyPreset,
  selectedPlan,
  saasPlans,
  isPlanEditor = false
}) => {
  const currentPermissions = permissions || ALL_PERMISSIONS_OFF;

  return (
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
        <div className="flex items-center justify-between bg-white/5 border border-[#1e293b] p-3 rounded-2xl">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">
            Preset: {selectedPlan}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApplyPreset}
              className="text-[9px] font-black uppercase tracking-widest text-white hover:text-white/80 bg-white/10 border border-[#1e293b] px-3 py-1.5 rounded-lg transition-all"
            >
              Aplicar Padrão do Plano
            </button>
          </div>
        </div>
      )}

      {/* Toggleable modules */}
      <div className="grid grid-cols-1 gap-1.5">
        {MODULE_LIST.map(item => {
          const isChecked = !!currentPermissions[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex items-center gap-3 w-full p-3 rounded-xl border text-left transition-all ${
                isChecked
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#0f172a] border-[#1e293b] text-slate-600 hover:border-slate-700 hover:text-slate-400'
              }`}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700 bg-[#1C1C26]'
              }`}>
                {isChecked && (
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
          );
        })}
      </div>
    </div>
  );
};
