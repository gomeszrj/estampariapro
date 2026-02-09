import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import Orders from './components/Orders.tsx';
import Kanban from './components/Kanban.tsx';
import StoreControl from './components/StoreControl.tsx';
import Products from './components/Products.tsx';
import Settings from './components/Settings.tsx';
import Finance from './components/Finance.tsx';
import Clients from './components/Clients.tsx';
import Login from './components/Login.tsx';
import { ChatLayout } from './components/CRM/ChatLayout';
import CatalogRequests from './components/CatalogRequests.tsx';
import Inventory from './components/Inventory.tsx';
import { CloudBot } from './components/CloudBot';
import OrderTracker from './components/OrderTracker.tsx';
import PublicStore from './components/PublicStore.tsx';
import { Bell, User as UserIcon, Share2 } from 'lucide-react';
import { Order, Product, Client, OrderStatus, OrderType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { clientService } from './services/clientService.ts';
import { productService } from './services/productService.ts';
import { orderService } from './services/orderService.ts';
import ApiSettingsModal from './components/ApiSettingsModal.tsx';
import { SYSTEM_VERSION } from './constants';

const AuthenticatedApp: React.FC = () => {
  const { session, user, signOut } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [companyName, setCompanyName] = useState('Minha Estamparia');
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const isPublicCatalog = new URLSearchParams(window.location.search).get('view') === 'public_catalog' || window.location.pathname === '/catalogo';

  // Show Login if no session AND not in public catalog mode
  if (!session && !isPublicCatalog) {
    return <Login />;
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isPublicCatalog) {
          // If public, ONLY load products to be faster and safer
          const fetchedProducts = await productService.getAll();
          setProducts(fetchedProducts);
        } else {
          const [fetchedClients, fetchedProducts, fetchedOrders] = await Promise.all([
            clientService.getAll(),
            productService.getAll(),
            orderService.getAll()
          ]);
          setClients(fetchedClients);
          setProducts(fetchedProducts);
          setOrders(fetchedOrders);
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
  }, [isPublicCatalog]);

  // Removed legacy LocalStorage effects


  const [botDraft, setBotDraft] = useState<{ clientName: string; items: any[]; briefing: string } | null>(null);

  const handleBotOrder = (data: { clientName: string; items: any[]; briefing: string }) => {
    setBotDraft(data);
    setActiveView('orders');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard orders={orders} setOrders={setOrders} products={products} />;
      case 'orders': return <Orders orders={orders} setOrders={setOrders} products={products} clients={clients} setClients={setClients} botDraft={botDraft} onDraftUsed={() => setBotDraft(null)} />;
      case 'kanban': return <Kanban orders={orders} setOrders={setOrders} />;
      case 'products': return <Products />;
      case 'store-control': return <StoreControl products={products} setProducts={setProducts} readOnly={false} />;
      case 'catalog-requests': return <CatalogRequests />;
      case 'settings': return <Settings />;
      case 'finance': return <Finance orders={orders} products={products} />;
      case 'clients': return <Clients clients={clients} setClients={setClients} orders={orders} />;
      case 'inventory': return <Inventory />;
      case 'cloudbot': return <CloudBot onCreateOrder={handleBotOrder} />;
      case 'crm': return <ChatLayout />;
      default: return null;
    }
  };

  if (isPublicCatalog) {
    return <PublicStore />;
  }

  const isTrackerView = new URLSearchParams(window.location.search).get('view') === 'tracker';
  const trackerOrderId = new URLSearchParams(window.location.search).get('order') || undefined;

  if (isTrackerView) {
    return <OrderTracker orderId={trackerOrderId} onBack={() => window.location.href = '/'} />;
  }

  return (
    <div className="flex min-h-screen bg-[#020617]">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-[#0f172a]/40 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tenant:</span>
            <span className="text-xs font-black text-slate-100 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-sm uppercase tracking-wider">
              {companyName}
            </span>
            <a href="/catalogo" target="_blank" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 ml-4 border border-indigo-500/30 px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500/10 transition-all">
              <Share2 className="w-3 h-3" /> Catálogo Público
            </a>
          </div>
          <div className="flex items-center gap-8">
            <button className="relative px-3 py-2 text-slate-400 hover:text-indigo-400 transition-all bg-slate-800/30 rounded-xl border border-slate-700/50 group flex items-center gap-3" title={`Sistema Atualizado: v${SYSTEM_VERSION}`}>
              <div className="relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0f172a]"></div>
              </div>
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">v{SYSTEM_VERSION}</span>
            </button>
            <div className="flex items-center gap-4 pl-8 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-100 tracking-tight">{user?.email}</p>
                <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em]">Admin Master</p>
                <button onClick={signOut} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest mt-1">Sair</button>
              </div>
              <button
                onClick={() => setIsApiSettingsOpen(true)}
                className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black border border-indigo-500 shadow-lg shadow-indigo-600/20 hover:scale-105 transition-transform cursor-pointer relative group"
                title="Configurar Integrações"
              >
                <UserIcon className="w-6 h-6" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </button>
            </div>
          </div>
        </header>

        <ApiSettingsModal isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} />

        <div className="p-10 max-w-[1600px] mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
