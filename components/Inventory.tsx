import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, AlertTriangle, TrendingDown, Trash2, Save, Package, Loader2, ShoppingCart, CheckCircle2, PackageCheck } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { InventoryItem, OrderStatus } from '../types';
import { financeService } from '../services/financeService';

const Inventory: React.FC = () => {
    const [materials, setMaterials] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'stock' | 'buying'>('stock');
    const [isAdding, setIsAdding] = useState(false);
    const [newMaterial, setNewMaterial] = useState<Partial<InventoryItem>>({ category: 'Fabric', unit: 'und' });
    const [isSaving, setIsSaving] = useState(false);

    // Purchase Modal State
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseItem, setPurchaseItem] = useState<InventoryItem | null>(null);
    const [purchaseQty, setPurchaseQty] = useState<string>('');
    const [purchaseCost, setPurchaseCost] = useState<string>('');
    const [purchaseDesc, setPurchaseDesc] = useState('');

    const openPurchaseModal = (item: InventoryItem) => {
        setPurchaseItem(item);
        setPurchaseQty('');
        setPurchaseCost('');
        setPurchaseDesc(`Compra de ${item.name}`);
        setIsPurchasing(true);
    };

    const handleConfirmPurchase = async () => {
        if (!purchaseItem || !purchaseQty || !purchaseCost) return;

        const qty = parseFloat(purchaseQty);
        const cost = parseFloat(purchaseCost); // Total Cost

        if (isNaN(qty) || isNaN(cost) || qty <= 0) {
            alert("Por favor, insira valores válidos.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Update Inventory
            const newQty = purchaseItem.quantity + qty;
            await inventoryService.updateQuantity(purchaseItem.id, newQty);

            // 2. Create Expense Transaction
            await financeService.create({
                type: 'expense',
                category: 'material',
                amount: cost,
                description: purchaseDesc || `Compra de ${purchaseItem.name} (${qty}${purchaseItem.unit})`,
                date: new Date().toISOString()
            });

            // 3. Update Local State
            setMaterials(prev => prev.map(m => m.id === purchaseItem.id ? { ...m, quantity: newQty } : m));

            // 4. Close
            setIsPurchasing(false);
            setPurchaseItem(null);
            alert("Compra registrada com sucesso! Estoque e Financeiro atualizados.");

        } catch (error) {
            console.error("Purchase failed:", error);
            alert("Erro ao registrar compra.");
        } finally {
            setIsSaving(false);
        }
    };


    // Purchasing State
    const [buyingList, setBuyingList] = useState<{ item: InventoryItem, required: number, balance: number, toBuy: number }[]>([]);
    const [calculating, setCalculating] = useState(false);

    const loadData = async () => {
        try {
            const data = await inventoryService.getAll();
            setMaterials(data);
        } catch (error) {
            console.error("Failed to load inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateNeeds = async () => {
        setCalculating(true);
        try {
            // 1. Fetch Active Orders
            const orders = await orderService.getAll();
            const activeOrders = orders.filter(o =>
                o.status === OrderStatus.RECEIVED ||
                o.status === OrderStatus.IN_PRODUCTION ||
                o.status === OrderStatus.FINALIZATION
            );

            // 2. Map Requirements
            const requirements: Record<string, number> = {}; // inventory_item_id -> total qty

            for (const order of activeOrders) {
                for (const item of order.items) {
                    // We need product ID... Assuming item.productId exists?
                    // Review OrderItem type: yes, it has productId.
                    // But product might be custom or deleted? 
                    // To be safe, we need recipes.
                    if (item.productId) {
                        try {
                            const recipe = await productService.getRecipe(item.productId);
                            if (recipe && recipe.length > 0) {
                                recipe.forEach(r => {
                                    const totalRequired = r.quantityRequired * item.quantity;
                                    requirements[r.inventoryItemId] = (requirements[r.inventoryItemId] || 0) + totalRequired;
                                });
                            }
                        } catch (e) {
                            console.warn(`Could not fetch recipe for product ${item.productId}`);
                        }
                    }
                }
            }

            // 3. Compare with Stock
            const suggestions = materials.map(mat => {
                const req = requirements[mat.id] || 0;
                const balance = mat.quantity - req;
                return {
                    item: mat,
                    required: req,
                    balance: balance,
                    toBuy: balance < 0 ? Math.abs(balance) : 0
                };
            }).filter(s => s.required > 0); // Only show items involved in production

            setBuyingList(suggestions.sort((a, b) => b.toBuy - a.toBuy)); // Urgent first

        } catch (error) {
            console.error("Error calculating purchasing needs:", error);
            alert("Erro ao calcular necessidades de compra.");
        } finally {
            setCalculating(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'buying') {
            calculateNeeds();
        }
    }, [activeTab]);

    const handleAdd = async () => {
        if (!newMaterial.name || !newMaterial.quantity) return;
        setIsSaving(true);
        try {
            const created = await inventoryService.create({
                name: newMaterial.name,
                category: newMaterial.category as any,
                quantity: Number(newMaterial.quantity),
                unit: newMaterial.unit || 'und',
                minLevel: Number(newMaterial.minLevel) || 10
            });
            setMaterials(prev => [...prev, created]);
            setIsAdding(false);
            setNewMaterial({ category: 'Fabric', unit: 'und' });
        } catch (error) {
            console.error("Failed to create item:", error);
            alert("Erro ao criar item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este item do banco de dados?')) {
            try {
                await inventoryService.delete(id);
                setMaterials(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                console.error("Failed to delete item:", error);
                alert("Erro ao excluir item.");
            }
        }
    };

    const handleUpdateQuantity = async (id: string, delta: number) => {
        const item = materials.find(m => m.id === id);
        if (!item) return;

        const newQty = Math.max(0, Number((item.quantity + delta).toFixed(2)));

        // Optimistic update
        setMaterials(prev => prev.map(m => m.id === id ? { ...m, quantity: newQty } : m));

        try {
            await inventoryService.updateQuantity(id, newQty);
        } catch (error) {
            console.error("Failed to update quantity:", error);
            loadData(); // Reload to be safe
        }
    };

    const filtered = materials.filter(m =>
        (m.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (m.category || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }


    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700 relative">
            {/* Purchase Modal */}
            {isPurchasing && purchaseItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-emerald-500" />
                                    Registrar Compra
                                </h3>
                                <p className="text-slate-500 text-xs font-bold uppercase mt-1">{purchaseItem.name}</p>
                            </div>
                            <button onClick={() => setIsPurchasing(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Quantidade a Adicionar ({purchaseItem.unit})</label>
                                <input
                                    type="number"
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                                    placeholder="0"
                                    value={purchaseQty}
                                    onChange={e => setPurchaseQty(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Custo Total (R$)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                                    placeholder="0.00"
                                    value={purchaseCost}
                                    onChange={e => setPurchaseCost(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Descrição / Fornecedor</label>
                                <input
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                    placeholder="Ex: Tinta Epson, Loja do Silk..."
                                    value={purchaseDesc}
                                    onChange={e => setPurchaseDesc(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleConfirmPurchase}
                                disabled={isSaving}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Salvando...' : 'Confirmar Compra'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-3">
                        <Box className="w-8 h-8 text-indigo-500" />
                        Controle de Estoque
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 ml-1">
                        Gerencie seus materiais e insumos.
                    </p>
                </div>

                {/* TABS */}
                <div className="bg-slate-900 p-1 rounded-xl flex border border-slate-800">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'stock' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Package className="w-4 h-4" /> Estoque
                    </button>
                    <button
                        onClick={() => setActiveTab('buying')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'buying' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <ShoppingCart className="w-4 h-4" /> Sugestão de Compra
                    </button>
                </div>

                {activeTab === 'stock' && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Novo Item
                    </button>
                )}
            </header>

            {activeTab === 'stock' ? (
                // STOCK VIEW (Original Content)
                <>
                    {isAdding && (
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] animate-in slide-in-from-top-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Nome do Item</label>
                                    <input
                                        autoFocus
                                        placeholder="Ex: Tinta Preta, Tecido Algodão..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                        value={newMaterial.name || ''}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Categoria</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                        value={newMaterial.category}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value as any })}
                                    >
                                        <option value="Fabric">Tecido</option>
                                        <option value="Ink">Tinta</option>
                                        <option value="Screen">Tela</option>
                                        <option value="Consumable">Consumível</option>
                                        <option value="Other">Outro</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Qtd Inicial</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                        value={newMaterial.quantity || ''}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Unidade</label>
                                    <input
                                        placeholder="kg, m, un..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                        value={newMaterial.unit || ''}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
                                <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase text-slate-500 hover:text-white">Cancelar</button>
                                <button onClick={handleAdd} disabled={isSaving} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                    <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar Item'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 min-h-[500px]">
                        <div className="flex items-center gap-4 mb-6 bg-slate-950/50 p-2 rounded-2xl border border-slate-800/50 w-full md:w-96">
                            <Search className="w-5 h-5 text-slate-500 ml-2" />
                            <input
                                placeholder="Buscar material..."
                                className="bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-600 font-bold uppercase text-xs w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((item) => (
                                <div key={item.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 group hover:border-indigo-500/30 transition-all shadow-lg hover:shadow-indigo-500/10 relative overflow-hidden">
                                    {item.quantity <= (item.minLevel || 10) && (
                                        <div className="absolute top-0 right-0 bg-rose-500/10 p-2 rounded-bl-2xl border-b border-l border-rose-500/20 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Baixo Estoque</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">{item.category}</span>
                                            <h3 className="text-lg font-black text-slate-100 uppercase mt-2">{item.name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openPurchaseModal(item)}
                                                className="text-emerald-500 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100 bg-emerald-500/10 p-2 rounded-lg"
                                                title="Registrar Compra"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 bg-rose-500/10 p-2 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Quantidade</p>
                                            <p className={`text-2xl font-black ${item.quantity <= (item.minLevel || 10) ? 'text-rose-400' : 'text-slate-200'}`}>
                                                {item.quantity} <span className="text-xs text-slate-500 font-bold">{item.unit}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors"
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 flex items-center justify-center transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (

                // PURCHASING VIEW
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 min-h-[500px] animate-in slide-in-from-right-4">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Sugestão de Compra</h3>
                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                            Baseado nos pedidos em aberto (Pendentes e Em Produção), este é o material que você precisa comprar para não faltar estoque.
                        </p>
                    </div>

                    {calculating ? (
                        <div className="flex h-64 items-center justify-center flex-col gap-4">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Calculando necessidades...</p>
                        </div>
                    ) : buyingList.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                            <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                            <h4 className="text-slate-200 font-bold text-lg">Tudo certo!</h4>
                            <p className="text-slate-500 text-sm">Você tem estoque suficiente para todos os pedidos atuais.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-800">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4">Material</th>
                                        <th className="p-4 text-center">Em Estoque</th>
                                        <th className="p-4 text-center text-amber-500">Necessário</th>
                                        <th className="p-4 text-center text-rose-500">Falta (Comprar)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                                    {buyingList.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <p className="font-bold text-slate-200">{row.item.name}</p>
                                                <span className="text-[9px] text-slate-500 font-black uppercase">{row.item.category}</span>
                                            </td>
                                            <td className="p-4 text-center font-mono text-slate-300 font-bold">
                                                {row.item.quantity} {row.item.unit}
                                            </td>
                                            <td className="p-4 text-center font-mono text-amber-400 font-bold bg-amber-500/5">
                                                {row.required.toFixed(1)} {row.item.unit}
                                            </td>
                                            <td className="p-4 text-center">
                                                {row.toBuy > 0 ? (
                                                    <span className="bg-rose-500 text-white px-3 py-1 rounded-lg font-black text-xs shadow-lg shadow-rose-500/20">
                                                        -{row.toBuy.toFixed(1)} {row.item.unit}
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-500 font-bold text-xs flex items-center justify-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> OK
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Inventory;
