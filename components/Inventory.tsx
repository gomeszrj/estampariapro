import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, AlertTriangle, TrendingDown, Trash2, Save, Package } from 'lucide-react';

interface Material {
    id: string;
    name: string;
    category: 'Fabric' | 'Ink' | 'Screen' | 'Other';
    quantity: number;
    unit: string;
    minLevel: number;
}

const INITIAL_MATERIALS: Material[] = [
    { id: '1', name: 'Dry Fit Premium - Branco', category: 'Fabric', quantity: 120, unit: 'm', minLevel: 50 },
    { id: '2', name: 'Dry Fit Premium - Preto', category: 'Fabric', quantity: 45, unit: 'm', minLevel: 50 },
    { id: '3', name: 'Tinta Sublimática Cyan', category: 'Ink', quantity: 2.5, unit: 'L', minLevel: 1 },
    { id: '4', name: 'Tinta Sublimática Magenta', category: 'Ink', quantity: 0.8, unit: 'L', minLevel: 1 },
    { id: '5', name: 'Papel Sublimático A3', category: 'Other', quantity: 200, unit: 'fls', minLevel: 100 },
];

const Inventory: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>(() => {
        const saved = localStorage.getItem('erp_inventory');
        return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newMaterial, setNewMaterial] = useState<Partial<Material>>({ category: 'Fabric', unit: 'und' });

    useEffect(() => {
        localStorage.setItem('erp_inventory', JSON.stringify(materials));
    }, [materials]);

    const handleAdd = () => {
        if (!newMaterial.name || !newMaterial.quantity) return;
        const item: Material = {
            id: Math.random().toString(36).substr(2, 9),
            name: newMaterial.name,
            category: newMaterial.category as any,
            quantity: Number(newMaterial.quantity),
            unit: newMaterial.unit || 'und',
            minLevel: Number(newMaterial.minLevel) || 10
        };
        setMaterials([...materials, item]);
        setIsAdding(false);
        setNewMaterial({ category: 'Fabric', unit: 'und' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja remover este item?')) {
            setMaterials(materials.filter(m => m.id !== id));
        }
    };

    const handleUpdateQuantity = (id: string, delta: number) => {
        setMaterials(materials.map(m =>
            m.id === id ? { ...m, quantity: Math.max(0, Number((m.quantity + delta).toFixed(2))) } : m
        ));
    };

    const filtered = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase flex items-center gap-3">
                        <Box className="w-8 h-8 text-indigo-500" />
                        Controle de Estoque
                    </h2>
                    <p className="text-slate-500 font-medium">Gerencie tecidos, tintas e insumos de produção.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar material..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-[#0f172a] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-200 focus:outline-none focus:border-indigo-500 w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Item
                    </button>
                </div>
            </header>

            {isAdding && (
                <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 animate-in slide-in-from-top-4 shadow-2xl">
                    <h3 className="text-slate-100 font-black uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Adicionar Novo Material</h3>
                    <div className="grid grid-cols-5 gap-4 items-end">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Material</label>
                            <input
                                value={newMaterial.name || ''}
                                onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                                placeholder="Ex: Dry Fit Azul Agulha"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                            <select
                                value={newMaterial.category}
                                onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value as any })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="Fabric">Tecido</option>
                                <option value="Ink">Tinta</option>
                                <option value="Screen">Tela/Matriz</option>
                                <option value="Other">Outro</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd Inicial</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={newMaterial.quantity || ''}
                                    onChange={e => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                                    placeholder="0.00"
                                />
                                <input
                                    value={newMaterial.unit}
                                    onChange={e => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                                    className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-200 text-center uppercase font-bold"
                                    placeholder="UN"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> Salvar
                            </button>
                            <button onClick={() => setIsAdding(false)} className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 py-2 rounded-xl font-bold uppercase tracking-widest text-xs">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(item => {
                    const isLow = item.quantity <= item.minLevel;
                    const isCritical = item.quantity <= item.minLevel / 2;

                    return (
                        <div key={item.id} className={`bg-[#0f172a] border ${isCritical ? 'border-rose-900/50 shadow-rose-900/10' : isLow ? 'border-amber-900/50 shadow-amber-900/10' : 'border-slate-800'} rounded-[2rem] p-6 relative overflow-hidden group transition-all hover:translate-y-[-2px] hover:shadow-2xl`}>
                            {/* Categories Badge */}
                            <div className="absolute top-6 right-6">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${item.category === 'Fabric' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                        item.category === 'Ink' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                    }`}>
                                    {item.category === 'Fabric' ? 'Tecido' : item.category === 'Ink' ? 'Tinta' : item.category}
                                </span>
                            </div>

                            <div className="pr-12">
                                <h4 className="text-lg font-black text-slate-200 mb-1">{item.name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-white tracking-tighter">{item.quantity}</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase mt-2">{item.unit}</span>
                                </div>
                            </div>

                            {isLow && (
                                <div className={`mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${isCritical ? 'text-rose-500' : 'text-amber-500'}`}>
                                    <AlertTriangle className="w-4 h-4" />
                                    {isCritical ? 'Estoque Crítico' : 'Estoque Baixo'}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
                                    <button onClick={() => handleUpdateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                        <TrendingDown className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-slate-800"></div>
                                    <button onClick={() => handleUpdateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress Bar (Visual Inventory Level) */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                                <div
                                    className={`h-full ${isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-500`}
                                    style={{ width: `${Math.min(100, (item.quantity / (item.minLevel * 3)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[3rem] opacity-50">
                        <Package className="w-16 h-16 text-slate-600 mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum material encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
