import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Trash2, Edit2, Save, X, AlertCircle, Check, Image as ImageIcon, Ruler, Eye, EyeOff } from 'lucide-react';
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
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    // Filter Logic
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    // --- Actions ---

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingProduct) {
            setIsProcessingImage(true);
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 800; // Standardize size
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, size, size);

                        // Fit "Contain" logic
                        const scale = Math.min(size / img.width, size / img.height);
                        const w = img.width * scale;
                        const h = img.height * scale;
                        const x = (size - w) / 2;
                        const y = (size - h) / 2;

                        ctx.drawImage(img, x, y, w, h);
                        const url = canvas.toDataURL('image/jpeg', 0.9);
                        setEditingProduct(prev => prev ? ({ ...prev, imageUrl: url }) : null);
                        setIsProcessingImage(false);
                    }
                };
                img.src = ev.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Render Helpers ---

    const renderGradeMatrix = () => {
        if (!editingProduct) return null;

        const currentAllowed = editingProduct.allowedGrades || {};
        const currentMeasurements = editingProduct.measurements || {};

        const toggleSize = (groupLabel: string, size: string) => {
            const newAllowed = { ...currentAllowed };
            const currentGroupSizes = newAllowed[groupLabel] || [];

            if (currentGroupSizes.includes(size)) {
                // Remove
                newAllowed[groupLabel] = currentGroupSizes.filter(s => s !== size);
                if (newAllowed[groupLabel].length === 0) delete newAllowed[groupLabel];
            } else {
                // Add
                newAllowed[groupLabel] = [...currentGroupSizes, size];
            }
            setEditingProduct({ ...editingProduct, allowedGrades: newAllowed });
        };

        const updateMeasurement = (e: React.ChangeEvent<HTMLInputElement>, groupLabel: string, size: string, dim: 'h' | 'w') => {
            const key = `${groupLabel}-${size}`; // Unique Key for measurement e.g. "Masculino-P"
            const newMeasurements = { ...currentMeasurements };
            const val = e.target.value;

            if (!newMeasurements[key]) newMeasurements[key] = { width: '', height: '' };
            if (dim === 'w') newMeasurements[key].width = val;
            else newMeasurements[key].height = val;

            setEditingProduct({ ...editingProduct, measurements: newMeasurements });
        };

        return (
            <div className="space-y-6">
                {GRADES.map(group => (
                    <div key={group.label} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{group.label}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {group.sizes.map(size => {
                                const isActive = currentAllowed[group.label]?.includes(size);
                                const measurementKey = `${group.label}-${size}`;
                                const m = currentMeasurements[measurementKey] || { width: '', height: '' };

                                return (
                                    <div key={size} className={`
                                        relative rounded-xl border p-3 transition-all flex flex-col gap-2
                                        ${isActive ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-[#1e293b] border-slate-700/50 opacity-60 hover:opacity-100'}
                                    `}>
                                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSize(group.label, size)}>
                                            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{size}</span>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isActive ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                                {isActive && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>

                                        {isActive && (
                                            <div className="mt-2 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                                                <div>
                                                    <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Larg (cm)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={m.width}
                                                        onChange={(e) => updateMeasurement(e, group.label, size, 'w')}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1 text-xs text-center text-white focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Alt (cm)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={m.height}
                                                        onChange={(e) => updateMeasurement(e, group.label, size, 'h')}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1 text-xs text-center text-white focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-6 md:p-10 min-h-screen bg-[#020617] text-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                        <Package className="w-8 h-8 text-indigo-500" />
                        Catálogo de Produtos
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gerencie produtos, estoque e vitrine pública.</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-[#0f172a] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingProduct({
                                name: '', sku: '', category: 'Dry-Fit', basePrice: 0, costPrice: 0, status: 'active', published: true,
                                imageUrl: '', allowedGrades: {}, measurements: {}
                            });
                            setIsEditing(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Novo Produto
                    </button>
                </div>
            </div>

            {/* Grid View (Back to Basics) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filtered.map(product => (
                    <div
                        key={product.id}
                        onClick={() => { setEditingProduct(product); setIsEditing(true); }}
                        className="group bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
                    >
                        {/* Image */}
                        <div className="aspect-[4/5] bg-slate-900 relative overflow-hidden">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                    <ImageIcon className="w-12 h-12 opacity-20" />
                                </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                                {!product.published && (
                                    <span className="bg-rose-500/90 backdrop-blur text-white text-[9px] font-black uppercase px-2 py-1 rounded">Oculto</span>
                                )}
                                {Object.keys(product.allowedGrades || {}).length === 0 && (
                                    <span className="bg-amber-500/90 backdrop-blur text-black text-[9px] font-black uppercase px-2 py-1 rounded flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Sem Grade
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{product.category}</span>
                            <h3 className="text-sm font-bold text-white leading-tight mb-3 line-clamp-2 uppercase">{product.name}</h3>
                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-800/50">
                                <span className="text-indigo-400 font-black text-lg">R$ {product.basePrice.toFixed(2)}</span>
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                    <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Unified Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0f172a] w-full max-w-4xl h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/50">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                    {editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}
                                </h2>
                                <p className="text-slate-400 text-xs font-medium">Configure detalhes, imagem e grade de tamanhos.</p>
                            </div>
                            <div className="flex gap-2">
                                {editingProduct?.id && (
                                    <button
                                        onClick={() => handleDelete(editingProduct.id!)}
                                        className="p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                                        title="Excluir Produto"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => setIsEditing(false)} className="p-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <form className="p-8 space-y-10">

                                {/* 1. Basic Info & Image */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    {/* Image Upload Column */}
                                    <div className="md:col-span-4 space-y-4">
                                        <div className="aspect-[4/5] bg-[#020617] rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-all relative group overflow-hidden flex items-center justify-center">
                                            {isProcessingImage ? (
                                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            ) : editingProduct?.imageUrl ? (
                                                <>
                                                    <img src={editingProduct.imageUrl} className="w-full h-full object-contain p-2" />
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg font-bold text-xs uppercase hover:scale-105 transition-transform">
                                                            Alterar Foto
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors">
                                                    <ImageIcon className="w-10 h-10" />
                                                    <span className="text-xs font-bold uppercase">Upload Imagem</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                            )}
                                        </div>
                                        <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Visibilidade</span>
                                                <div
                                                    onClick={() => setEditingProduct({ ...editingProduct, published: !editingProduct?.published })}
                                                    className={`cursor-pointer px-3 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-2 ${editingProduct?.published ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                                                >
                                                    {editingProduct?.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {editingProduct?.published ? 'Visível na Loja' : 'Oculto na Loja'}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                Define se o produto aparece para clientes no link público.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Fields Column */}
                                    <div className="md:col-span-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome do Produto</label>
                                                <input
                                                    required
                                                    value={editingProduct?.name}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                                                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                                    placeholder="Ex: Camiseta Dry-Fit Pro"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Categoria</label>
                                                <select
                                                    value={editingProduct?.category}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, category: e.target.value })}
                                                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                                >
                                                    {FABRICS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                                    <option value="Outro">Outro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">SKU / Ref</label>
                                                <input
                                                    value={editingProduct?.sku}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, sku: e.target.value.toUpperCase() })}
                                                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono uppercase"
                                                    placeholder="PROD-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Preço Venda (R$)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct?.basePrice}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, basePrice: parseFloat(e.target.value) })}
                                                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl px-4 py-3 text-2xl font-black text-emerald-400 focus:border-emerald-500 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Custo Prod. (R$)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct?.costPrice || ''}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, costPrice: parseFloat(e.target.value) })}
                                                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl px-4 py-3 text-2xl font-black text-slate-300 focus:border-indigo-500 outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {editingProduct?.basePrice && editingProduct?.costPrice && (
                                                <div className="col-span-2 text-right -mt-2">
                                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded inline-block">
                                                        Lucro Estimado: R$ {(editingProduct.basePrice - editingProduct.costPrice).toFixed(2)} ({((editingProduct.basePrice - editingProduct.costPrice) / editingProduct.basePrice * 100).toFixed(0)}%)
                                                    </p>
                                                </div>
                                            )}
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Descrição Pública</label>
                                                <textarea
                                                    value={editingProduct?.description || ''}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, description: e.target.value })}
                                                    className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none resize-none h-24"
                                                    placeholder="Descrição que aparece para o cliente na loja..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Grade Matrix & Measurements */}
                                <div className="border-t border-slate-800 pt-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <Ruler className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Grade & Medidas</h3>
                                            <p className="text-xs text-slate-500">Selecione os tamanhos disponíveis e defina as medidas (opcional).</p>
                                        </div>
                                    </div>

                                    {/* The Matrix */}
                                    {renderGradeMatrix()}
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex justify-end gap-4">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
                                <Save className="w-4 h-4" /> Salvar Alterações
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
