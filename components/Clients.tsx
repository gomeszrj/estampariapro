
import React, { useState } from 'react';
import { Search, UserPlus, Edit2, Phone, Mail, Trash2, X, Save, User, ShoppingBag, CreditCard, Clock, Calendar, AlertTriangle, ArrowRight, Wallet, Globe } from 'lucide-react';
import { Client, Order, OrderStatus, CatalogOrder } from '../types.ts';
import { clientService } from '../services/clientService.ts';
import { catalogOrderService } from '../services/catalogOrderService.ts';

interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  orders: Order[];
}

const Clients: React.FC<ClientsProps> = ({ clients, setClients, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [profileTab, setProfileTab] = useState<'active' | 'history' | 'info' | 'catalog'>('active');
  const [clientCatalogOrders, setClientCatalogOrders] = useState<CatalogOrder[]>([]);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientOrderCount = (clientId: string) => {
    return orders.filter(o => o.clientId === clientId).length;
  };

  const handleViewProfile = async (client: Client) => {
    setViewingClient(client);
    setProfileTab('active');
    // Fetch Catalog Requests
    try {
      const reqs = await catalogOrderService.getByClientId(client.id);
      setClientCatalogOrders(reqs);
    } catch (err) {
      console.error("Failed to load catalog orders", err);
      setClientCatalogOrders([]);
    }
  };

  const getClientOrders = (clientId: string) => {
    return orders.filter(o => o.clientId === clientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getClientFinancials = (clientId: string) => {
    const clientOrders = getClientOrders(clientId);
    const totalSpent = clientOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0);
    const lastOrderDate = clientOrders.length > 0 ? new Date(clientOrders[0].createdAt).toLocaleDateString() : 'N/A';
    return { totalSpent, lastOrderDate, totalOrders: clientOrders.length };
  };

  const filteredOrders = viewingClient ? getClientOrders(viewingClient.id) : [];
  const activeOrders = filteredOrders.filter(o => o.status !== OrderStatus.FINISHED && o.status !== OrderStatus.RECEIVED); // Assuming RECEIVED is active? Let's treat FINISHED as history.
  // Actually, usually FINISHED is history. RECEIVED, IN_PRODUCTION, FINALIZATION are active.
  const historyOrders = filteredOrders.filter(o => o.status === OrderStatus.FINISHED);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.RECEIVED: return 'bg-slate-800 text-slate-300 border-slate-700';
      case OrderStatus.FINALIZATION: return 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50';
      case OrderStatus.IN_PRODUCTION: return 'bg-amber-900/30 text-amber-400 border-amber-900/50';
      case OrderStatus.FINISHED: return 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50';
      default: return 'bg-slate-800 text-slate-500';
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient({ ...client });
    setViewingClient(null); // Close profile if editing
  };
  // ... import removed from here ...

  // ... inside component ...
  const handleSave = async () => {
    try {
      if (!editingClient.id) {
        await clientService.create({
          name: editingClient.name,
          whatsapp: editingClient.whatsapp,
          email: editingClient.email,
          document: editingClient.document || '',
          address: editingClient.address || ''
        });
      } else {
        await clientService.update(editingClient.id, {
          name: editingClient.name,
          whatsapp: editingClient.whatsapp,
          email: editingClient.email,
          document: editingClient.document,
          address: editingClient.address
        });
      }
      setEditingClient(null);
      window.dispatchEvent(new Event('refreshData'));
    } catch (e) {
      console.error("Error saving client:", e);
      alert("Erro ao salvar cliente.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const orderCount = getClientOrderCount(id);

    if (orderCount > 0) {
      if (confirm(`ATENÇÃO: Este cliente possui ${orderCount} pedido(s) vinculados!\n\nExcluir este cliente apagará PERMANENTEMENTE todo o histórico de pedidos dele também.\n\nDeseja realizar a "Exclusão Real" e limpar tudo?`)) {
        try {
          await clientService.deleteWithCascade(id);
          window.dispatchEvent(new Event('refreshData'));
          setViewingClient(null);
        } catch (e) {
          console.error("Error deleting cascade:", e);
          alert("Erro ao excluir: " + e);
        }
      }
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o cliente "${name}" permanentemente?`)) {
      try {
        await clientService.delete(id);
        window.dispatchEvent(new Event('refreshData'));
      } catch (e) {
        console.error("Error deleting client:", e);
        alert("Erro ao excluir cliente. Verifique se não há dados vinculados.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">Clientes</h2>
          <p className="text-slate-500">Cadastro e histórico de parcerias.</p>
        </div>
        <button
          onClick={() => setEditingClient({ name: '', whatsapp: '', email: '' })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Novo Cliente
        </button>
      </header>

      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const orderCount = getClientOrderCount(client.id);
          return (
            <div onClick={() => handleViewProfile(client)} key={client.id} className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-indigo-900/10">
              {/* Background badge for visual flair */}
              <div className="absolute -right-4 -top-4 opacity-[0.03] text-indigo-500 pointer-events-none">
                <ShoppingBag className="w-32 h-32" />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <User className="w-6 h-6" />
                </div>
                {/* Changed: Always visible, removed opacity classes */}
                <div className="flex gap-2 transition-opacity relative z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(client.id, client.name); }}
                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-100 mb-1">{client.name}</h3>

              <div className="flex items-center gap-2 mb-4">
                <span className="bg-indigo-600/20 text-indigo-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest flex items-center gap-1.5">
                  <ShoppingBag className="w-3 h-3" />
                  {orderCount} {orderCount === 1 ? 'Pedido' : 'Pedidos'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{client.whatsapp}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium line-clamp-1">{client.email}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ações Rápidas</span>
                <button onClick={() => handleViewProfile(client)} className="text-[10px] font-black uppercase text-indigo-400 hover:underline">Ver Histórico</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-3xl w-full max-w-lg shadow-2xl border border-slate-800 p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">{editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp</label>
                <input
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  value={editingClient.whatsapp}
                  onChange={(e) => setEditingClient({ ...editingClient, whatsapp: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                <input
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                />
              </div>
              <button onClick={handleSave} className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700">
                <Save className="w-5 h-5" /> Salvar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL - NEW */}
      {viewingClient && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="flex gap-6 items-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center text-white shadow-2xl shadow-indigo-900/50">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight">{viewingClient.name}</h2>
                  <div className="flex gap-4 mt-2 text-slate-400">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Phone className="w-3 h-3" /> {viewingClient.whatsapp}</span>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Mail className="w-3 h-3" /> {viewingClient.email}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingClient(null)} className="p-3 bg-slate-900 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="px-8 mt-8 grid grid-cols-3 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-1 relative overflow-hidden group">
                <div className="absolute right-0 top-0 opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform">
                  <Wallet className="w-24 h-24 text-indigo-500" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Investido</span>
                <span className="text-2xl font-black text-indigo-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getClientFinancials(viewingClient.id).totalSpent)}
                </span>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pedidos Totais</span>
                <span className="text-2xl font-black text-white">{getClientFinancials(viewingClient.id).totalOrders}</span>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Último Pedido</span>
                <span className="text-2xl font-black text-white">{getClientFinancials(viewingClient.id).lastOrderDate}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-8 mt-8 flex border-b border-slate-800 gap-8">
              <button
                onClick={() => setProfileTab('active')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${profileTab === 'active' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Pedidos Ativos ({activeOrders.length})
              </button>
              <button
                onClick={() => setProfileTab('history')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${profileTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Histórico ({historyOrders.length})
              </button>
              <button
                onClick={() => setProfileTab('catalog')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${profileTab === 'catalog' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Solicitações Web ({clientCatalogOrders.length})
              </button>
              <button
                onClick={() => setProfileTab('info')}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${profileTab === 'info' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Dados Cadastrais
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-950/30">
              {profileTab === 'active' && (
                <div className="space-y-3">
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-10 opacity-50 flex flex-col items-center">
                      <Clock className="w-12 h-12 mb-3 text-slate-600" />
                      <p className="text-slate-500 font-bold">Nenhum pedido ativo no momento.</p>
                    </div>
                  ) : activeOrders.map(order => (
                    <div key={order.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-indigo-500/50 transition-all">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-slate-200">#{order.orderNumber}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Criado em {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{order.items.length} Itens</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profileTab === 'history' && (
                <div className="space-y-3">
                  {historyOrders.length === 0 ? (
                    <div className="text-center py-10 opacity-50 flex flex-col items-center">
                      <ShoppingBag className="w-12 h-12 mb-3 text-slate-600" />
                      <p className="text-slate-500 font-bold">Histórico vazio.</p>
                    </div>
                  ) : historyOrders.map(order => (
                    <div key={order.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex justify-between items-center opacity-70 hover:opacity-100 transition-all">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-slate-200">#{order.orderNumber}</span>
                          <span className="text-[9px] font-black bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-900/50">
                            Finalizado
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profileTab === 'catalog' && (
                <div className="space-y-3">
                  {clientCatalogOrders.length === 0 ? (
                    <div className="text-center py-10 opacity-50 flex flex-col items-center">
                      <Globe className="w-12 h-12 mb-3 text-slate-600" />
                      <p className="text-slate-500 font-bold">Nenhuma solicitação web encontrada.</p>
                    </div>
                  ) : clientCatalogOrders.map((req: CatalogOrder) => (
                    <div key={req.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-sky-500/50 transition-all group">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-slate-200">WEB #{req.id.substring(0, 6).toUpperCase()}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}>
                            {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{new Date(req.createdAt).toLocaleDateString()} - {req.items.length} Itens</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-sky-400 transition-colors">Origem: Catálogo Online</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profileTab === 'info' && (
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nome do Cliente</span>
                    <p className="text-slate-200 font-bold">{viewingClient.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Documento (CPF/CNPJ)</span>
                    <p className="text-slate-200 font-bold">{viewingClient.document || 'Não informado'}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Endereço Completo</span>
                    <p className="text-slate-200 font-medium">{viewingClient.address || 'Endereço não cadastrado'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">WhatsApp</span>
                    <p className="text-slate-200 font-mono">{viewingClient.whatsapp}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Email</span>
                    <p className="text-slate-200 font-medium">{viewingClient.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 bg-[#0f172a] flex justify-between items-center">
              <button
                onClick={() => handleDelete(viewingClient.id, viewingClient.name)}
                className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" /> Excluir Cliente
              </button>
              <button
                onClick={() => handleEdit(viewingClient)}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Editar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
