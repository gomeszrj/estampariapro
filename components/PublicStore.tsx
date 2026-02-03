
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, X, Plus, Minus, ArrowRight, CheckCircle2, ChevronRight, Ruler, AlignLeft, Info } from 'lucide-react';
import { Product, CatalogOrderItem } from '../types';
import { productService } from '../services/productService';
import { catalogOrderService } from '../services/catalogOrderService';
import { FABRICS, GRADES } from '../constants';
import { CompanySettings, settingsService } from '../services/settingsService';

// --- Types ---
interface CartItem {
    id: string; // unique ID for cart item (product.id + size)
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

    // Company Settings (for Logo/Name)
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
            setProducts(prods.filter(p => p.status === 'active' && p.published)); // Only active and published products
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

    // Add generic item (from grid) - opens modal to select size usually, but here we might just open modal
    const handleProductClick = (product: Product) => {
        setViewingProduct(product);
    };

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
        setViewingProduct(null); // Close modal
        setIsCartOpen(true); // Open cart feedback
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
                clientId: 'public-client', // Placeholder, user isn't logged in
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

    // --- Sub-Components ---

    // Product Detail Modal
    const ProductModal = ({ product }: { product: Product }) => {
        const [selectedSize, setSelectedSize] = useState('');
        const [qty, setQty] = useState(1);
        const [notes, setNotes] = useState('');

        const sizes = product.allowedGrades
            ? Object.values(product.allowedGrades).flat()
            : GRADES.flatMap(g => g.sizes); // Fallback

        // Unique sizes
        const uniqueSizes = [...new Set(sizes)];

        return (
            <div className="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-5xl h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col md:flex-row relative shadow-2xl">
                    <button
                        onClick={() => setViewingProduct(null)}
                        className="absolute top-6 right-6 z-10 bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-800" />
                    </button>

                    {/* Left: Image */}
                    <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center p-8 relative h-64 md:h-auto">
                        <img src={product.imageUrl} className="max-w-full max-h-full object-contain drop-shadow-xl" alt={product.name} />
                        {product.backImageUrl && (
                            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Verso disponível
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto bg-white flex flex-col flex-1">
                        <div className="mb-auto">
                            <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-2 block">{product.category}</span>
                            <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{product.name}</h2>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium mb-8">
                                {product.description || "Produto de alta qualidade com acabamento premium."}
                            </p>

                            <div className="mb-8">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selecione o Tamanho</h3>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueSizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xs md:text-sm font-black transition-all ${selectedSize === size
                                                ? 'bg-slate-900 text-white shadow-lg scale-110'
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Measurements Table Preview (Mini) */}
                            {product.measurements && (
                                <div className="mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 hidden md:block">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                        <Ruler className="w-3 h-3" /> Tabela de Medidas (cm)
                                    </h4>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        {Object.entries(product.measurements).slice(0, 4).map(([s, d]: any) => (
                                            <div key={s} className="bg-white p-2 rounded-lg border border-slate-200">
                                                <span className="block text-xs font-black text-slate-700">{s}</span>
                                                <span className="text-[10px] text-slate-400">{d.height}x{d.width}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-20 md:mb-8 space-y-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personalização / Nome</h3>
                                <input
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Ex: Nome nas costas: SILVA"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Action Bar (Sticky Mobile) */}
                        <div className="fixed bottom-0 left-0 right-0 md:static p-4 md:p-0 bg-white border-t border-slate-100 md:border-none md:mt-6 z-20">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4 bg-slate-100 rounded-xl p-1">
                                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-white rounded-lg transition-all"><Minus className="w-4 h-4" /></button>
                                    <span className="font-black text-slate-800 w-4 text-center">{qty}</span>
                                    <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-white rounded-lg transition-all"><Plus className="w-4 h-4" /></button>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">R$ {(product.basePrice * qty).toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => addToCart(product, selectedSize, qty, notes)}
                                disabled={!selectedSize}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <ShoppingBag className="w-5 h-5" /> Adicionar à Sacola
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 w-32 bg-slate-200 rounded mx-auto"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-40 px-4 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {company?.logo_url ? (
                        <img src={company.logo_url} alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
                    ) : (
                        <div className="h-8 w-8 md:h-10 md:w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-md">
                            {company?.name ? company.name.substring(0, 1) : 'E'}
                        </div>
                    )}
                    <span className="text-sm md:text-lg font-black uppercase tracking-tight text-slate-900 block truncate max-w-[120px] md:max-w-none">
                        {company?.name || 'Store'}
                    </span>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    {/* Mobile Search Toggle */}
                    <button
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        className="md:hidden p-2 text-slate-500 hover:text-indigo-600"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <div className="relative hidden md:block group">
                        <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold w-64 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                    >
                        <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                        {cartCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-indigo-500 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black border-2 border-slate-50">
                                {cartCount}
                            </div>
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile Search Bar */}
            {mobileSearchOpen && (
                <div className="fixed top-16 left-0 right-0 bg-white p-4 border-b border-slate-100 z-30 animate-in slide-in-from-top-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar..."
                            autoFocus
                            className="w-full bg-slate-100 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Hero / Filter Bar - Mobile Sticky */}
            <div className={`pt-20 md:pt-28 pb-6 md:pb-10 px-4 md:px-12 max-w-[1600px] mx-auto ${mobileSearchOpen ? 'mt-16' : ''}`}>
                <div className="flex overflow-x-auto gap-2 md:gap-3 pb-4 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 md:px-6 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <main className="px-4 md:px-12 pb-24 md:pb-20 max-w-[1600px] mx-auto min-h-[60vh]">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p className="font-bold">Nenhum produto encontrado nesta categoria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-8">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className="group cursor-pointer flex flex-col gap-3 md:gap-4 animate-in fade-in duration-700 active:scale-95 transition-transform"
                            >
                                <div className="aspect-[4/5] bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative border border-slate-200 shadow-sm group-hover:border-indigo-500/20 group-hover:shadow-2xl group-hover:shadow-indigo-500/10 transition-all">
                                    <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-5 transition-opacity z-10" />
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />

                                    <button className="hidden md:flex absolute bottom-4 right-4 bg-white text-slate-900 w-10 h-10 rounded-full items-center justify-center shadow-lg translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="px-1">
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight leading-tight text-xs md:text-base mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                                    <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">{product.category}</p>
                                    <span className="text-sm md:text-lg font-black text-slate-900">R$ {product.basePrice.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 md:py-20 px-6 md:px-12 mt-10 md:mt-20 rounded-t-[2.5rem] md:rounded-none">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div>
                        <h4 className="font-black text-2xl uppercase tracking-tighter mb-2">{company?.name || 'Estamparia'}</h4>
                        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Todos os direitos reservados.</p>
                    </div>
                    <div className="md:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Desenvolvido por</p>
                        <span className="text-sm font-bold text-slate-400">Estamparia.AI System</span>
                    </div>
                </div>
            </footer>

            {/* Wrappers: Modals */}
            {viewingProduct && <ProductModal product={viewingProduct} />}

            {/* Cart Drawer */}
            {isCartOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]" onClick={() => setIsCartOpen(false)} />
                    <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[201] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5" /> Sua Sacola ({cartCount})
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">Sua sacola está vazia.</p>
                                    <button onClick={() => setIsCartOpen(false)} className="text-indigo-600 font-bold uppercase tracking-widest text-xs mt-4">Continuar Comprando</button>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-20 md:w-20 md:h-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h4 className="font-black text-slate-900 uppercase text-xs leading-tight line-clamp-1">{item.productName}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Tam: {item.size}</span>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-xs text-rose-500 font-bold hover:underline">X</button>
                                            </div>
                                            {item.notes && <p className="text-[10px] text-slate-500 italic mb-2 line-clamp-1">"{item.notes}"</p>}
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-white rounded hover:shadow-sm">-</button>
                                                    <span className="text-xs font-black text-slate-800">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-white rounded hover:shadow-sm">+</button>
                                                </div>
                                                <span className="font-black text-slate-900 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subtotal Estimado</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                disabled={cart.length === 0}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                Finalizar Pedido <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-end md:items-center justify-center sm:p-4 animate-in fade-in">
                    <div className="bg-white rounded-t-[2.5rem] md:rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl h-[85vh] md:h-auto overflow-y-auto">
                        <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>

                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Finalizar Pedido</h2>
                        <p className="text-slate-500 text-xs font-medium mb-8">Preencha seus dados para enviarmos a solicitação para a fábrica.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Seu Nome</label>
                                <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: João Silva" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Telefone / WhatsApp</label>
                                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(00) 00000-0000" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nome da Equipe / Turma (Opcional)</label>
                                <input value={clientTeam} onChange={e => setClientTeam(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Terceirão 2024" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                                    <Info className="w-3 h-3" /> Informações Adicionais
                                </label>
                                <textarea
                                    value={clientNotes}
                                    onChange={e => setClientNotes(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-xs"
                                    placeholder="Ex: Data de entrega preferencial, dúvidas sobre tamanho, etc."
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                            Enviar Solicitação
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {checkoutSuccess && (
                <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-md z-[400] flex items-center justify-center p-4 animate-in zoom-in-95 duration-500">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Sucesso!</h2>
                        <p className="text-slate-500 text-sm font-medium mb-8">
                            Recebemos sua solicitação! Nossa equipe entrará em contato pelo WhatsApp em breve para confirmar os detalhes.
                        </p>
                        <button
                            onClick={() => { setCheckoutSuccess(false); }}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all"
                        >
                            Voltar à Loja
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicStore;
