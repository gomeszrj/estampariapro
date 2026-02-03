
import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Trello,
  Users,
  Settings,
  TrendingUp,
  Box,
  MessageSquare,
  Inbox,
  Bot
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

import { settingsService } from '../services/settingsService';

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const [cloudBotEnabled, setCloudBotEnabled] = React.useState(false);

  const loadSettings = () => {
    settingsService.getSettings().then(s => setCloudBotEnabled(!!s.cloudbot_enabled));
  };

  React.useEffect(() => {
    loadSettings();
    window.addEventListener('settingsUpdated', loadSettings);
    return () => window.removeEventListener('settingsUpdated', loadSettings);
  }, []);
  const menuItems = [
    { id: 'dashboard', label: 'Agenda', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'kanban', label: 'Fluxo', icon: Trello },
    { id: 'catalog', label: 'Catálogo', icon: Box },
    { id: 'catalog-requests', label: 'Solicitações', icon: Inbox },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'inventory', label: 'Estoque', icon: Box },
    ...(cloudBotEnabled ? [{ id: 'cloudbot', label: 'CloudBot Agent', icon: Bot }] : []),
    { id: 'finance', label: 'Financeiro', icon: TrendingUp },
  ];

  return (
    <aside className="w-72 bg-[#0f172a] border-r border-slate-800/50 h-screen sticky top-0 flex flex-col">
      <div className="p-8 border-b border-slate-800/50">
        <h1 className="text-xl font-black text-indigo-400 flex items-center gap-3 tracking-tighter uppercase">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span>Estamparia<span className="text-white">.AI</span></span>
        </h1>
      </div>
      <nav className="flex-1 p-6 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${activeView === item.id
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1'
              : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${activeView === item.id ? 'text-white' : 'text-slate-600'}`} />
            <span className="font-black uppercase text-[11px] tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800/50">
        <button
          onClick={() => setActiveView('settings')}
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${activeView === 'settings'
            ? 'bg-slate-800 text-white'
            : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-black uppercase text-[11px] tracking-widest">Ajustes</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
