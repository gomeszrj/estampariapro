import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Trash2, Edit2, Save, X, AlertCircle, ChevronRight, Image as ImageIcon, Check } from 'lucide-react';
import { productService } from '../services/productService';
import { Product } from '../types';
import { FABRICS, GRADES } from '../constants';

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI States
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="flex flex-col gap-8 h-[calc(100vh-80px)]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                            <Package className="w-5 h-5 text-indigo-500" />
                        </div>
                        Gerenciamento de Produtos
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 ml-1">
                        Catálogo interno e precificação
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            placeholder="Buscar produtos..."
                            className="bg-[#0f172a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:bg-[#1e293b] transition-all w-64 shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingProduct({
                                name: '', sku: '', category: 'Dry-Fit', basePrice: 0, status: 'active',
                                imageUrl: '', allowedGrades: {}, measurements: {}
                            });
                            setIsEditing(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white pl-4 pr-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Novo Produto
                    </button>
                </div>
            </div>

            {/* List Section - Now cleaner */}
            <div className="flex-1 bg-[#0f172a] border border-slate-800/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1e293b]/50 text-slate-400 text-xs font-medium uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-4 pl-6 w-20 border-b border-slate-800">Img</th>
                                <th className="p-4 border-b border-slate-800">Identificação</th>
                                <th className="p-4 border-b border-slate-800">Categoria</th>
                                <th className="p-4 text-center border-b border-slate-800">Preço</th>
                                <th className="p-4 text-center border-b border-slate-800">Grade</th>
                                <th className="p-4 text-center border-b border-slate-800">Status</th>
                                <th className="p-4 text-right pr-6 border-b border-slate-800"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filtered.map(product => (
                                <tr key={product.id} className="hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => { setEditingProduct(product); setIsEditing(true); }}>
                                    <td className="p-4 pl-6">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 overflow-hidden flex items-center justify-center">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-slate-600 opacity-50" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium text-sm">{product.name}</span>
                                            <span className="text-xs text-slate-500 font-mono tracking-wide mt-0.5">{product.sku}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-semibold text-emerald-400 text-sm">R$ {product.basePrice.toFixed(2)}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {Object.keys(product.allowedGrades || {}).length > 0 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                                                {Object.keys(product.allowedGrades || {}).length}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-emerald-500/5 text-emerald-500 border border-emerald-500/10' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <ChevronRight className="w-4 h-4 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-800/60 bg-[#1e293b]/30 text-xs text-slate-500 flex justify-between items-center">
                    <span>Mostrando {filtered.length} produtos</span>
                    <span>Clique em um produto para editar</span>
                </div>
            </div>

            {/* Editing Drawer / Side Panel */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsEditing(false)} />
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border-l border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/50">
                            <div>
                                <h3 className="text-lg font-semibold text-white tracking-tight">
                                    {editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}
                                </h3>
                                <p className="text-slate-500 text-xs mt-0.5">Preencha os dados técnicos e visuais</p>
                            </div>
                            <div className="flex gap-2">
                                {editingProduct?.id && (
                                    <button
                                        onClick={() => handleDelete(editingProduct.id!)}
                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            {/* Product Image */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visual</label>
                                <div className="flex gap-4">
                                    <div className="w-32 h-32 shrink-0 bg-[#020617] rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden relative group">
                                        {editingProduct?.imageUrl ? (
                                            <>
                                                <img src={editingProduct.imageUrl} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setEditingProduct({ ...editingProduct!, imageUrl: '' })}>
                                                    <Trash2 className="w-5 h-5 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-slate-700" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            placeholder="URL da Imagem (Ex: https://...)"
                                            className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                                            value={editingProduct?.imageUrl || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct!, imageUrl: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Cole o link direto da imagem. Recomendamos imagens quadradas com fundo transparente ou sólido.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informações Principais</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nome do Produto</label>
                                        <input
                                            required
                                            value={editingProduct?.name}
                                            onChange={e => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                                            className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                            placeholder="Ex: Camiseta Dry Fit Básica"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">SKU / Ref</label>
                                        <input
                                            required
                                            value={editingProduct?.sku}
                                            onChange={e => setEditingProduct({ ...editingProduct!, sku: e.target.value })}
                                            className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono outline-none focus:border-indigo-500/50 transition-all uppercase"
                                            placeholder="PROD-01"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Status</label>
                                        <select
                                            value={editingProduct?.status}
                                            onChange={e => setEditingProduct({ ...editingProduct!, status: e.target.value as any })}
                                            className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                        >
                                            <option value="active">Ativo (Visível)</option>
                                            <option value="inactive">Inativo (Oculto)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Preço de Venda (R$)</label>
                                        <input
                                            type="number"
                                            required
                                            value={editingProduct?.basePrice}
                                            onChange={e => setEditingProduct({ ...editingProduct!, basePrice: parseFloat(e.target.value) })}
                                            className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-400 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Categoria</label>
                                        <select
                                            value={editingProduct?.category}
                                            onChange={e => setEditingProduct({ ...editingProduct!, category: e.target.value })}
                                            className="w-full bg-[#1e293b] border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-all"
                                        >
                                            {FABRICS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Grades & Sizes */}
                            <div className="space-y-4 pt-4 border-t border-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> Grade de Tamanhos
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {GRADES.map((grade) => {
                                        const currentAllowed = editingProduct?.allowedGrades || {};
                                        const isActive = !!currentAllowed[grade.label];

                                        return (
                                            <div
                                                key={grade.label}
                                                onClick={() => {
                                                    const newAllowed = { ...currentAllowed };
                                                    if (isActive) delete newAllowed[grade.label];
                                                    else newAllowed[grade.label] = grade.sizes;
                                                    setEditingProduct({ ...editingProduct!, allowedGrades: newAllowed });
                                                }}
                                                className={`
                                                    cursor-pointer rounded-xl border p-3 flex flex-col gap-2 transition-all
                                                    ${isActive
                                                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-sm'
                                                        : 'bg-[#1e293b]/50 border-slate-700/50 hover:bg-[#1e293b] hover:border-slate-600'}
                                                `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold uppercase ${isActive ? 'text-indigo-300' : 'text-slate-400'}`}>{grade.label}</span>
                                                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {grade.sizes.slice(0, 4).map(s => (
                                                        <span key={s} className="text-[10px] bg-black/20 px-1 rounded text-slate-400">{s}</span>
                                                    ))}
                                                    {grade.sizes.length > 4 && <span className="text-[10px] text-slate-500">...</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </form>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-slate-800 bg-[#1e293b]/50 flex justify-end gap-3 filter backdrop-blur-sm sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave as any}
                                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
