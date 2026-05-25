import React from 'react';
import { Zap, Plus, Edit3 } from 'lucide-react';
import { MODULE_LIST } from './types';

interface SaaSPlansListProps {
  saasPlans: any[];
  onEditPlan: (plan: any) => void;
  onCreatePlan: () => void;
}

export const SaaSPlansList: React.FC<SaaSPlansListProps> = ({
  saasPlans,
  onEditPlan,
  onCreatePlan,
}) => {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 flex-1">
          <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Editor Central de Planos</p>
            <p className="text-xs text-slate-400 mt-1">
              Configure o valor padrão e os módulos embarcados de cada plano. Isso facilitará a criação de novos usuários.
            </p>
          </div>
        </div>
        
        <button
          onClick={onCreatePlan}
          className="px-6 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-white/5 flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {saasPlans.map(p => (
          <div key={p.id} className={`bg-[#0f172a] p-8 rounded-[3rem] border ${p.is_popular ? 'border-white/20' : 'border-[#1e293b]'} shadow-xl relative`}>
            {p.is_popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#8B5CF6] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Mais Vendido
              </div>
            )}
            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-black text-slate-100 uppercase">{p.name}</h3>
              <button
                onClick={() => onEditPlan(p)}
                className="p-2 bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="Editar Preset"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-4xl font-black text-emerald-400 my-4">
              R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-sm text-slate-500">
                /{p.billing_cycle === 'Mensal' ? 'mês' : p.billing_cycle === 'Semestral' ? 'semestre' : 'ano'}
              </span>
            </p>
            <p className="text-sm font-medium text-slate-400">{p.description}</p>
            <div className="mt-4 p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl space-y-2">
              <p className="text-[9px] font-black text-white uppercase tracking-widest flex items-center justify-between">
                Módulos Ativos{' '}
                <span className="bg-white/20 text-white/80 px-2 py-0.5 rounded-full">
                  {Object.values(p.permissions || {}).filter(Boolean).length}
                </span>
              </p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(p.permissions || {})
                  .filter(([_, v]) => v)
                  .map(([k]) => {
                    const mod = MODULE_LIST.find(m => m.key === k);
                    if (!mod) return null;
                    return (
                      <span key={k} className="text-[8px] uppercase tracking-widest text-slate-500 bg-[#1C1C26] border border-[#1e293b] px-2 py-1 rounded-md">
                        {mod.label.replace('└ ', '')}
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
