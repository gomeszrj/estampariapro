
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, X, Plus, Minus, ArrowRight, CheckCircle2, ChevronRight, ruler, Info, Instagram, MessageCircle, Menu, SlidersHorizontal } from 'lucide-react';
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
        const initialGrade = hasGrades ? Object.keys(product.allowedGrades!)[0] : '';

        const [selectedGrade, setSelectedGrade] = useState(initialGrade);
        const [selectedSize, setSelectedSize] = useState('');
        const [qty, setQty] = useState(1);
        const [notes, setNotes] = useState('');

        // Determine available sizes based on grade
        const sizes = hasGrades
            ? product.allowedGrades![selectedGrade]
            : GRADES.flatMap(g => g.sizes); // Fallback to all sizes

        return (
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                {/* Backdrop Close */}
                <div className="absolute inset-0" onClick={() => setViewingProduct(null)} />

                <div className="bg-[#0f172a] w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-[2.5rem] md:rounded-3xl border border-slate-800 flex flex-col md:flex-row shadow-2xl overflow-hidden relative z-10">

                    {/* Close Button */}
                    <button
                        onClick={() => setViewingProduct(null)}
                        className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Left: Image */}
                    <div className="w-full md:w-1/2 bg-[#020617] relative flex items-center justify-center p-8 shrink-0 h-1/3 md:h-auto border-b md:border-b-0 md:border-r border-slate-800">
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_25px_rgba(255,255,255,0.05)]"
                        />
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                            <div>
                                <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2 block">{product.category}</span>
                                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-3">{product.name}</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">{product.description || "Design exclusivo e acabamento de alta performance."}</p>
                            </div>

                            <div className="flex items-center gap-4 pb-6 border-b border-slate-800/50">
                                <span className="text-4xl font-bold text-white">R$ {product.basePrice.toFixed(2)}</span>
                                <span className="text-sm text-slate-500 font-medium">Preço base unitário</span>
                            </div>

                            <div className="space-y-6">
                                {/* Grade Selector */}
                                {hasGrades && Object.keys(product.allowedGrades!).length > 1 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Modelo</label>
                                        <div className="flex bg-slate-900/50 p-1 rounded-lg w-fit border border-slate-800">
                                            {Object.keys(product.allowedGrades!).map(grade => (
                                                <button
                                                    key={grade}
                                                    onClick={() => { setSelectedGrade(grade); setSelectedSize(''); }}
                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedGrade === grade
                                                        ? 'bg-slate-800 text-white shadow-sm'
                                                        : 'text-slate-400 hover:text-white'
                                                        }`}
                                                >
                                                    {grade}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Selector */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        Tamanho
                                        {product.measurements && <span className="text-indigo-400 cursor-pointer hover:underline text-[10px] flex items-center gap-1"><Info className="w-3 h-3" /> Tabela de Medidas</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {sizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[3.5rem] h-12 px-3 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${selectedSize === size
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personalização</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Nome atrás, número, etc..."
                                        className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none h-24"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Totals */}
                        <div className="p-6 md:p-8 bg-[#1e293b]/30 border-t border-slate-800 backdrop-blur-sm">
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
            </div>
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

    // --- Effects ---
    useEffect(() => {
        loadData();
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

    const ProductModal = ({ product }: { product: Product }) => {
        // Defaults
        const hasGrades = product.allowedGrades && Object.keys(product.allowedGrades).length > 0;
        const initialGrade = hasGrades ? Object.keys(product.allowedGrades!)[0] : '';

        const [selectedGrade, setSelectedGrade] = useState(initialGrade);
        const [selectedSize, setSelectedSize] = useState('');
        const [qty, setQty] = useState(1);
        const [notes, setNotes] = useState('');
        const [showMeasurements, setShowMeasurements] = useState(false);

        // Determine available sizes based on grade
        const sizes = hasGrades
            ? product.allowedGrades![selectedGrade]
            : GRADES.flatMap(g => g.sizes); // Fallback to all sizes

        return (
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-[#0f172a] w-full max-w-6xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row shadow-2xl overflow-hidden relative">

                    {/* Close Button */}
                    <button
                        onClick={() => setViewingProduct(null)}
                        className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Image Section */}
                    <div className="w-full md:w-1/2 bg-[#020617] relative flex items-center justify-center p-8 md:p-12 shrink-0 h-64 md:h-auto">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent opacity-50 md:hidden"></div>
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.05)] animate-in zoom-in-50 duration-500"
                        />
                        {/* Badge */}
                        <div className="absolute top-6 left-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            {product.category}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">

                            {/* Header */}
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">{product.name}</h2>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">{product.description || "Peça exclusiva com acabamento premium e conforto excepcional."}</p>
                            </div>

                            {/* Divider with Price */}
                            <div className="flex items-center gap-4 py-4 border-y border-slate-800/50">
                                <span className="text-3xl font-black text-white tracking-tighter">R$ {product.basePrice.toFixed(2)}</span>
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Preço Base</span>
                            </div>

                            {/* Grade & Size Selector */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Tamanho</h3>
                                    {product.measurements && (
                                        <button
                                            onClick={() => setShowMeasurements(!showMeasurements)}
                                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1"
                                        >
                                            <Ruler className="w-3 h-3" /> Ver Medidas
                                        </button>
                                    )}
                                </div>

                                {/* Grade Tabs (If multiple grades exist) */}
                                {hasGrades && Object.keys(product.allowedGrades!).length > 1 && (
                                    <div className="flex bg-slate-900 p-1 rounded-xl w-fit">
                                        {Object.keys(product.allowedGrades!).map(grade => (
                                            <button
                                                key={grade}
                                                onClick={() => { setSelectedGrade(grade); setSelectedSize(''); }}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedGrade === grade
                                                    ? 'bg-slate-800 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300'
                                                    }`}
                                            >
                                                {grade}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Sizes Grid */}
                                <div className="flex flex-wrap gap-2">
                                    {sizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all ${selectedSize === size
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] scale-105'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Measurements Table (Collapsible) */}
                            {showMeasurements && product.measurements && (
                                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 animate-in slide-in-from-top-2">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Tabela de Medidas (cm)</h4>
                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                        {Object.entries(product.measurements).map(([size, dims]: any) => (
                                            <div key={size} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                                                <span className="block text-[10px] font-black text-indigo-400 mb-1">{size}</span>
                                                <div className="text-[9px] text-slate-400 font-mono">
                                                    H: {dims.height}<br />L: {dims.width}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Personalization */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Observações / Personalização</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Ex: Nome nas costas: SILVA..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-24"
                                />
                            </div>
                        </div>

                        {/* Footer Totals */}
                        <div className="p-6 md:p-8 bg-[#020617] border-t border-slate-800">
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-1.5 border border-slate-800">
                                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><Minus className="w-4 h-4" /></button>
                                    <span className="w-6 text-center font-black text-white text-lg">{qty}</span>
                                    <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><Plus className="w-4 h-4" /></button>
                                </div>
                                <button
                                    onClick={() => addToCart(product, selectedSize, qty, notes)}
                                    disabled={!selectedSize}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-[0.2em] h-14 rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]"
                                >
                                    <ShoppingBag className="w-5 h-5" /> Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest animate-pulse">Carregando Loja...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] font-sans text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800 h-20 flex items-center justify-between px-6 md:px-12">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        {company?.logo_url ? <img src={company.logo_url} className="w-full h-full object-cover rounded-xl" /> : <span className="font-black text-white">E</span>}
                    </div>
                    <span className="font-black text-lg text-white uppercase tracking-tight hidden md:block">{company?.name || 'ESTAMPARIA.AI'}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm w-64 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <button onClick={() => setIsCartOpen(true)} className="relative w-12 h-12 bg-slate-900/50 hover:bg-slate-900 text-white rounded-xl border border-slate-800 hover:border-indigo-500/50 flex items-center justify-center transition-all group">
                        <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#020617] shadow-lg">
                                {cartCount}
                            </span>
                        )}
                    </button>
                    {/* Mobile Search Toggle */}
                    <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="md:hidden text-slate-400 hover:text-white ml-2">
                        <Search className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Mobile Search Bar */}
            {mobileSearchOpen && (
                <div className="fixed top-20 left-0 right-0 bg-[#0f172a] p-4 border-b border-slate-800 z-30 animate-in slide-in-from-top-5">
                    <input
                        autoFocus
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="O que você procura?"
                        className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                </div>
            )}

            {/* Categories */}
            <div className="pt-28 pb-8 px-6 md:px-12 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 w-max mx-auto md:mx-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${selectedCategory === cat
                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-[#0f172a] text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <main className="px-6 md:px-12 pb-24 max-w-[1800px] mx-auto min-h-[60vh]">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum produto encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => setViewingProduct(product)}
                                className="group bg-[#0f172a] rounded-[2rem] border border-slate-800 p-3 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="aspect-[3/4] bg-[#020617] rounded-[1.5rem] overflow-hidden relative mb-4">
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>

                                    <button className="absolute bottom-3 right-3 bg-white text-black w-10 h-10 rounded-full flex items-center justify-center translate-y-20 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="px-2 pb-2">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{product.category}</p>
                                    <h3 className="text-sm font-bold text-white mb-2 leading-tight line-clamp-2 uppercase">{product.name}</h3>
                                    <span className="text-lg font-black text-slate-200">R$ {product.basePrice.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-[#0f172a] py-12 text-center text-slate-500">
                <h4 className="font-black text-2xl text-white uppercase tracking-tight mb-2">{company?.name || 'Estamparia.AI'}</h4>
                <div className="flex justify-center gap-6 mb-8 mt-6">
                    <a href="#" className="p-3 bg-slate-900 rounded-full hover:bg-indigo-600 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                    <a href="#" className="p-3 bg-slate-900 rounded-full hover:bg-emerald-600 hover:text-white transition-colors"><MessageCircle className="w-5 h-5" /></a>
                </div>
                <p className="text-[10px] uppercase tracking-widest opacity-50">© 2024 Todos os direitos reservados</p>
            </footer>

            {/* Product Modal */}
            {viewingProduct && <ProductModal product={viewingProduct} />}

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[200]">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                    <div className="absolute top-0 right-0 h-full w-full max-w-md bg-[#0f172a] border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <ShoppingBag className="w-6 h-6 text-indigo-500" /> Sacola ({cartCount})
                            </h2>
                            <button onClick={() => setIsCartOpen(false)}><X className="w-6 h-6 text-slate-500 hover:text-white" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 opacity-30">
                                    <ShoppingBag className="w-20 h-20 mx-auto mb-4" />
                                    <p className="font-bold uppercase tracking-widest">Sua sacola está vazia</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="bg-[#020617] p-4 rounded-2xl border border-slate-800 flex gap-4 relative group">
                                        <div className="w-20 h-20 bg-slate-900 rounded-xl overflow-hidden shrink-0">
                                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-sm uppercase line-clamp-1 mb-1">{item.productName}</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{item.size}</span>
                                                <span className="text-[10px] text-slate-500 font-black">R$ {item.price.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">-</button>
                                                <span className="text-sm font-bold text-white">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">+</button>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 p-2 text-slate-600 hover:text-rose-500"><X className="w-4 h-4" /></button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-800 bg-[#020617]">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                                <span className="text-3xl font-black text-white tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                disabled={cart.length === 0}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all"
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
                    <div className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] border border-slate-800 p-8 md:p-10 shadow-2xl relative">
                        <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>

                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Confirmar Pedido</h2>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome</label>
                                <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500" placeholder="Nome Completo" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500" placeholder="(00) 00000-0000" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Turma / Equipe (Opcional)</label>
                                <input value={clientTeam} onChange={e => setClientTeam(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500" placeholder="Ex: Terceirão 2026" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações Gerais</label>
                                <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-indigo-500 resize-none h-20 text-xs" placeholder="Detalhes da entrega, prazo, etc." />
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all"
                        >
                            Enviar Solicitação
                        </button>
                    </div>
                </div>
            )}

            {/* Success */}
            {checkoutSuccess && (
                <div className="fixed inset-0 z-[400] bg-indigo-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Pedido Enviado!</h2>
                        <p className="text-slate-500 font-medium text-sm mb-8">Recebemos sua solicitação. Em breve nossa equipe entrará em contato pelo WhatsApp para confirmar tudo!</p>
                        <button onClick={() => setCheckoutSuccess(false)} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl text-xs">Voltar para Loja</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicStore;
