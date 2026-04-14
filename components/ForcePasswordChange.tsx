
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { KeyRound, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface ForcePasswordChangeProps {
  onComplete: () => void;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (newPassword.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");
    if (newPassword !== confirmPassword) return alert("As senhas não conferem.");

    setLoading(true);
    try {
      // 1. Update Auth Password
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authError) throw authError;

      // 2. Mark profile as change completed
      const { data: { user } } = await supabase.auth.getUser();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ require_password_change: false })
        .eq('id', user?.id);
      
      if (profileError) throw profileError;

      alert("Senha atualizada com sucesso! Bem-vindo ao sistema.");
      onComplete();
    } catch (e: any) {
      alert("Erro ao atualizar senha: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] z-[10000] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f172a] rounded-[3rem] border border-slate-800 p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
        
        <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 mx-auto mb-4">
                <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Segurança Exigida</h2>
            <p className="text-slate-400 text-sm font-medium">Este é seu primeiro acesso. Para proteger sua conta, você deve definir uma senha definitiva.</p>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Nova Senha</label>
                <div className="relative">
                    <input 
                        type={showPass ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Confirmar Senha</label>
                <input 
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <CheckCircle2 size={12} className={newPassword.length >= 6 ? 'text-emerald-500' : 'text-slate-700'} />
                    Mínimo 6 caracteres
                </li>
            </ul>

            <button 
                onClick={handleUpdate}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
            >
                {loading ? 'Atualizando...' : 'Definir Senha e Entrar'}
            </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-emerald-500/50">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sua conta será ativada instantaneamente</span>
        </div>
      </div>
    </div>
  );
};
