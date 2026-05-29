
import React from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Trello, Users,
  Settings, TrendingUp, Box, MessageSquare, Inbox, Bot,
  ExternalLink, Share2, Copy, Palette, ShieldAlert, Truck
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { tenantService } from '../services/tenantService';
import { supabase } from '../services/supabase';
import { SYSTEM_VERSION } from '../constants';
import { notify } from './ui/toast';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  setIsOpen?: (val: boolean) => void;
  isMasterAdmin?: boolean;
  tenantId?: string;
  userProfile?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, isMasterAdmin, tenantId, userProfile }) => {
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

  // Load RBAC permissions from DB with a safety timeout
  const loadPermissions = async () => {
    let resolved = false;

    // Safety timeout: if Supabase query hangs for more than 1.5 seconds, force proceed with default full access
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        console.warn("Sidebar permissions load timed out - defaulting to full access");
        setPermissions(null); // null = default full access
        setPermsLoaded(true);
        resolved = true;
      }
    }, 1500);

    try {
      console.log("Sidebar: Loading user session...");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Sidebar: User session loaded:", user?.email);
      if (!user) {
        if (!resolved) {
          setPermsLoaded(true);
          resolved = true;
          clearTimeout(timeoutId);
        }
        return;
      }

      console.log("Sidebar: Fetching permissions from DB...");
      const perms = await tenantService.getMyPermissions();
      console.log("Sidebar: Permissions fetched:", perms);
      if (!resolved) {
        setPermissions(perms || null);
        setPermsLoaded(true);
        resolved = true;
        clearTimeout(timeoutId);
      }
    } catch (err) {
      console.error("Sidebar: Error loading permissions:", err);
      if (!resolved) {
        setPermissions(null);
        setPermsLoaded(true);
        resolved = true;
        clearTimeout(timeoutId);
      }
    }
  };

  React.useEffect(() => {
    loadSettings();
    loadPermissions();
    window.addEventListener('settingsUpdated', loadSettings);
    return () => window.removeEventListener('settingsUpdated', loadSettings);
  }, []);

  // ── Helper: can this user see a module? ──
  // MasterAdmin sees everything. For admins without explicit permissions, default to full access.
  // For tenants with explicit permissions, use the DB record.
  const can = (permKey: string): boolean => {
    if (isMasterAdmin) return true;
    if (!permsLoaded)  return false;
    
    // If permissions object is null, undefined, or empty, default to full access (true)
    if (!permissions || Object.keys(permissions).length === 0) return true;
    
    // If the specific permission key doesn't exist in the object, default to true for core features
    if (!(permKey in permissions)) {
      const coreKeys = [
        'can_view_dashboard', 'can_view_orders', 
        'can_view_kanban', 'can_view_art_queue', 'can_view_products', 
        'can_view_catalog', 'can_view_clients', 'can_view_crm', 
        'can_view_inventory', 'can_view_finance', 'can_view_settings'
      ];
      return coreKeys.includes(permKey);
    }
    
    return !!permissions[permKey];
  };

  // ── Build menu items ──────────────────────────────────────────────────────
  const menuItems = [
    can('can_view_dashboard')  && { id: 'dashboard',       label: 'Agenda',        icon: LayoutDashboard },
    can('can_view_orders')     && { id: 'orders',           label: 'Pedidos',       icon: ShoppingCart },
    can('can_view_kanban')     && { id: 'kanban',           label: 'Fluxo',         icon: Trello },
    can('can_view_art_queue')  && { id: 'art-queue',        label: 'Fila de Arte',  icon: Palette },
    can('can_view_products')   && { id: 'products',         label: 'Produtos',      icon: Package },
    { id: 'store-manager',      label: 'Admin Loja',    icon: ShoppingCart },
    can('can_view_catalog')    && { id: 'catalog-requests', label: 'Solicitações',  icon: Inbox },
    can('can_view_clients')    && { id: 'clients',          label: 'Clientes',      icon: Users },
    can('can_view_crm')        && { id: 'crm',              label: 'Central WhatsApp', icon: MessageSquare },
    can('can_view_inventory')  && { id: 'inventory',        label: 'Estoque',       icon: Box },
    can('can_view_inventory')  && { id: 'suppliers',        label: 'Fornecedores',  icon: Truck },
    (isMasterAdmin && cloudBotEnabled) && { id: 'cloudbot', label: 'CloudBot Agent', icon: Bot },
    can('can_view_finance')    && { id: 'finance',          label: 'Financeiro',    icon: TrendingUp },
    // SaaS Management: master admin only (hard-coded, never a DB permission)
    isMasterAdmin              && { id: 'master-admin',     label: 'Gestão SaaS',   icon: ShieldAlert },
  ].filter(Boolean) as { id: string; label: string; icon: React.ElementType }[];

  const handleCopyLink = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    notify.success('Link copiado!');
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

      <aside className={`w-72 bg-[#05080E] border-r border-[#1e293b] h-screen fixed md:sticky top-0 left-0 z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-center">
          <h1 className="flex items-center gap-3">
            <div className="w-12 h-12 bg-transparent flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[#6366f1]/20 rounded-xl blur-md"></div>
              <span className="text-[#6366f1] text-2xl font-black relative z-10 font-mono tracking-tighter" style={{ textShadow: '0 0 10px #6366f1, 0 0 20px #6366f1' }}>EP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-lg font-black tracking-tight leading-none">ESTAMPARIA</span>
              <span className="text-[#6366f1] text-[10px] font-black uppercase tracking-[0.3em] leading-none mt-1">PRO</span>
            </div>
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
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                activeView === item.id
                  ? 'bg-[#4f46e5] text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                  : 'text-slate-400 hover:bg-[#0f172a] hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeView === item.id ? 'text-white' : 'text-slate-500'}`} />
              <span className={`text-[12px] uppercase tracking-widest ${activeView === item.id ? 'font-black' : 'font-bold'}`}>{item.label}</span>
            </button>
          ))}

          {/* External links — only for users with any actual permissions */}
          {(isMasterAdmin || (permsLoaded && permissions)) && (
            <div className="pt-4 mt-4 border-t border-[#1e293b] space-y-2">
              <p className="px-5 text-[10px] font-black uppercase tracking-widest text-[#5A6578] mb-2">Links Externos</p>

              <div className="w-full flex items-center justify-between px-5 py-3 rounded-2xl text-white/70 border border-transparent hover:border-[#1e293b] hover:bg-white/5 hover:text-white transition-all group">
                <a href={`/catalogo${tenantId ? `?tenant=${tenantId}` : ''}`} target="_blank" className="flex items-center gap-4 flex-1">
                  <Share2 className="w-5 h-5 text-[#5A6578] group-hover:text-white transition-colors" />
                  <span className="font-black uppercase text-[11px] tracking-widest">Catálogo</span>
                </a>
                <button
                  onClick={() => handleCopyLink(`/catalogo${tenantId ? `?tenant=${tenantId}` : ''}`)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                  title="Copiar Link"
                >
                  <Copy className="w-4 h-4 text-white/50 hover:text-white" />
                </button>
              </div>

              <div className="w-full flex items-center justify-between px-5 py-3 rounded-2xl text-white/70 border border-transparent hover:border-[#1e293b] hover:bg-white/5 hover:text-white transition-all group">
                <a href={`/?view=client_portal${tenantId ? `&tenant=${tenantId}` : ''}`} target="_blank" className="flex items-center gap-4 flex-1">
                  <ExternalLink className="w-5 h-5 text-[#5A6578] group-hover:text-white transition-colors" />
                  <span className="font-black uppercase text-[11px] tracking-widest">Portal Disp.</span>
                </a>
                <button
                  onClick={() => handleCopyLink(`/?view=client_portal${tenantId ? `&tenant=${tenantId}` : ''}`)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                  title="Copiar Link"
                >
                  <Copy className="w-4 h-4 text-white/50 hover:text-white" />
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Settings + Version */}
        {can('can_view_settings') && (
          <div className="p-6 border-t border-[#1e293b]">
            <button
              onClick={() => {
                setActiveView('settings');
                if (window.innerWidth < 768 && setIsOpen) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                activeView === 'settings'
                  ? 'bg-[#6366f1] text-white font-black shadow-lg shadow-indigo-500/20'
                  : 'text-[#5A6578] hover:bg-[#0f172a] hover:text-white'
              }`}
            >
              <Settings className={`w-5 h-5 transition-colors ${activeView === 'settings' ? 'text-white' : 'text-[#5A6578]'}`} />
              <span className="font-black uppercase text-[11px] tracking-widest">Ajustes</span>
            </button>
            <div className="mt-4 text-center">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Estamparia Pro v{SYSTEM_VERSION}</span>
            </div>
          </div>
        )}
        {!can('can_view_settings') && (
          <div className="p-6 border-t border-[#1e293b] text-center">
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Estamparia Pro v{SYSTEM_VERSION}</span>
          </div>
        )}

        {/* Footer User Info */}
        <div className="p-4 border-t border-[#1e293b] space-y-3 bg-[#05080E]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1221] border border-[#1e293b] cursor-pointer hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-[#1e293b]">
                <img src="https://i.pravatar.cc/150?u=admin" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xs font-bold">{userProfile?.full_name || 'Usuário'}</span>
                <span className="text-[#6366f1] text-[9px] font-black tracking-widest uppercase mt-0.5">{isMasterAdmin ? 'ADMIN MASTER' : (userProfile?.role?.toUpperCase() || 'ADMINISTRADOR')}</span>
              </div>
            </div>
            <span className="text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1e1b4b] to-[#1e1b4b]/50 border border-[#4f46e5]/30 cursor-pointer group hover:border-[#4f46e5]/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#4f46e5]/20 text-[#818cf8] group-hover:bg-[#4f46e5]/30 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-[11px] font-bold tracking-wide">Plano Profissional</span>
                <span className="text-slate-400 text-[9px] mt-0.5">Ativo até 15/07/2026</span>
              </div>
            </div>
            <span className="text-[#818cf8] group-hover:translate-x-1 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
