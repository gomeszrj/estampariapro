import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, Truck, Phone, X, Save, DollarSign } from 'lucide-react';
import { notify as toast } from './ui/toast';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  
  // States for adding a new product cost
  const [selectedProductId, setSelectedProductId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    whatsapp: '',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      const data = await productService.getAll();
      setAllProducts(data);
    } catch (e) { console.error('Erro ao buscar produtos:', e); }
  };

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        whatsapp: supplier.whatsapp || '',
        notes: supplier.notes || ''
      });
      // Load supplier products
      try {
        const sps = await supplierService.getSupplierProducts(supplier.id);
        setSupplierProducts(sps);
      } catch (e) { console.error(e); }
    } else {
      setEditingSupplier(null);
      setSupplierProducts([]);
      setFormData({ name: '', contact_name: '', whatsapp: '', notes: '' });
    }
    setSelectedProductId('');
    setCostPrice('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('O nome do fornecedor é obrigatório');
      return;
    }

    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, formData);
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        await supplierService.create(formData);
        toast.success('Fornecedor criado com sucesso');
      }
      handleCloseModal();
      loadSuppliers();
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleAddSupplierProduct = async () => {
    if (!editingSupplier) return;
    if (!selectedProductId || !costPrice) {
      toast.error('Selecione um produto e informe o custo');
      return;
    }
    try {
      await supplierService.saveSupplierProduct({
        supplier_id: editingSupplier.id,
        product_id: selectedProductId,
        cost_price: Number(costPrice)
      });
      toast.success('Custo adicionado!');
      // Reload
      const sps = await supplierService.getSupplierProducts(editingSupplier.id);
      setSupplierProducts(sps);
      setSelectedProductId('');
      setCostPrice('');
    } catch (e) {
      toast.error('Erro ao adicionar custo');
    }
  };

  const handleDeleteSupplierProduct = async (id: string) => {
    if (!editingSupplier) return;
    try {
      await supplierService.deleteSupplierProduct(id);
      toast.success('Custo removido!');
      const sps = await supplierService.getSupplierProducts(editingSupplier.id);
      setSupplierProducts(sps);
    } catch (e) {
      toast.error('Erro ao remover custo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor? Produtos vinculados a ele poderão ser afetados.')) {
      return;
    }
    try {
      await supplierService.delete(id);
      toast.success('Fornecedor excluído');
      loadSuppliers();
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-purple-500" />
            Fornecedores
          </h1>
          <p className="text-slate-400 mt-1">Gerencie os fabricantes e fornecedores dos seus produtos</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Fornecedor
        </button>
      </div>

      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-slate-400">Clique em "Novo Fornecedor" para começar a cadastrar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map(supplier => (
                <div key={supplier.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white leading-tight">{supplier.name}</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(supplier)}
                        className="text-slate-400 hover:text-white p-1 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {supplier.contact_name && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-slate-500">Contato:</span> {supplier.contact_name}
                      </div>
                    )}
                    {supplier.whatsapp && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> 
                        {supplier.whatsapp}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl shadow-2xl w-full max-w-md border border-[#1e293b] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#1e293b]">
              <h2 className="text-xl font-bold text-white">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Empresa / Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Pessoa de Contato</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
                    placeholder="Detalhes adicionais, prazos médios, etc."
                  />
                </div>
              </div>
            </form>
            
            {editingSupplier ? (
              <div className="p-6 border-t border-[#1e293b] bg-[#0b1121]">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Tabela de Custos (Produtos)</h3>
                <div className="flex gap-2 mb-4">
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Selecione um produto...</option>
                    {allProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number" step="0.01" min="0"
                    placeholder="R$ Custo"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    className="w-24 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                  <button onClick={handleAddSupplierProduct} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {supplierProducts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">Nenhum custo cadastrado para este fornecedor.</p>
                  ) : (
                    supplierProducts.map(sp => (
                      <div key={sp.id} className="flex justify-between items-center bg-[#1e293b] border border-[#334155] p-2 rounded-lg">
                        <span className="text-sm text-slate-300 truncate pr-2">{sp.products?.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-emerald-400">R$ {Number(sp.cost_price).toFixed(2)}</span>
                          <button onClick={() => handleDeleteSupplierProduct(sp.id)} className="text-slate-500 hover:text-rose-500 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 bg-[#0b1121] border-t border-[#1e293b] text-xs text-slate-400 text-center">
                Salve o fornecedor primeiro para poder vincular produtos e custos.
              </div>
            )}
            
            <div className="p-6 border-t border-[#1e293b] flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
