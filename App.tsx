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
import Chats from './components/Chats.tsx';
import CatalogRequests from './components/CatalogRequests.tsx';
import Inventory from './components/Inventory.tsx';
import { CloudBot } from './components/CloudBot';
import OrderTracker from './components/OrderTracker.tsx';
import PublicStore from './components/PublicStore.tsx';
import ClientPortal from './components/ClientPortal.tsx';
import { Bell, User as UserIcon, Share2, Menu, ExternalLink, Link as LinkIcon, Copy } from 'lucide-react';
import { Order, Product, Client, OrderStatus, OrderType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { clientService } from './services/clientService.ts';
import { productService } from './services/productService.ts';
import { orderService } from './services/orderService.ts';
import ApiSettingsModal from './components/ApiSettingsModal.tsx';
import { SYSTEM_VERSION, LATEST_RELEASE_NOTES } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

const AuthenticatedApp: React.FC = () => {
  const { session, user, signOut } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [companyName, setCompanyName] = useState('Minha Estamparia');
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const isPublicCatalog = new URLSearchParams(window.location.search).get('view') === 'public_catalog' || window.location.pathname === '/catalogo';
  const isClientPortal = new URLSearchParams(window.location.search).get('view') === 'client_portal' || !!localStorage.getItem('client_session');

  // Show Login if no session AND not in public catalog mode AND not in client portal
  if (!session && !isPublicCatalog && !isClientPortal) {
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

  const handleCopyLink = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copiado para a área de transferência!');
    setIsLinksOpen(false);
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
      case 'crm': return <Chats />;
      default: return null;
    }
  };

  if (isClientPortal) {
    return <ClientPortal />;
  }

  if (isPublicCatalog) {
    return <PublicStore />;
  }

  const isTrackerView = new URLSearchParams(window.location.search).get('view') === 'tracker';
  const trackerOrderId = new URLSearchParams(window.location.search).get('order') || undefined;

  if (isTrackerView) {
    return <OrderTracker orderId={trackerOrderId} onBack={() => window.location.href = '/'} />;
  }

  return (
    <div className="flex min-h-screen bg-[#020617] relative">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
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
            <span className="hidden md:inline text-xs font-black text-slate-100 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-sm uppercase tracking-wider">
              {companyName}
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="relative">
              <button
                onClick={() => setIsLinksOpen(!isLinksOpen)}
                className="hidden md:flex text-[10px] font-bold text-slate-300 hover:text-white border border-slate-700 bg-slate-800/50 px-4 py-2 rounded-lg uppercase tracking-widest items-center gap-2 hover:bg-slate-700 transition-all shadow-sm"
              >
                <LinkIcon className="w-4 h-4 text-indigo-400" /> Links Úteis
              </button>

              {isLinksOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLinksOpen(false)}></div>
                  <div className="absolute top-full mt-2 right-0 w-64 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-800/50 bg-slate-900/30">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Links de Compartilhamento</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="group rounded-xl p-2 hover:bg-indigo-500/10 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                            <Share2 className="w-3 h-3" /> Catálogo Próprio
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleCopyLink('/catalogo')} className="p-1.5 bg-indigo-500/20 rounded hover:bg-indigo-500/40 text-indigo-300" title="Copiar Link"><Copy className="w-3 h-3" /></button>
                            <a href="/catalogo" target="_blank" className="p-1.5 bg-indigo-500/20 rounded hover:bg-indigo-500/40 text-indigo-300" title="Abrir"><ExternalLink className="w-3 h-3" /></a>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">Loja virtual para clientes fazerem pedidos de uniformes sozinhos.</p>
                      </div>

                      <div className="group rounded-xl p-2 hover:bg-emerald-500/10 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                            <ExternalLink className="w-3 h-3" /> Portal do Cliente
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleCopyLink('/?view=client_portal')} className="p-1.5 bg-emerald-500/20 rounded hover:bg-emerald-500/40 text-emerald-300" title="Copiar Link"><Copy className="w-3 h-3" /></button>
                            <a href="/?view=client_portal" target="_blank" className="p-1.5 bg-emerald-500/20 rounded hover:bg-emerald-500/40 text-emerald-300" title="Abrir"><ExternalLink className="w-3 h-3" /></a>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">Rastreamento de pedidos, histórico e contato direto com o suporte.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => alert(`Sistema Estamparia.AI Atualizado (v${SYSTEM_VERSION})\n\n${LATEST_RELEASE_NOTES}\n\nObrigado por utilizar nosso sistema!`)}
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

        <div className="p-4 md:p-10 max-w-[1600px] mx-auto w-full">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
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
