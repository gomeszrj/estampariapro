
import React, { useState } from 'react';
import { Search, UserPlus, Edit2, Phone, Mail, Trash2, X, Save, User, ShoppingBag } from 'lucide-react';
import { Client, Order } from '../types.ts';
import { clientService } from '../services/clientService.ts';

interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  orders: Order[];
}

const Clients: React.FC<ClientsProps> = ({ clients, setClients, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientOrderCount = (clientId: string) => {
    return orders.filter(o => o.clientId === clientId).length;
  };

  const handleEdit = (client: any) => setEditingClient({ ...client });
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

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este cliente?')) {
      try {
        await clientService.delete(id);
        window.dispatchEvent(new Event('refreshData'));
      } catch (e) {
        console.error("Error deleting client:", e);
        alert("Erro ao excluir cliente.");
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
            <div key={client.id} className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden">
              {/* Background badge for visual flair */}
              <div className="absolute -right-4 -top-4 opacity-[0.03] text-indigo-500">
                <ShoppingBag className="w-32 h-32" />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(client)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700">
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
                <button className="text-[10px] font-black uppercase text-indigo-400 hover:underline">Ver Histórico</button>
              </div>
            </div>
          );
        })}
      </div>

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
    </div>
  );
};

export default Clients;
