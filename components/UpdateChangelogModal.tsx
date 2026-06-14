import React from 'react';
import { X, CheckCircle2, Rocket, Zap, Shield, Database, Layout } from 'lucide-react';
import { SYSTEM_VERSION, LATEST_RELEASE_NOTES } from '../constants';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Simple parser to make the notes beautiful
  const parseNotes = (text: string) => {
    const lines = text.split('\n');
    const sections: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    
    const commitList = () => {
      if (currentList.length > 0) {
        sections.push(<ul className="space-y-3 mb-6">{currentList}</ul>);
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      if (line.trim() === '') return;

      if (line.includes('Novidades da Versão')) {
        commitList();
        sections.push(
          <div key={`header-${index}`} className="mb-8 text-center">
            <div className="inline-flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <Rocket className="w-4 h-4" /> Versão {SYSTEM_VERSION} Lançada
            </div>
            <h2 className="text-2xl font-black text-white">{line.split('—')[1]?.trim() || 'Atualização Importante'}</h2>
            <p className="text-sm text-slate-400 mt-2">{line.split('—')[0]?.trim()}</p>
          </div>
        );
      } else if (line.startsWith('(') || line.match(/^[A-Z\u00C0-\u00DC\u00E0-\u00FC\s]+:/) || line.includes('🚀') || line.includes('👗') || line.includes('🏪') || line.includes('🛠️') || line.includes('🔐') || line.includes('🗄️') || line.includes('👑')) {
        commitList();
        
        let icon = <Zap className="w-5 h-5 text-amber-400" />;
        if (line.includes('🚀')) icon = <Rocket className="w-5 h-5 text-indigo-400" />;
        else if (line.includes('👗') || line.includes('LAYOUT')) icon = <Layout className="w-5 h-5 text-pink-400" />;
        else if (line.includes('🔐') || line.includes('SEGURANÇA')) icon = <Shield className="w-5 h-5 text-emerald-400" />;
        else if (line.includes('🗄️') || line.includes('BANCO DE DADOS')) icon = <Database className="w-5 h-5 text-blue-400" />;

        const cleanTitle = line.replace(/[🚀👗🏪🛠️🔐🗄️👑]/g, '').trim();

        sections.push(
          <h3 key={`title-${index}`} className="text-sm font-black text-slate-200 uppercase tracking-widest mt-8 mb-4 flex items-center gap-3 pb-2 border-b border-slate-800">
            {icon} {cleanTitle}
          </h3>
        );
      } else if (line.trim().startsWith('*')) {
        currentList.push(
          <li key={`item-${index}`} className="flex items-start gap-3 text-sm text-slate-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{line.replace('*', '').trim()}</span>
          </li>
        );
      } else {
        commitList();
        sections.push(<p key={`p-${index}`} className="text-sm text-slate-400 mb-4 leading-relaxed">{line}</p>);
      }
    });

    commitList();
    return sections;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in">
      <div className="bg-[#0b1221] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#05080E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Notas de Atualização</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">O que há de novo no sistema</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            {parseNotes(LATEST_RELEASE_NOTES)}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-[#05080E] text-center">
          <button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest px-8 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-105"
          >
            Entendi, fechar
          </button>
        </div>

      </div>
    </div>
  );
};
