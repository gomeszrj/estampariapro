
import React from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Trello, Users,
  Settings, TrendingUp, Box, MessageSquare, Inbox, Bot,
  ExternalLink, Share2, Copy, Palette, ShieldAlert
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { tenantService } from '../services/tenantService';
import { supabase } from '../services/supabase';
import { SYSTEM_VERSION } from '../constants';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  isMasterAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, isMasterAdmin }) => {
  const [cloudBotEnabled, setCloudBotEnabled] = React.useState(false);
  const [companyName, setCompanyName]         = React.useState('Minha Estamparia');
  const [companyLogo, setCompanyLogo]         = React.useState('');
  const [permissions, setPermissions]         = React.useState<Record<string, boolean> | null>(null);
  const [permsLoaded, setPermsLoaded]         = React.useState(false);

  // Load settings
  const loadSettings = () => {
    settingsService.getSettings().then(s => {
      setCloudBotEnabled(!!s.cloudbot_enabled);
      if (s.name)     setCompanyName(s.name);
      if (s.logo_url) setCompanyLogo(s.logo_url);
    });
  };

  // Load RBAC permissions from DB
  const loadPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPermsLoaded(true); return; }

      const perms = await tenantService.getMyPermissions();
      setPermissions(perms || null);
    } catch {
      setPermissions(null);
    } finally {
      setPermsLoaded(true);
    }
  };

  React.useEffect(() => {
    loadSettings();
    loadPermissions();
    window.addEventListener('settingsUpdated', loadSettings);
    return () => window.removeEventListener('settingsUpdated', loadSettings);
  }, []);

  // ── Helper: can this user see a module? ──
  // MasterAdmin sees everything. For tenants, check DB permission.
  // If permissions haven't loaded yet, show nothing on tenant side (avoids flash).
  const can = (permKey: string): boolean => {
    if (isMasterAdmin) return true;
    if (!permsLoaded)  return false;
    if (!permissions)  return false;            // No permissions record = no access
    return !!permissions[permKey];
  };

  // ── Build menu items ──────────────────────────────────────────────────────
  const menuItems = [
    can('can_view_dashboard')  && { id: 'dashboard',       label: 'Agenda',        icon: LayoutDashboard },
    can('can_view_orders')     && { id: 'orders',           label: 'Pedidos',       icon: ShoppingCart },
    can('can_view_kanban')     && { id: 'kanban',           label: 'Fluxo',         icon: Trello },
    can('can_view_art_queue')  && { id: 'art-queue',        label: 'Fila de Arte',  icon: Palette },
    can('can_view_products')   && { id: 'products',         label: 'Produtos',      icon: Package },
    can('can_view_catalog')    && { id: 'catalog-requests', label: 'Solicitações',  icon: Inbox },
    can('can_view_clients')    && { id: 'clients',          label: 'Clientes',      icon: Users },
    can('can_view_crm')        && { id: 'crm',              label: 'Chats',         icon: MessageSquare },
    can('can_view_inventory')  && { id: 'inventory',        label: 'Estoque',       icon: Box },
    (isMasterAdmin && cloudBotEnabled) && { id: 'cloudbot', label: 'CloudBot Agent', icon: Bot },
    can('can_view_finance')    && { id: 'finance',          label: 'Financeiro',    icon: TrendingUp },
    // SaaS Management: master admin only (hard-coded, never a DB permission)
    isMasterAdmin              && { id: 'master-admin',     label: 'Gestão SaaS',   icon: ShieldAlert },
  ].filter(Boolean) as { id: string; label: string; icon: React.ElementType }[];

  const handleCopyLink = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copiado para a área de transferência!');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      <aside className={`w-72 bg-[#0f172a] border-r border-slate-800/50 h-screen fixed md:sticky top-0 left-0 z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-8 border-b border-slate-800/50 flex justify-between items-center">
          <h1 className="text-xl font-black text-indigo-400 flex items-center gap-3 tracking-tighter uppercase truncate">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0 overflow-hidden">
              {companyLogo
                ? <img src={companyLogo} className="w-full h-full object-contain" alt="Logo" />
                : <Package className="w-6 h-6 text-white" />}
            </div>
            <span className="truncate" title={companyName}>{companyName}</span>
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {/* Loading state for tenants while permissions load */}
          {!isMasterAdmin && !permsLoaded && (
            <div className="space-y-2 animate-pulse px-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-800/50 rounded-2xl" />
              ))}
            </div>
          )}

          {(isMasterAdmin || permsLoaded) && menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                if (window.innerWidth < 768 && setIsOpen) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                activeView === item.id
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeView === item.id ? 'text-white' : 'text-slate-600'}`} />
              <span className="font-black uppercase text-[11px] tracking-widest">{item.label}</span>
            </button>
          ))}

          {/* External links — only for users with any actual permissions */}
          {(isMasterAdmin || (permsLoaded && permissions)) && (
            <div className="pt-4 mt-4 border-t border-slate-800/50 space-y-2">
              <p className="px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Links Externos</p>

              <div className="w-full flex items-center justify-between px-5 py-3 rounded-2xl text-indigo-400 hover:bg-slate-800/50 transition-all group">
                <a href="/catalogo" target="_blank" className="flex items-center gap-4 flex-1">
                  <Share2 className="w-5 h-5" />
                  <span className="font-black uppercase text-[11px] tracking-widest">Catálogo</span>
                </a>
                <button
                  onClick={() => handleCopyLink('/catalogo')}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-indigo-500/20 rounded-lg transition-all"
                  title="Copiar Link"
                >
                  <Copy className="w-4 h-4 text-indigo-300" />
                </button>
              </div>

              <div className="w-full flex items-center justify-between px-5 py-3 rounded-2xl text-emerald-400 hover:bg-slate-800/50 transition-all group">
                <a href="/?view=client_portal" target="_blank" className="flex items-center gap-4 flex-1">
                  <ExternalLink className="w-5 h-5" />
                  <span className="font-black uppercase text-[11px] tracking-widest">Portal Disp.</span>
                </a>
                <button
                  onClick={() => handleCopyLink('/?view=client_portal')}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-emerald-500/20 rounded-lg transition-all"
                  title="Copiar Link"
                >
                  <Copy className="w-4 h-4 text-emerald-300" />
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Settings + Version */}
        {can('can_view_settings') && (
          <div className="p-6 border-t border-slate-800/50">
            <button
              onClick={() => {
                setActiveView('settings');
                if (window.innerWidth < 768 && setIsOpen) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                activeView === 'settings'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-black uppercase text-[11px] tracking-widest">Ajustes</span>
            </button>
            <div className="mt-4 text-center">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Estamparia Pro v{SYSTEM_VERSION}</span>
            </div>
          </div>
        )}
        {!can('can_view_settings') && (
          <div className="p-6 border-t border-slate-800/50 text-center">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Estamparia Pro v{SYSTEM_VERSION}</span>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
