import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, X, Plus, Minus, ArrowRight, CheckCircle2, ChevronRight, Ruler, Info, Instagram, MessageCircle, Menu, SlidersHorizontal } from 'lucide-react';
import { Product } from '../types';
import { productService } from '../services/productService';
import { catalogOrderService } from '../services/catalogOrderService';
import { GRADES } from '../constants';
import { CompanySettings, settingsService } from '../services/settingsService';

// --- Types ---
interface CartItem {
    id: string;
    productId: string;
    productName: string;
    imageUrl: string;
    size: string;
    quantity: number;
    price: number;
    notes: string;
}

const PublicStore: React.FC = () => {
    // --- State ---
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Modals
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // Checkout Form
    const [clientName, setClientName] = useState('');
    const [clientTeam, setClientTeam] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientNotes, setClientNotes] = useState('');

    // Company Settings
    const [company, setCompany] = useState<CompanySettings | null>(null);

    // Measurement Table Modal
    const [isMeasurementTableOpen, setIsMeasurementTableOpen] = useState(false);

    // --- Effects ---
    useEffect(() => {
        loadData();
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prods, settings] = await Promise.all([
                productService.getAll(),
                settingsService.getSettings()
            ]);
            setProducts(prods.filter(p => p.status === 'active' && p.published));
            setCompany(settings);
        } catch (error) {
            console.error("Error loading store data", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Helpers ---
    const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // --- Actions ---
    const addToCart = (product: Product, size: string, quantity: number, notes: string) => {
        const cartId = `${product.id}-${size}`;
        setCart(prev => {
            const existing = prev.find(item => item.id === cartId);
            if (existing) {
                return prev.map(item => item.id === cartId ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...prev, {
                id: cartId,
                productId: product.id,
                productName: product.name,
                imageUrl: product.imageUrl,
                size,
                quantity,
                price: product.basePrice,
                notes
            }];
        });
        setViewingProduct(null);
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleCheckout = async () => {
        if (!clientName || !clientPhone || cart.length === 0) {
            alert("Preencha seu nome e telefone para enviar o pedido.");
            return;
        }

        try {
            await catalogOrderService.create({
                clientId: 'public-client',
                clientName,
                clientTeam,
                clientPhone,
                totalEstimated: cartTotal,
                notes: clientNotes,
                items: cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    size: item.size,
                    quantity: item.quantity,
                    imageUrl: item.imageUrl,
                    notes: item.notes
                }))
            });

            setCart([]);
            setIsCheckoutOpen(false);
            setCheckoutSuccess(true);
        } catch (error) {
            console.error("Checkout error", error);
            alert("Erro ao enviar pedido. Tente novamente.");
        }
    };

    // --- Components ---

    const HeroSection = () => (
        <div className="relative w-full h-[60vh] md:h-[70vh] bg-[#020617] overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020617] to-[#020617]"></div>

            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="relative z-10 text-center px-6 max-w-4xl space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                <span className="text-indigo-400 font-medium tracking-[0.2em] text-sm md:text-base uppercase bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                    Nova Coleção 2025
                </span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">
                    {company?.name || 'ESTAMPARIA.AI'}
                </h1>
                <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
                    Personalização premium e qualidade excepcional para sua equipe. Vista o futuro com design exclusivo.
                </p>

                <div className="pt-8">
                    <button
                        onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-white text-black hover:bg-slate-200 px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105"
                    >
                        Ver Catálogo
                    </button>
                </div>
            </div>
        </div>
    );

    const ProductModal = ({ product }: { product: Product }) => {
        // Defaults
        const hasGrades = product.allowedGrades && Object.keys(product.allowedGrades).length > 0;
        const availableGroups = hasGrades ? Object.keys(product.allowedGrades!) : [];
        const initialGroup = availableGroups.length > 0 ? availableGroups[0] : '';

        const [selectedGroup, setSelectedGroup] = useState(initialGroup);
        const [selectedSize, setSelectedSize] = useState('');
        const [qty, setQty] = useState(1);
        const [notes, setNotes] = useState('');

        // Determine available sizes based on selected group
        const sizes = (hasGrades && selectedGroup)
            ? product.allowedGrades![selectedGroup] || []
            : GRADES.flatMap(g => g.sizes);

        // Get measurements for selected size
        const currentMeasurement = (selectedGroup && selectedSize && product.measurements)
            ? product.measurements[`${selectedGroup}-${selectedSize}`]
            : null;

        return (
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                {/* Backdrop Close */}
                <div className="absolute inset-0" onClick={() => setViewingProduct(null)} />

                <div className="bg-[#0f172a] w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-3xl border border-slate-800 flex flex-col md:flex-row shadow-2xl overflow-hidden relative z-10">

                    {/* Close Button */}
                    <button
                        onClick={() => setViewingProduct(null)}
                        className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Left: Image */}
                    <div className="w-full md:w-1/2 bg-[#020617] relative flex items-center justify-center p-8 shrink-0 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-slate-800">
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_25px_rgba(255,255,255,0.05)]"
                        />
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">

                            <div>
                                <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2 block">{product.category}</span>
                                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight mb-3">{product.name}</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">{product.description || "Design exclusivo e acabamento de alta performance."}</p>
                            </div>

                            <div className="flex items-center gap-4 pb-4 border-b border-slate-800/50">
                                <span className="text-3xl font-bold text-white">R$ {product.basePrice.toFixed(2)}</span>
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Valor Unitário</span>
                            </div>

                            <div className="space-y-6">
                                {/* Grade Tabs */}
                                {hasGrades && availableGroups.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Modelo</label>
                                            <button
                                                onClick={() => setIsMeasurementTableOpen(true)}
                                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline uppercase tracking-wider"
                                            >
                                                Ver Tabela de Medidas
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 border-b border-slate-800">
                                            {availableGroups.map(group => (
                                                <button
                                                    key={group}
                                                    onClick={() => { setSelectedGroup(group); setSelectedSize(''); }}
                                                    className={`pb-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${selectedGroup === group
                                                        ? 'text-indigo-400 border-indigo-400'
                                                        : 'text-slate-500 border-transparent hover:text-slate-300'
                                                        }`}
                                                >
                                                    {group}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Selector */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tamanho</label>
                                        {currentMeasurement && (
                                            <div className="flex items-center gap-2 text-[10px] text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-in fade-in duration-300">
                                                <Ruler className="w-3.5 h-3.5" />
                                                <span className="font-bold tracking-wide">ALTURA: {currentMeasurement.height}cm &nbsp;•&nbsp; LARGURA: {currentMeasurement.width}cm</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                        {sizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`h-10 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${selectedSize === size
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Personalization */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personalização (Opcional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Nome atrás, número, detalhes..."
                                        className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none h-20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Totals */}
                        <div className="p-6 md:p-8 bg-[#1e293b]/50 border-t border-slate-800 backdrop-blur-sm shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800">
                                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                                    <span className="w-8 text-center font-bold text-white">{qty}</span>
                                    <button onClick={() => setQty(qty + 1)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                                </div>
                                <button
                                    onClick={() => addToCart(product, selectedSize, qty, notes)}
                                    disabled={!selectedSize}
                                    className="flex-1 bg-white hover:bg-slate-200 text-black disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase tracking-widest h-12 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.02]"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Adicionar à Sacola
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Measurement Table Modal Layer */}
                {
                    isMeasurementTableOpen && (
                        <div className="absolute inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                            <div className="bg-[#0f172a] w-full max-w-2xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative animate-in zoom-in-95">
                                <button
                                    onClick={() => setIsMeasurementTableOpen(false)}
                                    className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Ruler className="w-5 h-5 text-indigo-500" />
                                    Tabela de Medidas (cm)
                                </h3>

                                <div className="space-y-8 max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
                                    {availableGroups.map(group => {
                                        const groupSizes = product.allowedGrades![group] || [];
                                        return (
                                            <div key={group} className="space-y-3">
                                                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest border-b border-indigo-500/20 pb-2 mb-3">
                                                    {group}
                                                </h4>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                    {groupSizes.map(size => {
                                                        const m = product.measurements?.[`${group}-${size}`];
                                                        return (
                                                            <div key={size} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-1">
                                                                <span className="text-sm font-black text-white">{size}</span>
                                                                {m ? (
                                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                                        {m.height} x {m.width}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-600 italic">--</span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] font-sans text-slate-200">
            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#020617]/90 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'}`}>
                <div className="max-w-[1800px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {company?.logo_url ? (
                            <img src={company.logo_url} className="h-10 w-auto rounded-lg" />
                        ) : (
                            <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white">E</div>
                        )}
                        <span className={`font-bold text-xl tracking-tight ${scrolled ? 'text-white' : 'text-white'}`}>
                            {company?.name || 'ESTAMPARIA'}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {/* Desktop Search */}
                        <div className="relative group">
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar produtos..."
                                className="bg-transparent border-b border-slate-700 text-sm py-2 px-2 w-48 focus:w-64 focus:border-white transition-all outline-none placeholder:text-slate-500 text-white"
                            />
                            <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>

                        <button onClick={() => setIsCartOpen(true)} className="relative group p-2">
                            <ShoppingBag className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Mobile Controls */}
                    <div className="flex items-center gap-4 md:hidden">
                        <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)}><Search className="w-6 h-6 text-white" /></button>
                        <button onClick={() => setIsCartOpen(true)} className="relative">
                            <ShoppingBag className="w-6 h-6 text-white" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 w-2 h-2 rounded-full" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {mobileSearchOpen && (
                    <div className="bg-[#0f172a] p-4 border-b border-slate-800">
                        <input
                            autoFocus
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full bg-[#1e293b] rounded-lg px-4 py-3 text-white outline-none"
                        />
                    </div>
                )}
            </nav>

            {/* Hero Banner */}
            {!searchTerm && <HeroSection />}

            {/* Main Content */}
            <main id="products" className="px-6 md:px-12 py-20 max-w-[1800px] mx-auto min-h-[60vh]">

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-12 border-b border-slate-800 pb-6 gap-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Catálogo</h2>

                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                    ? 'bg-white text-black'
                                    : 'text-slate-500 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                        <p className="text-slate-500 font-medium">Nenhum produto encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => setViewingProduct(product)}
                                className="group cursor-pointer flex flex-col gap-4"
                            >
                                <div className="aspect-[4/5] bg-[#0f172a] rounded-xl overflow-hidden relative border border-slate-800 group-hover:border-slate-600 transition-all">
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />

                                    {/* Quick visual cues */}
                                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="flex justify-end">
                                            <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{product.category}</span>
                                    <h3 className="text-base font-medium text-white leading-tight group-hover:text-indigo-400 transition-colors mt-1 mb-2 line-clamp-2">{product.name}</h3>
                                    <span className="text-lg font-bold text-white">R$ {product.basePrice.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-[#0f172a] pt-20 pb-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h4 className="font-bold text-2xl text-white mb-6">{company?.name || 'Estamparia.AI'}</h4>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">Excelência em personalização têxtil. Transformando sua marca em vestuário de alto padrão.</p>

                    <div className="flex justify-center gap-6 mb-12">
                        <a href="#" className="w-12 h-12 bg-[#1e293b] rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="w-12 h-12 bg-[#1e293b] rounded-full flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle className="w-5 h-5" /></a>
                    </div>

                    <p className="text-xs text-slate-600 uppercase tracking-widest">© 2025 Todos os direitos reservados</p>
                </div>
            </footer>

            {/* Product Modal */}
            {viewingProduct && <ProductModal product={viewingProduct} />}

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)} />
                    <div className="relative w-full max-w-md bg-[#0f172a] shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-800">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest">Sua Sacola</h2>
                            <button onClick={() => setIsCartOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 opacity-30">
                                    <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                                    <p className="font-medium">Sua sacola está vazia</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-20 h-24 bg-[#1e293b] rounded-lg overflow-hidden shrink-0">
                                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-medium text-white text-sm line-clamp-1">{item.productName}</h3>
                                                <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-rose-500"><X className="w-4 h-4" /></button>
                                            </div>
                                            <p className="text-xs text-indigo-400 font-bold uppercase mb-2">Tamanho: {item.size}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-white">R$ {item.price.toFixed(2)}</span>
                                                <div className="flex items-center bg-[#1e293b] rounded-lg">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white">-</button>
                                                    <span className="text-xs font-bold text-white w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-[#1e293b]/30">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-sm font-medium text-slate-400">Total Estimado</span>
                                <span className="text-2xl font-bold text-white">R$ {cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                disabled={cart.length === 0}
                                className="w-full py-4 bg-white hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold uppercase tracking-widest rounded-xl transition-all"
                            >
                                Finalizar Pedido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-[#0f172a] w-full max-w-lg rounded-3xl border border-slate-800 p-8 shadow-2xl relative">
                        <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>

                        <h2 className="text-2xl font-bold text-white mb-1">Confirmar Pedido</h2>
                        <p className="text-slate-400 text-sm mb-8">Preencha seus dados para finalizar a solicitação.</p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Seu Nome</label>
                                <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" placeholder="Nome Completo" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" placeholder="(00) 00000-0000" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Turma / Equipe (Opcional)</label>
                                <input value={clientTeam} onChange={e => setClientTeam(e.target.value)} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" placeholder="Ex: Terceirão 2026" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Observações Gerais</label>
                                <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white resize-none h-20 text-sm focus:border-indigo-500 outline-none" placeholder="Detalhes da entrega, prazo, etc." />
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all"
                        >
                            Enviar no WhatsApp
                        </button>
                    </div>
                </div>
            )}

            {/* Success */}
            {checkoutSuccess && (
                <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
                    <div className="bg-[#1e293b] rounded-3xl p-10 max-w-sm w-full text-center border border-slate-800">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Pedido Enviado!</h2>
                        <p className="text-slate-400 text-sm mb-8">Nossa equipe entrará em contato em breve para confirmar os detalhes.</p>
                        <button onClick={() => setCheckoutSuccess(false)} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl text-sm hover:scale-105 transition-transform">Voltar para Loja</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicStore;
// Standard Luxury Edition v15.0
