
import React from 'react';
import { Lock, CreditCard, ExternalLink, Mail, LogOut } from 'lucide-react';

interface SubscriptionLockProps {
  tenantName: string;
  paymentLink?: string;
  daysOverdue: number;
  onSignOut: () => void;
}

export const SubscriptionLock: React.FC<SubscriptionLockProps> = ({ tenantName, paymentLink, daysOverdue, onSignOut }) => {
  return (
    <div className="fixed inset-0 bg-[#020617] z-[9999] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f172a] rounded-[3rem] border border-slate-800 p-10 shadow-2xl relative overflow-hidden text-center space-y-8 animate-in zoom-in-95">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>
        
        <div className="flex justify-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20 text-rose-500">
                <Lock className="w-10 h-10" />
            </div>
        </div>

        <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Acesso Bloqueado</h1>
            <p className="text-slate-400 font-medium">
                Olá <span className="text-slate-200 font-bold">{tenantName}</span>, detectamos que o pagamento da sua assinatura está pendente há <span className="text-rose-400 font-black">{daysOverdue} dias</span>.
            </p>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-left space-y-4">
            <div className="flex items-start gap-4">
                <CreditCard className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    As funções administrativas foram suspensas temporariamente. Para reativar seu sistema agora mesmo, realize o pagamento através do link oficial abaixo.
                </p>
            </div>
        </div>

        <div className="flex flex-col gap-3">
            {paymentLink ? (
                <a 
                    href={paymentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                >
                    <ExternalLink className="w-5 h-5" /> Pagar e Ativar Agora
                </a>
            ) : (
                <div className="w-full py-4 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-slate-700">
                    Aguardando Link de Pagamento
                </div>
            )}
            
            <button 
                onClick={onSignOut}
                className="w-full py-4 bg-transparent hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3"
            >
                <LogOut className="w-5 h-5" /> Sair do Sistema
            </button>
        </div>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Dúvidas? Entre em contato com o suporte master@estamparia.ai
        </p>
      </div>
    </div>
  );
};
