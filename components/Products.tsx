import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Trash2, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { productService } from '../services/productService';
import { Product } from '../types';
import { FABRICS } from '../constants';

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await productService.getAll();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct || !editingProduct.name) return;

        try {
            if (editingProduct.id) {
                await productService.update(editingProduct.id, editingProduct);
                setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct } as Product : p));
            } else {
                const newProduct = await productService.create(editingProduct as any);
                setProducts(prev => [...prev, newProduct]);
            }
            setIsEditing(false);
            setEditingProduct(null);
        } catch (error) {
            console.error("Error saving product", error);
            alert("Erro ao salvar produto.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza? Isso pode afetar pedidos existentes.')) {
            try {
                await productService.delete(id);
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting product", error);
                alert("Erro ao excluir produto.");
            }
        }
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-slate-500 font-bold animate-pulse">Carregando produtos...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-3">
                        <Package className="w-8 h-8 text-indigo-500" />
                        Cadastro de Produtos
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 ml-1">
                        Registro Interno (Master Data)
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct({
                            name: '', sku: '', category: 'Dry-Fit', basePrice: 0, status: 'active',
                            imageUrl: 'https://via.placeholder.com/150'
                        });
                        setIsEditing(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Novo Produto
                </button>
            </header>

            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <form onSubmit={handleSave} className="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
                        <button type="button" onClick={() => setIsEditing(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>

                        <h3 className="text-2xl font-black text-white uppercase mb-8 flex items-center gap-3">
                            {editingProduct?.id ? <Edit2 className="w-6 h-6 text-indigo-500" /> : <Plus className="w-6 h-6 text-emerald-500" />}
                            {editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                                <input required value={editingProduct?.name} onChange={e => setEditingProduct({ ...editingProduct!, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-indigo-500" placeholder="Ex: Camiseta Básica" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU (Código)</label>
                                <input required value={editingProduct?.sku} onChange={e => setEditingProduct({ ...editingProduct!, sku: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-indigo-500" placeholder="PROD-001" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Base (R$)</label>
                                <input type="number" required value={editingProduct?.basePrice} onChange={e => setEditingProduct({ ...editingProduct!, basePrice: parseFloat(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-indigo-500" placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custo (R$) (Opcional)</label>
                                <input type="number" value={editingProduct?.costPrice || ''} onChange={e => setEditingProduct({ ...editingProduct!, costPrice: parseFloat(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-300 outline-none focus:border-indigo-500" placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria (Tecido Padrão)</label>
                                <select value={editingProduct?.category} onChange={e => setEditingProduct({ ...editingProduct!, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-300 outline-none focus:border-indigo-500">
                                    {FABRICS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Interno</label>
                                <select value={editingProduct?.status} onChange={e => setEditingProduct({ ...editingProduct!, status: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-300 outline-none focus:border-indigo-500">
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold uppercase text-xs text-slate-500 hover:text-white">Cancelar</button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 rounded-xl font-black uppercase text-xs text-white shadow-lg hover:bg-indigo-500 flex items-center gap-2">
                                <Save className="w-4 h-4" /> Salvar Produto
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 min-h-[500px]">
                <div className="flex items-center gap-4 mb-6 bg-slate-950/50 p-2 rounded-2xl border border-slate-800/50 w-full md:w-96">
                    <Search className="w-5 h-5 text-slate-500 ml-2" />
                    <input
                        placeholder="Buscar por nome ou SKU..."
                        className="bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-600 font-bold uppercase text-xs w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-4 pl-6">SKU</th>
                                <th className="p-4">Produto</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4 text-center">Preço Base</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right pr-6">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                            {filtered.map(product => (
                                <tr key={product.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4 pl-6 font-mono text-xs text-slate-500 font-bold">{product.sku}</td>
                                    <td className="p-4 font-bold text-slate-200">{product.name}</td>
                                    <td className="p-4 text-xs font-bold text-slate-500 uppercase">{product.category}</td>
                                    <td className="p-4 text-center font-bold text-emerald-400">R$ {product.basePrice.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${product.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingProduct(product); setIsEditing(true); }} className="p-2 hover:bg-indigo-500/20 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Products;
