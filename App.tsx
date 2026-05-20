import React, { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import { SubscriptionLock } from './components/SubscriptionLock';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { ChatWidget } from './components/CRM/ChatWidget';
import { PageSkeleton } from './components/ui/SkeletonLoader';
import { Bell, User as UserIcon, Share2, Menu, ExternalLink, Link as LinkIcon, Copy, AlertTriangle } from 'lucide-react';
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

// Dynamic Page/View Imports for lazy loading (Performance FASE 2)
const Dashboard = lazyRetry(() => import('./components/Dashboard'));
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

// Dynamic Portals/Sub-systems
const CloudBot = lazyRetry(() => import('./components/CloudBot').then(m => ({ default: m.CloudBot })));
const WhatsAppManager = lazyRetry(() => import('./components/WhatsAppManager').then(m => ({ default: m.WhatsAppManager })));
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

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard orders={orders} setOrders={setOrders} products={products} />;
      case 'orders': return <Orders orders={orders} setOrders={setOrders} products={products} clients={clients} setClients={setClients} botDraft={botDraft} onDraftUsed={() => setBotDraft(null)} isMasterAdmin={isMasterAdmin} />;
      case 'kanban': return <Kanban orders={orders} setOrders={setOrders} />;
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
  };

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
    <div className="flex min-h-screen bg-[#020617] relative">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMasterAdmin={isMasterAdmin} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-[#0f172a]/40 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-400 hover:text-white mr-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="hidden md:inline text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tenant:</span>
            <div className="hidden md:flex items-center gap-3 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-sm">
              {companyLogo && <img src={companyLogo} alt="Logo" className="w-5 h-5 object-contain" />}
              <span className="text-xs font-black text-slate-100 uppercase tracking-wider">
                {companyName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveView('inventory')}
                className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all animate-pulse"
                title={`${lowStockCount} itens com estoque baixo!`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">Estoque Baixo:</span>
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{lowStockCount}</span>
              </button>
            )}
            <button
              onClick={() => notify.info(`Sistema Estamparia.AI v${SYSTEM_VERSION} - Novidades:\n\n${LATEST_RELEASE_NOTES}`)}
              className="relative px-3 py-2 text-slate-400 hover:text-indigo-400 transition-all bg-slate-800/30 rounded-xl border border-slate-700/50 group flex items-center gap-3"
              title={`Ver Novidades da Versão ${SYSTEM_VERSION}`}
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0f172a]"></div>
              </div>
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">v{SYSTEM_VERSION}</span>
            </button>
            <div className="flex items-center gap-4 pl-8 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-100 tracking-tight">{user?.email}</p>
                <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em]">{isMasterAdmin ? 'Admin Master' : 'Administrador'}</p>
                <button onClick={signOut} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest mt-1">Sair</button>
              </div>
                {/* API / Integrations button — MASTER ADMIN ONLY */}
                {isMasterAdmin && (
                  <button
                    onClick={() => setIsApiSettingsOpen(true)}
                    className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black border border-indigo-500 shadow-lg shadow-indigo-600/20 hover:scale-105 transition-transform cursor-pointer relative group"
                    title="Configurar Integrações de IA"
                  >
                    <UserIcon className="w-6 h-6" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
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
              {renderContent()}
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
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#f1f5f9',
            },
          }}
        />
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
