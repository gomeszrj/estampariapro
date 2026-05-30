import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Trash2, Edit2, Save, X, AlertCircle, Check, Image as ImageIcon, 
  Ruler, Eye, EyeOff, Download, Folder, LayoutGrid, List, MoreVertical, ChevronLeft, ChevronRight,
  TrendingUp, Box, XCircle
} from 'lucide-react';
import { productService } from '../services/productService';
import { supplierService } from '../services/supplierService';
import { inventoryService } from '../services/inventoryService';
import { orderService } from '../services/orderService';
import { Product, Supplier, ProductSupplier } from '../types';
import { FABRICS, GRADES } from '../constants';
import { notify } from './ui/toast';
import { ConfirmModal } from './ui/ConfirmModal';

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas as categorias');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const [inProductionCount, setInProductionCount] = useState(0);
    const [totalStock, setTotalStock] = useState(0);

    // UI States
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'detalhes' | 'variacoes' | 'estoque' | 'historico'>('detalhes');
    
    // Modal States
    const [isEditing, setIsEditing] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);

    // Filter Logic
    const filtered = React.useMemo(() => {
        const searchLower = (searchTerm || '').toLowerCase();
        const safeProducts = Array.isArray(products) ? products : [];
        return safeProducts.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchLower) || (p.sku || '').toLowerCase().includes(searchLower);
            const matchesCat = categoryFilter === 'Todas as categorias' || p.category === categoryFilter;
            const matchesStatus = statusFilter === 'Todos' || (statusFilter === 'Ativos' ? p.published : !p.published);
            return matchesSearch && matchesCat && matchesStatus;
        });
    }, [products, searchTerm, categoryFilter, statusFilter]);

    // Derived KPIs
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.published).length;
    const disabledProducts = totalProducts - activeProducts;

    const loadProducts = async () => {
        setLoading(true);
        try {
            const [data, suppliersData, inventoryData, ordersData] = await Promise.all([
                productService.getAll(),
                supplierService.getAll(),
                inventoryService.getAll().catch(() => []),
                orderService.getAll().catch(() => [])
            ]);
            
            // For each product, we could load its suppliers, but for performance 
            // we will load it when selecting if needed, or just rely on what we fetch here.
            // Since we didn't add it to getAll() we fetch it on select.
            
            setProducts(data);
            setAllSuppliers(suppliersData);
            setTotalStock(inventoryData.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0));
            setInProductionCount(ordersData.filter((o: any) => o.status === 'IN_PRODUCTION' || o.status === 'SUBLIMATION').length);

            if (data.length > 0) {
                handleSelectProduct(data[0]);
            }
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Keep selected product in sync
    useEffect(() => {
        if (selectedProduct) {
            const updated = products.find(p => p.id === selectedProduct.id);
            if (updated && updated !== selectedProduct) {
                // Ensure we don't lose the suppliers if we update the product
                handleSelectProduct(updated);
            }
        }
    }, [products]);

    const handleSelectProduct = async (product: Product) => {
        try {
            const suppliers = await productService.getProductSuppliers(product.id);
            setSelectedProduct({ ...product, suppliers });
        } catch (err) {
            setSelectedProduct(product);
        }
    };

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
                setSelectedProduct(newProduct);
            }
            setIsEditing(false);
            setEditingProduct(null);
            notify.success('Produto salvo com sucesso!');
        } catch (error) {
            console.error("Error saving product", error);
            notify.error('Erro ao salvar produto.');
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteProductId(id);
    };

    const doDeleteProduct = async (id: string) => {
        try {
            await productService.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            setIsEditing(false);
            if (selectedProduct?.id === id) {
                setSelectedProduct(null);
            }
            notify.success('Produto excluído.');
        } catch (error) {
            console.error("Error deleting product", error);
            notify.error('Erro ao excluir produto.');
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
                newAllowed[groupLabel] = currentGroupSizes.filter(s => s !== size);
                if (newAllowed[groupLabel].length === 0) delete newAllowed[groupLabel];
            } else {
                newAllowed[groupLabel] = [...currentGroupSizes, size];
            }
            setEditingProduct({ ...editingProduct, allowedGrades: newAllowed });
        };

        const updateMeasurement = (e: React.ChangeEvent<HTMLInputElement>, groupLabel: string, size: string, dim: 'h' | 'w') => {
            const key = `${groupLabel}-${size}`;
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
                        <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
                            <span className="text-xs font-black text-white uppercase tracking-widest">{group.label}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {group.sizes.map(size => {
                                const isActive = currentAllowed[group.label]?.includes(size);
                                const measurementKey = `${group.label}-${size}`;
                                const m = currentMeasurements[measurementKey] || { width: '', height: '' };

                                return (
                                    <div key={size} className={`
                                        relative rounded-xl border p-3 transition-all flex flex-col gap-2
                                        ${isActive ? 'bg-white/5 border-white/20' : 'bg-[#0f172a] border-[#1e293b] opacity-60 hover:opacity-100'}
                                    `}>
                                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSize(group.label, size)}>
                                            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{size}</span>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isActive ? 'bg-white border-white' : 'border-slate-600'}`}>
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
                                                        className="w-full bg-[#0b1221] border border-[#1e293b] rounded px-1 py-1 text-xs text-center text-white focus:border-slate-600 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Alt (cm)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={m.height}
                                                        onChange={(e) => updateMeasurement(e, group.label, size, 'h')}
                                                        className="w-full bg-[#0b1221] border border-[#1e293b] rounded px-1 py-1 text-xs text-center text-white focus:border-slate-600 outline-none"
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
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 relative pb-20">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Produtos</h2>
                    <p className="text-slate-400 text-xs font-medium mt-1">Cadastre e gerencie seus produtos e variações.</p>
                </div>
                <div className="flex gap-4">

                    <button
                        onClick={() => {
                            setEditingProduct({
                                name: '', sku: '', category: 'Dry-Fit', basePrice: 0, costPrice: 0, status: 'active', published: true,
                                imageUrl: '', allowedGrades: {}, measurements: {}
                            });
                            setIsEditing(true);
                        }}
                        className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Novo Produto
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] flex flex-col justify-between shadow-lg">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 w-fit mb-3"><Package className="w-5 h-5 text-purple-400" /></div>
                    <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total de Produtos</h3>
                    <p className="text-2xl font-black text-white">{totalProducts}</p>
                    <div className="h-0.5 bg-purple-500 w-full mt-2 rounded"></div>
                </div>
                <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] flex flex-col justify-between shadow-lg">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 w-fit mb-3"><Box className="w-5 h-5 text-emerald-400" /></div>
                    <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Produtos Ativos</h3>
                    <p className="text-2xl font-black text-white">{activeProducts}</p>
                    <div className="h-0.5 bg-emerald-500 w-full mt-2 rounded"></div>
                </div>
                <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] flex flex-col justify-between shadow-lg">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 w-fit mb-3"><TrendingUp className="w-5 h-5 text-orange-400" /></div>
                    <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Em Produção</h3>
                    <p className="text-2xl font-black text-white">{inProductionCount}</p>
                    <div className="h-0.5 bg-orange-500 w-full mt-2 rounded"></div>
                </div>
                <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] flex flex-col justify-between shadow-lg">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 w-fit mb-3"><XCircle className="w-5 h-5 text-rose-400" /></div>
                    <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Desativados</h3>
                    <p className="text-2xl font-black text-white">{disabledProducts}</p>
                    <div className="h-0.5 bg-rose-500 w-full mt-2 rounded"></div>
                </div>
                <div className="bg-[#151B2B] p-5 rounded-2xl border border-[#1e293b] flex flex-col justify-between shadow-lg">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 w-fit mb-3"><Package className="w-5 h-5 text-blue-400" /></div>
                    <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Estoque Total</h3>
                    <p className="text-2xl font-black text-white">{totalStock.toLocaleString('pt-BR')} <span className="text-sm font-bold text-slate-500">un.</span></p>
                    <div className="h-0.5 bg-blue-500 w-full mt-2 rounded"></div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative group flex-1 w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        placeholder="Buscar por nome, código ou categoria..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white focus:border-slate-500 outline-none transition-all shadow-lg"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <select 
                        value={categoryFilter} 
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-xs font-bold text-slate-300 outline-none shadow-lg cursor-pointer min-w-max"
                    >
                        <option value="Todas as categorias">Todas as categorias</option>
                        {FABRICS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                        <option value="Outro">Outro</option>
                    </select>
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-xs font-bold text-slate-300 outline-none shadow-lg cursor-pointer min-w-max"
                    >
                        <option value="Todos">Status: Todos</option>
                        <option value="Ativos">Status: Ativos</option>
                        <option value="Desativados">Status: Desativados</option>
                    </select>
                    <select className="bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-xs font-bold text-slate-300 outline-none shadow-lg cursor-pointer min-w-max">
                        <option>Ordenar: Mais recentes</option>
                        <option>A-Z</option>
                        <option>Preço Crescente</option>
                    </select>
                    <div className="flex items-center gap-1 bg-[#151B2B] border border-[#1e293b] rounded-xl p-1 shadow-lg">
                        <button className="p-2 bg-[#1e293b] rounded-lg text-white"><LayoutGrid className="w-4 h-4" /></button>
                        <button className="p-2 text-slate-500 hover:text-white transition-colors"><List className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* Main Content (Master-Detail) */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Master: Grid */}
                <div className="flex-1 flex flex-col">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 h-[calc(100vh-420px)] min-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filtered.map(product => {
                            const isSelected = selectedProduct?.id === product.id;
                            const productStock = 0; // Integration with physical stock pending
                            return (
                                <div
                                    key={product.id}
                                    onClick={() => handleSelectProduct(product)}
                                    className={`group bg-[#151B2B] rounded-2xl border transition-all duration-300 flex overflow-hidden cursor-pointer h-36 ${isSelected ? 'border-[#6366F1] shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-[#1e293b] hover:border-slate-600 shadow-lg'}`}
                                >
                                    {/* Left Image */}
                                    <div className="w-28 bg-[#0b1221] relative flex-shrink-0">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <ImageIcon className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Content */}
                                    <div className="p-4 flex flex-col flex-1 relative min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xs font-black text-white leading-tight truncate pr-4">{product.name}</h3>
                                            <MoreVertical className="w-4 h-4 text-slate-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setIsEditing(true); }} />
                                        </div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="bg-[#1e293b] text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase">{product.sku || 'S/N'}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-[10px] font-bold text-slate-500 block truncate">{product.category}</span>
                                        </div>
                                        <div className="mt-auto pt-2 flex items-end justify-between">
                                            <span className="text-sm font-black text-white">R$ {product.basePrice.toFixed(2)}</span>
                                            <div className="text-right">
                                                <span className="block text-[8px] font-bold text-slate-500 uppercase">Estoque</span>
                                                <span className="text-[10px] font-black text-emerald-500">{productStock} un.</span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-8">
                                            {product.published ? (
                                                <span className="text-[8px] font-black uppercase text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">Ativo</span>
                                            ) : (
                                                <span className="text-[8px] font-black uppercase text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded">Inativo</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    
                    {/* Pagination Mock */}
                    <div className="mt-6 flex justify-between items-center text-slate-400 text-xs font-bold">
                        <span>Mostrando 1 a {Math.min(12, filtered.length)} de {filtered.length} produtos</span>
                        <div className="flex gap-1">
                            <button className="w-8 h-8 rounded-lg border border-[#1e293b] flex items-center justify-center hover:bg-[#151B2B]"><ChevronLeft className="w-4 h-4" /></button>
                            <button className="w-8 h-8 rounded-lg bg-[#6366F1] text-white flex items-center justify-center">1</button>
                            <button className="w-8 h-8 rounded-lg border border-[#1e293b] flex items-center justify-center hover:bg-[#151B2B]">2</button>
                            <button className="w-8 h-8 rounded-lg border border-[#1e293b] flex items-center justify-center hover:bg-[#151B2B]">3</button>
                            <span className="w-8 h-8 flex items-center justify-center">...</span>
                            <button className="w-8 h-8 rounded-lg border border-[#1e293b] flex items-center justify-center hover:bg-[#151B2B]">11</button>
                            <button className="w-8 h-8 rounded-lg border border-[#1e293b] flex items-center justify-center hover:bg-[#151B2B]"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                {/* Detail: Sidebar */}
                {selectedProduct && (
                    <div className="w-full lg:w-[400px] flex-shrink-0 bg-[#151B2B] rounded-2xl border border-[#1e293b] shadow-lg flex flex-col overflow-hidden h-[calc(100vh-360px)] min-h-[500px]">
                        {/* Top Large Image */}
                        <div className="h-56 bg-[#0b1221] relative flex-shrink-0">
                            {selectedProduct.imageUrl ? (
                                <img src={selectedProduct.imageUrl} className="w-full h-full object-contain p-4" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-16 h-16 opacity-20" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                {selectedProduct.published ? (
                                    <span className="text-[9px] font-black uppercase text-emerald-400 border border-emerald-500/30 bg-[#151B2B]/80 backdrop-blur px-2 py-1 rounded">Ativo</span>
                                ) : (
                                    <span className="text-[9px] font-black uppercase text-rose-400 border border-rose-500/30 bg-[#151B2B]/80 backdrop-blur px-2 py-1 rounded">Inativo</span>
                                )}
                            </div>
                        </div>

                        {/* Product Header Info */}
                        <div className="p-5 pb-0">
                            <h2 className="text-xl font-black text-white leading-tight">{selectedProduct.name}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-[#1e293b] text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{selectedProduct.sku || 'S/N'}</span>
                                <span className="text-[11px] font-bold text-slate-500">{selectedProduct.category}</span>
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                                <span className="text-2xl font-black text-white">R$ {selectedProduct.basePrice.toFixed(2)}</span>
                                <div className="text-right">
                                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Estoque Atual</span>
                                    <span className="text-xs font-black text-emerald-500">120 unidades</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-5 mt-6 border-b border-[#1e293b]">
                            {['detalhes', 'variações', 'fornecedores', 'estoque', 'histórico'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setSidebarTab(tab as any)}
                                    className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-widest transition-colors ${sidebarTab === tab || (tab === 'variações' && sidebarTab === 'variacoes') || (tab === 'histórico' && sidebarTab === 'historico') ? 'text-white border-b-2 border-[#6366F1]' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                            {sidebarTab === 'detalhes' && (
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="w-1/3 text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2"><Box className="w-3 h-3" /> Descrição</div>
                                        <div className="w-2/3 text-xs text-slate-300">{selectedProduct.description || 'Nenhuma descrição fornecida.'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2"><Box className="w-3 h-3" /> Categoria</div>
                                        <div className="w-2/3 text-xs text-slate-300">{selectedProduct.category}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2"><Box className="w-3 h-3" /> Custo Base</div>
                                        <div className="w-2/3 text-xs text-slate-300">R$ {selectedProduct.costPrice?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2"><Box className="w-3 h-3" /> Fornecedor</div>
                                        <div className="w-2/3 text-xs text-slate-300">
                                            {selectedProduct.suppliers?.find(s => s.is_default)?.supplier?.name || 'Não definido'}
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2"><Box className="w-3 h-3" /> Cód. Barras</div>
                                        <div className="w-2/3 text-xs text-slate-300 font-mono">789123456789</div>
                                    </div>
                                </div>
                            )}
                            {sidebarTab === 'variacoes' && (
                                <div className="text-center py-6">
                                    <p className="text-xs text-slate-500 font-bold">Grade de tamanhos cadastrada:</p>
                                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                        {Object.entries(selectedProduct.allowedGrades || {}).map(([group, sizes]) => (
                                            sizes.map(size => (
                                                <span key={`${group}-${size}`} className="bg-[#1e293b] text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700">
                                                    {group}: {size}
                                                </span>
                                            ))
                                        ))}
                                        {Object.keys(selectedProduct.allowedGrades || {}).length === 0 && (
                                            <span className="text-xs text-rose-400">Nenhuma grade definida.</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {sidebarTab === 'fornecedores' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-500 font-bold">Fornecedores vinculados:</p>
                                    {selectedProduct.suppliers && selectedProduct.suppliers.length > 0 ? (
                                        selectedProduct.suppliers.map(ps => (
                                            <div key={ps.id} className="bg-[#1e293b] p-3 rounded-lg border border-[#334155] flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-bold text-white flex items-center gap-2">
                                                        {ps.supplier?.name} 
                                                        {ps.is_default && <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] uppercase">Padrão</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Custo: R$ {ps.cost_price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-xs text-rose-400 block text-center mt-4">Nenhum fornecedor vinculado.</span>
                                    )}
                                    <p className="text-[9px] text-slate-500 text-center mt-4">Para adicionar, clique em Editar Produto.</p>
                                </div>
                            )}
                            {sidebarTab === 'estoque' && (
                                <div className="text-center py-8 text-xs text-slate-500 font-bold">
                                    Módulo de gestão de estoque físico em construção.
                                </div>
                            )}
                            {sidebarTab === 'historico' && (
                                <div className="text-center py-8 text-xs text-slate-500 font-bold">
                                    Nenhum histórico de alterações.
                                </div>
                            )}
                        </div>

                        {/* Edit Button */}
                        <div className="p-4 border-t border-[#1e293b]">
                            <button 
                                onClick={() => { setEditingProduct(selectedProduct); setIsEditing(true); }}
                                className="w-full py-3 rounded-xl border border-[#6366F1] text-[#6366F1] font-black text-xs uppercase tracking-widest hover:bg-[#6366F1] hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> Editar produto
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Edição (Mantido idêntico à versão funcional anterior) */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-[#0b1221] w-full max-w-4xl h-[90vh] rounded-3xl border border-[#1e293b] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-[#1e293b] flex items-center justify-between bg-[#151B2B]">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                                    {editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}
                                </h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Configure detalhes, imagem e grade de tamanhos.</p>
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

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <form className="p-8 space-y-10">
                                {/* 1. Basic Info & Image */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    {/* Image */}
                                    <div className="md:col-span-4 space-y-4">
                                        <div className="aspect-[4/5] bg-[#0f172a] rounded-2xl border-2 border-dashed border-[#1e293b] hover:border-white/30 transition-all relative group overflow-hidden flex items-center justify-center">
                                            {isProcessingImage ? (
                                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                                                <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-500 hover:text-white transition-colors">
                                                    <ImageIcon className="w-10 h-10" />
                                                    <span className="text-xs font-bold uppercase">Upload Imagem</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                            )}
                                        </div>
                                        <div className="bg-[#151B2B] p-4 rounded-xl border border-[#1e293b]">
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
                                            <p className="text-[10px] text-slate-500 leading-tight">Define se o produto aparece para clientes no link público.</p>
                                        </div>
                                    </div>

                                    {/* Fields */}
                                    <div className="md:col-span-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome do Produto</label>
                                                <input
                                                    required
                                                    value={editingProduct?.name}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                                                    className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:border-[#6366F1] outline-none transition-all placeholder:text-slate-600"
                                                    placeholder="Ex: Camiseta Dry-Fit Pro"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Categoria</label>
                                                <select
                                                    value={editingProduct?.category}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, category: e.target.value })}
                                                    className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:border-[#6366F1] outline-none"
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
                                                    className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:border-[#6366F1] outline-none font-mono uppercase"
                                                    placeholder="PROD-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Preço Venda (R$)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct?.basePrice}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, basePrice: parseFloat(e.target.value) })}
                                                    className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-2xl font-black text-emerald-400 focus:border-[#6366F1] outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Custo Prod. (R$)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct?.costPrice || ''}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value);
                                                        setEditingProduct({ ...editingProduct!, costPrice: isNaN(val) ? 0 : val });
                                                    }}
                                                    className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-2xl font-black text-slate-300 focus:border-[#6366F1] outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {editingProduct?.basePrice && editingProduct?.costPrice !== undefined ? (
                                                <div className="col-span-2 text-right -mt-2">
                                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded inline-block">
                                                        Lucro Estimado: R$ {(editingProduct.basePrice - (editingProduct.costPrice || 0)).toFixed(2)} ({editingProduct.basePrice > 0 ? ((editingProduct.basePrice - (editingProduct.costPrice || 0)) / editingProduct.basePrice * 100).toFixed(0) : 0}%)
                                                    </p>
                                                </div>
                                            ) : null}
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Descrição Pública</label>
                                                <textarea
                                                    value={editingProduct?.description || ''}
                                                    onChange={e => setEditingProduct({ ...editingProduct!, description: e.target.value })}
                                                    className="w-full bg-[#151B2B] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white focus:border-[#6366F1] outline-none resize-none h-24"
                                                    placeholder="Descrição que aparece para o cliente na loja..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Grade Matrix */}
                                <div className="border-t border-[#1e293b] pt-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <Ruler className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Grade & Medidas</h3>
                                            <p className="text-xs text-slate-500">Selecione os tamanhos disponíveis e defina as medidas (opcional).</p>
                                        </div>
                                    </div>
                                    {renderGradeMatrix()}
                                </div>
                            </form>
                        </div>
                        {/* Footer */}
                        <div className="p-6 border-t border-[#1e293b] bg-[#151B2B] flex justify-end gap-4">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500 hover:text-white hover:bg-[#1e293b] transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="px-8 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2">
                                <Save className="w-4 h-4" /> Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteProductId}
                title="Excluir Produto"
                message="Tem certeza? Isso pode afetar pedidos existentes. Esta ação não pode ser desfeita."
                variant="danger"
                confirmLabel="Excluir"
                onConfirm={() => { if (confirmDeleteProductId) doDeleteProduct(confirmDeleteProductId); setConfirmDeleteProductId(null); }}
                onCancel={() => setConfirmDeleteProductId(null)}
            />
        </div>
    );
};

export default Products;
