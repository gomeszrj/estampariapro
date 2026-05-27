import React, { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import { SubscriptionLock } from './components/SubscriptionLock';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { ChatWidget } from './components/CRM/ChatWidget';
import { PageSkeleton } from './components/ui/SkeletonLoader';
import { Bell, User as UserIcon, Share2, Menu, ExternalLink, Link as LinkIcon, Copy, AlertTriangle, Search } from 'lucide-react';
import { Order, Product, Client, OrderStatus, OrderType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { clientService } from './services/clientService';
import { productService } from './services/productService';
import { orderService } from './services/orderService';
import { inventoryService } from './services/inventoryService';
import { settingsService } from './services/settingsService';
import ApiSettingsModal from './components/ApiSettingsModal';
import { SYSTEM_VERSION, LATEST_RELEASE_NOTES } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { tenantService } from './services/tenantService';
import { supabase } from './services/supabase';
import { Toaster, toast } from 'sonner';
import { notify } from './components/ui/toast';

// Helper: retry dynamic imports — auto-reload on stale chunk (after deploy)
const lazyRetry = (importFn: () => Promise<any>) =>
  React.lazy(() =>
    importFn().catch(() => {
      // Chunk failed — likely stale cache after a new deploy
      // Only reload once to avoid infinite loops
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
      return importFn(); // retry once more in case reload was prevented
    })
  );

// Clear the reload flag on successful page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => sessionStorage.removeItem('chunk_reload'));
}

// Core Page/View Imports — now lazy-loaded for instant page transitions
import Dashboard from './components/Dashboard';
const Orders = lazyRetry(() => import('./components/Orders'));
const Kanban = lazyRetry(() => import('./components/Kanban'));
const StoreControl = lazyRetry(() => import('./components/StoreControl'));
const Products = lazyRetry(() => import('./components/Products'));
const Settings = lazyRetry(() => import('./components/Settings'));
const Finance = lazyRetry(() => import('./components/Finance'));
const Clients = lazyRetry(() => import('./components/Clients'));
const CatalogRequests = lazyRetry(() => import('./components/CatalogRequests'));
const Inventory = lazyRetry(() => import('./components/Inventory'));
const ArtQueue = lazyRetry(() => import('./components/ArtQueue'));
const MasterAdmin = lazyRetry(() => import('./components/MasterAdmin'));
const CloudBot = lazyRetry(() => import('./components/CloudBot').then(m => ({ default: m.CloudBot })));
const WhatsAppManager = lazyRetry(() => import('./components/WhatsAppManager').then(m => ({ default: m.WhatsAppManager })));

// Separate Portals / Public entry-points (Keep lazy to keep initial load small)
const ClientPortal = lazyRetry(() => import('./components/ClientPortal'));
const PublicStore = lazyRetry(() => import('./components/PublicStore'));
const OrderTracker = lazyRetry(() => import('./components/OrderTracker'));


const AuthenticatedApp: React.FC = () => {
  const { session, user, isMasterAdmin, signOut } = useAuth(); // SEC-002: isMasterAdmin from context
  const isPublicCatalog = new URLSearchParams(window.location.search).get('view') === 'public_catalog' || window.location.pathname === '/catalogo';
  const isClientPortal = new URLSearchParams(window.location.search).get('view') === 'client_portal' || !!localStorage.getItem('client_session');
  
  const [activeView, setActiveView] = useState('dashboard');
  const [companyName, setCompanyName] = useState('Minha Estamparia');
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [tenantData, setTenantData] = useState<any>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const [botDraft, setBotDraft] = useState<{ clientName: string; items: any[]; briefing: string } | null>(null);

  useEffect(() => {
    // Skip data loading if no session and not in public mode
    if (!session && !isPublicCatalog && !isClientPortal) return;

    const loadData = async () => {
      setLoading(true);
      try {
        if (isPublicCatalog) {
          // If public, ONLY load products to be faster and safer
          const fetchedProducts = await productService.getAll();
          setProducts(fetchedProducts);
        } else {
          const [fetchedClients, fetchedProducts, fetchedOrders, fetchedInventory] = await Promise.all([
            clientService.getAll(),
            productService.getAll(),
            orderService.getAll(),
            inventoryService.getAll().catch(() => [])
          ]);
          setClients(fetchedClients);
          setProducts(fetchedProducts);
          setOrders(fetchedOrders);
          
          const lowStock = (fetchedInventory || []).filter((item: any) => item.quantity <= (item.minLevel || 10));
          setLowStockCount(lowStock.length);

          // Get Tenant Status and Profile data
          const { data: profile } = await supabase.from('profiles').select('tenant_id, require_password_change').eq('id', user?.id).single();
          
          if (profile) {
            setMustChangePassword(!!profile.require_password_change);
            
            if (profile.tenant_id) {
                const tData = await tenantService.getTenantById(profile.tenant_id);
                setTenantData(tData);
            }
          }

          settingsService.getSettings().then(s => {
            if (s.name) setCompanyName(s.name);
            if (s.logo_url) setCompanyLogo(s.logo_url);
          }).catch(console.error);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial Load
    loadData();

    // Listen for updates (simplified refresh for now)
    const handleRefresh = () => loadData();
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, [isPublicCatalog, session]);

  // Show Login if no session AND not in public catalog mode AND not in client portal
  if (!session && !isPublicCatalog && !isClientPortal) {
    return <Login />;
  }

  const handleBotOrder = (data: { clientName: string; items: any[]; briefing: string }) => {
    setBotDraft(data);
    setActiveView('orders');
  };

  const handleCopyLink = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copiado para a área de transferência!');
    setIsLinksOpen(false);
  };

  const renderContent = React.useMemo(() => {
    switch (activeView) {
      case 'dashboard': return <Dashboard orders={orders} setOrders={setOrders} products={products} />;
      case 'orders': return <Orders orders={orders} setOrders={setOrders} products={products} clients={clients} setClients={setClients} botDraft={botDraft} onDraftUsed={() => setBotDraft(null)} isMasterAdmin={isMasterAdmin} />;
      case 'kanban': return <Kanban orders={orders} setOrders={setOrders} setActiveView={setActiveView} />;
      case 'products': return <Products />;
      case 'store-control': return <StoreControl products={products} setProducts={setProducts} readOnly={false} />;
      case 'catalog-requests': return <CatalogRequests />;
      case 'settings': return <Settings />;
      case 'finance': return <Finance orders={orders} products={products} />;
      case 'clients': return <Clients clients={clients} setClients={setClients} orders={orders} />;
      case 'inventory': return <Inventory />;
      case 'art-queue': return <ArtQueue />;
      case 'cloudbot': return <CloudBot onCreateOrder={handleBotOrder} />;
      case 'crm': return <WhatsAppManager />;
      case 'master-admin': return isMasterAdmin ? <MasterAdmin /> : null;
      default: return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, orders, products, clients, botDraft, isMasterAdmin]);

  if (isClientPortal) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <ClientPortal />
      </Suspense>
    );
  }

  if (isPublicCatalog) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <PublicStore />
      </Suspense>
    );
  }

  const isTrackerView = new URLSearchParams(window.location.search).get('view') === 'tracker';
  const trackerOrderId = new URLSearchParams(window.location.search).get('order') || undefined;

  if (isTrackerView) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <OrderTracker orderId={trackerOrderId} onBack={() => window.location.href = '/'} />
      </Suspense>
    );
  }

  // Subscription Logic (Lock System)
  const isSubscriberBlocked = () => {
    if (isMasterAdmin) return false;
    if (!tenantData) return false;
    if (tenantData.active === false) return true;
    
    if (tenantData.subscription_end_date) {
        const endDate = new Date(tenantData.subscription_end_date);
        const graceDate = new Date(endDate);
        graceDate.setDate(graceDate.getDate() + 3); // 3 day grace period
        
        return new Date() > graceDate;
    }
    return false;
  };

  const getDaysOverdue = () => {
      if (!tenantData?.subscription_end_date) return 0;
      const end = new Date(tenantData.subscription_end_date);
      const diff = new Date().getTime() - end.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  if (isSubscriberBlocked()) {
    return (
        <SubscriptionLock 
            tenantName={tenantData?.name || companyName}
            paymentLink={tenantData?.payment_link}
            daysOverdue={getDaysOverdue()}
            onSignOut={signOut}
        />
    );
  }

  if (mustChangePassword) {
      return <ForcePasswordChange onComplete={() => setMustChangePassword(false)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b1221] text-slate-200 relative">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMasterAdmin={isMasterAdmin} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-[#05080E] border-b border-[#1e293b] flex items-center justify-between px-4 md:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-white/60 hover:text-white mr-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* The page title / "Olá Admin" is now handled inside Dashboard, but here we keep it empty or simple if not on dashboard */}
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Fake Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-[#0b1221] border border-[#1e293b] rounded-xl px-4 py-2 w-64 hover:border-slate-600 transition-colors cursor-text">
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500 text-sm flex-1">Buscar...</span>
              <div className="flex items-center gap-1 text-slate-600">
                <span className="text-[10px] font-black uppercase">⌘K</span>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => notify.info(`Sistema Estamparia.AI v${SYSTEM_VERSION} - Novidades:\n\n${LATEST_RELEASE_NOTES}`)}
              className="relative p-2 text-slate-400 hover:text-white transition-all bg-[#0b1221] rounded-xl border border-[#1e293b] hover:border-[#6366f1]/50 group"
              title={`Ver Novidades da Versão ${SYSTEM_VERSION}`}
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4f46e5] rounded-full border-2 border-[#0b1221]"></div>
            </button>

            {/* Version Badge */}
            <div className="hidden sm:flex items-center justify-center bg-[#4f46e5]/10 border border-[#4f46e5]/30 text-[#818cf8] px-3 py-1.5 rounded-xl font-mono text-[10px] font-black tracking-widest shadow-[0_0_10px_rgba(79,70,229,0.1)]">
              v{SYSTEM_VERSION}
            </div>

            {/* User Profile Area */}
            <div className="flex items-center gap-4 pl-6 border-l border-[#1e293b]">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white tracking-tight">{user?.email || 'admin@estamparia.com'}</p>
                <p className="text-[9px] text-[#6366f1] font-black uppercase tracking-widest mt-0.5">{isMasterAdmin ? 'ADMIN MASTER' : 'ADMINISTRADOR'}</p>
                <button onClick={signOut} className="text-[9px] text-rose-500 font-black hover:text-rose-400 uppercase tracking-widest mt-0.5 w-full text-right">SAIR</button>
              </div>
              
              <div className="relative group cursor-pointer" onClick={signOut}>
                <div className="absolute inset-0 bg-[#6366f1]/20 rounded-full blur-md group-hover:bg-[#6366f1]/40 transition-all"></div>
                <div className="w-10 h-10 rounded-full bg-[#1e293b] border-2 border-[#1e293b] group-hover:border-[#6366f1] relative z-10 overflow-hidden flex items-center justify-center text-white font-black text-sm transition-colors">
                  {companyLogo
                    ? <img src={companyLogo} alt="Avatar" className="w-full h-full object-cover" />
                    : <span>{(user?.email || 'A')[0].toUpperCase()}</span>
                  }
                </div>
              </div>

              {/* API / Integrations button — MASTER ADMIN ONLY */}
              {isMasterAdmin && (
                <button
                  onClick={() => setIsApiSettingsOpen(true)}
                  className="w-10 h-10 rounded-full bg-[#1e293b] text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors border border-transparent hover:border-slate-500"
                  title="Configurar Integrações de IA"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        <ApiSettingsModal isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} />
        <ChatWidget />

        <div className="p-4 md:p-10 max-w-[1600px] mx-auto w-full">
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              {renderContent}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: 'rgba(8, 10, 15, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
