import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import Orders from './components/Orders.tsx';
import Kanban from './components/Kanban.tsx';
import Catalog from './components/Catalog.tsx';
import Settings from './components/Settings.tsx';
import Finance from './components/Finance.tsx';
import Clients from './components/Clients.tsx';
import Login from './components/Login.tsx';
import { Bell, User as UserIcon } from 'lucide-react';
import { Order, Product, Client, OrderStatus, OrderType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { clientService } from './services/clientService.ts';
import { productService } from './services/productService.ts';
import { orderService } from './services/orderService.ts';

const AuthenticatedApp: React.FC = () => {
  const { session, user, signOut } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [companyName, setCompanyName] = useState('Minha Estamparia');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Show Login if no session
  if (!session) {
    return <Login />;
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedClients, fetchedProducts, fetchedOrders] = await Promise.all([
          clientService.getAll(),
          productService.getAll(),
          orderService.getAll()
        ]);
        setClients(fetchedClients);
        setProducts(fetchedProducts);
        setOrders(fetchedOrders);
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
  }, []);

  // Removed legacy LocalStorage effects


  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard orders={orders} setOrders={setOrders} />;
      case 'orders': return <Orders orders={orders} setOrders={setOrders} products={products} clients={clients} setClients={setClients} />;
      case 'kanban': return <Kanban orders={orders} setOrders={setOrders} />;
      case 'catalog': return <Catalog products={products} setProducts={setProducts} />;
      case 'settings': return <Settings />;
      case 'finance': return <Finance orders={orders} />;
      case 'clients': return <Clients clients={clients} setClients={setClients} orders={orders} />;
      default: return null;
    }
  };

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
          </div>
          <div className="flex items-center gap-8">
            <button className="relative p-2.5 text-slate-400 hover:text-indigo-400 transition-all bg-slate-800/30 rounded-xl border border-slate-700/50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0f172a]"></span>
            </button>
            <div className="flex items-center gap-4 pl-8 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-100 tracking-tight">{user?.email}</p>
                <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em]">Admin Master</p>
                <button onClick={signOut} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest mt-1">Sair</button>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black border border-indigo-500 shadow-lg shadow-indigo-600/20">
                <UserIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>
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
