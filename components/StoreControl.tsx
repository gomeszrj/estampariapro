import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowUpDown,
  Tag,
  Edit3,
  Save,
  X,
  Upload,
  Camera,
  Share2,
  ExternalLink,
  Trash2,
  Loader2,
  Filter,
  AlertCircle,
  Check,
  CheckCircle2,
  Users,
  ShoppingCart,
  ShoppingBag,
  Ruler,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  User,
  FlaskConical,
  Beaker
} from 'lucide-react';
import { FABRICS, GRADES } from '../constants';
import { Product, OrderStatus, OrderType, PaymentStatus, Client, InventoryItem, ProductRecipe } from '../types';
import { productService } from '../services/productService';
import { catalogOrderService } from '../services/catalogOrderService';
import { clientService } from '../services/clientService';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { inventoryService } from '../services/inventoryService';

interface CatalogProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  readOnly?: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  imageUrl: string;
  size: string;
  quantity: number;
  notes: string;
  price: number;
  allowedGrades: any;
}

const RecipeAdder = ({ inventory, onAdd }: { inventory: InventoryItem[], onAdd: (id: string, qty: number) => void }) => {
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState('');

  const handleAdd = () => {
    if (!selectedId || !qty) return;
    onAdd(selectedId, Number(qty));
    setSelectedId('');
    setQty('');
  };

  const selectedItem = inventory.find(i => i.id === selectedId);

  return (
    <div className="flex gap-4 items-end">
      <div className="flex-1 space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Material</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">Selecione...</option>
          {inventory.map(item => (
            <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
          ))}
        </select>
      </div>
      <div className="w-32 space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd ({selectedItem?.unit || 'Un'})</label>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={!selectedId || !qty}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

const StoreControl: React.FC<CatalogProps> = ({ products, setProducts, readOnly }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fabricFilter, setFabricFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'none'>('none');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Recipe State
  const [activeRecipeTab, setActiveRecipeTab] = useState<'details' | 'composition'>('details');
  const [recipeItems, setRecipeItems] = useState<ProductRecipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // POS / Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); // For Mobile or ReadOnly view

  // POS Specific System State
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentStatus>(PaymentStatus.FULL);
  const [posPaymentTypeLabel, setPosPaymentTypeLabel] = useState('PIX'); // Visual label
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Public Catalog Form
  const [clientForm, setClientForm] = useState({ name: '', team: '', phone: '', email: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data for POS
  useEffect(() => {
    if (!readOnly) {
      clientService.getAll().then(setClients);
      inventoryService.getAll().then(setInventory); // Load inventory for recipe
    }
  }, [readOnly]);

  const loadRecipe = async (productId: string) => {
    setLoadingRecipe(true);
    try {
      const [recipes, invItems] = await Promise.all([
        productService.getRecipe(productId),
        inventoryService.getAll()
      ]);
      setRecipeItems(recipes || []);
      setInventory(invItems || []);
    } catch (e) {
      console.error("Error loading recipe", e);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleEditClick = (product: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct({ ...product });
    loadRecipe(product.id);
  };

  const handleAddRecipeItem = async (inventoryItemId: string, qty: number) => {
    if (!editingProduct) return;
    const newItem = await productService.addRecipeItem(editingProduct.id, inventoryItemId, qty);
    if (newItem) setRecipeItems(prev => [...prev, newItem]);
  };

  const handleRemoveRecipeItem = async (recipeId: string) => {
    await productService.removeRecipeItem(recipeId);
    setRecipeItems(prev => prev.filter(i => i.id !== recipeId));
  };


  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFabric = fabricFilter === 'all' || product.category === fabricFilter;
      // In ReadOnly (Public), only show published
      if (readOnly && !product.published) return false;
      return matchesSearch && matchesFabric;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
      if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
      return 0;
    });
  }, [products, searchTerm, fabricFilter, sortBy, readOnly]);

  // --- Image Handling ---
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 800; // Fixed size
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min(size / img.width, size / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (size - w) / 2;
            const y = (size - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.90));
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      setIsProcessingImage(true);
      try {
        const adjustedImage = await processImage(file);
        setEditingProduct({ ...editingProduct, imageUrl: adjustedImage });
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleGenerateDescription = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingProduct?.name) {
      alert("Nome obrigatório");
      return;
    }
    setIsGeneratingDescription(true);
    try {
      // Dynamic import to avoid circular dependency issues if any
      const { generateProductDescription } = await import('../services/aiService');
      const desc = await generateProductDescription(editingProduct.name, editingProduct.category);
      setEditingProduct((prev: any) => ({ ...prev, description: desc }));
    } catch (e) { console.error(e); }
    finally { setIsGeneratingDescription(false); }
  }

  const handleSaveProduct = async () => {
    if (!editingProduct.name || !editingProduct.basePrice) {
      alert("Nome e Preço obrigatórios");
      return;
    }
    // Save Logic (Create or Update)
    let saved;
    if (editingProduct.id) {
      saved = await productService.update(editingProduct.id, editingProduct);
      setProducts(p => p.map(x => x.id === saved.id ? saved : x));
    } else {
      saved = await productService.create({ ...editingProduct, sku: editingProduct.sku || 'N/A' });
      setProducts(p => [...p, saved]);
    }
    setEditingProduct(null);
  };

  // --- CART / POS LOGIC ---

  const handleAddToCart = (product: Product) => {
    // If POS (Internal), default to first size or ask?
    // We'll just add and let them edit size in cart
    const newItem: CartItem = {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      size: '', // Must select
      quantity: 1,
      notes: '',
      price: product.basePrice,
      allowedGrades: product.allowedGrades || {}
    };
    setCart(prev => [...prev, newItem]);
    if (readOnly) setIsCartOpen(true);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // --- CHECKOUT (POS) ---
  const handlePOSCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedClientId) {
      alert("Selecione um cliente para finalizar a venda.");
      return;
    }
    if (cart.some(i => !i.size)) {
      alert("Selecione o tamanho dos itens.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const client = clients.find(c => c.id === selectedClientId);
      const today = new Date().toISOString();

      // 1. Create Order
      const newOrder = await orderService.create({
        orderNumber: Math.floor(Math.random() * 10000).toString(),
        clientId: client?.id || null,
        clientName: client?.name || 'Venda Balcão',
        createdAt: today,
        deliveryDate: today.split('T')[0], // Immediate delivery
        status: OrderStatus.FINISHED, // Direct finish
        paymentStatus: PaymentStatus.FULL, // Assume paid if POS
        totalValue: cartTotal,
        amountPaid: cartTotal,
        orderType: OrderType.SALE,
        origin: 'store', // Origin Store
        items: cart.map(item => ({
          id: Math.random().toString(),
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.price,
          fabricName: '',
          fabricId: '',
          gradeLabel: 'Masculino' // Default
        }))
      });

      // 2. Create Transaction (Income)
      await financeService.create({
        type: 'income',
        category: 'sale',
        amount: cartTotal,
        description: `Venda Loja #${newOrder.orderNumber} - ${client?.name}`,
        date: today
      });

      // 3. Clear
      setCart([]);
      alert("Venda registrada com sucesso!");
    } catch (e) {
      console.error("Error POS checkout", e);
      alert("Erro ao finalizar venda.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // --- CHECKOUT (PUBLIC) ---
  const handlePublicCheckout = async () => {
    if (!clientForm.name || !clientForm.phone) { alert("Nome e Whats obrigatórios"); return; }
    if (cart.some(i => !i.size)) { alert("Selecione tamanhos"); return; }

    setIsSubmittingOrder(true);
    try {
      const newClient = await clientService.create({ name: clientForm.name, whatsapp: clientForm.phone, email: clientForm.email || '', address: 'Online' });
      const orderData = {
        clientId: newClient.id,
        clientName: clientForm.name,
        clientPhone: clientForm.phone,
        items: cart.map(i => ({ productId: i.productId, productName: i.productName, size: i.size, quantity: i.quantity, notes: i.notes })),
        status: 'pending' as any,
        totalEstimated: 0
      };
      await catalogOrderService.create(orderData);
      alert("Solicitação enviada!");
      setCart([]);
      setIsCartOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar.");
    } finally { setIsSubmittingOrder(false); }
  };


  return (
    <div className={`min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30 ${!readOnly ? 'flex overflow-hidden h-screen' : 'p-4 md:p-8'}`}>

      {/* MAIN CONTENT (If POS, this is Left Side. If Public, Full Width) */}
      <div className={`${!readOnly ? 'flex-1 flex flex-col h-full overflow-hidden' : 'w-full max-w-7xl mx-auto'}`}>

        {/* HEADER */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${!readOnly ? 'p-8 pb-4' : 'mb-8'}`}>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              {readOnly ? 'CATÁLOGO DIGITAL' : 'CAIXA / LOJA'}
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              {readOnly ? 'Solicite seu orçamento online' : 'Ponto de Venda & Gestão'}
            </p>
          </div>

          {!readOnly && (
            <button
              onClick={() => setEditingProduct({
                id: '', name: '', sku: '', category: 'Dry-Fit', basePrice: 0, costPrice: 0, imageUrl: '',
                allowedGrades: GRADES.reduce((acc, g) => ({ ...acc, [g.label]: g.sizes }), {}),
                measurements: {}, description: ''
              })}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          )}
          {readOnly && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 relative shadow-lg"
            >
              <ShoppingBag className="w-4 h-4" /> Carrinho
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-rose-500 w-5 h-5 rounded-full flex items-center justify-center text-[9px]">{cart.length}</span>}
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className={`${!readOnly ? 'px-8 pb-4' : 'mb-8'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50 flex items-center">
              <Search className="w-5 h-5 text-slate-500 ml-3" />
              <input
                className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-600 focus:ring-0 text-sm font-bold uppercase tracking-wider px-4 py-2"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['all', ...FABRICS].map(f => (
                <button key={f} onClick={() => setFabricFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${fabricFilter === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  {f === 'all' ? 'Todos' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className={`${!readOnly ? 'flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar' : ''}`}>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id}
                className="group bg-slate-900/40 rounded-3xl border border-slate-800/50 overflow-hidden hover:border-indigo-500/30 transition-all cursor-pointer relative flex flex-col"
                onClick={() => handleAddToCart(product)}
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-slate-950">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900"><Tag className="w-8 h-8 opacity-20" /></div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <div className="bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/10">
                      <span className="text-white text-[10px] font-black tracking-widest">R$ {product.basePrice.toFixed(2)}</span>
                    </div>
                    {!readOnly && product.costPrice > 0 && (
                      <div className="bg-emerald-900/80 backdrop-blur px-1.5 py-0.5 rounded-lg border border-emerald-500/30 shadow-lg">
                        <span className="text-emerald-400 text-[8px] font-bold tracking-widest">
                          LUCRO: R$ {(product.basePrice - product.costPrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-black text-slate-100 uppercase leading-snug line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">{product.category}</p>

                  {!readOnly && (
                    <div className="mt-auto pt-3 border-t border-slate-800 flex justify-between items-center">
                      <div className="flex bg-slate-800 rounded-full p-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            productService.update(product.id, { published: !product.published }).then(() => {
                              setProducts(prev => prev.map(p => p.id === product.id ? { ...p, published: !p.published } : p));
                            });
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${product.published ? 'bg-emerald-500 text-slate-900' : 'text-slate-500 hover:text-white'}`}
                          title={product.published ? 'Publicado na Loja (Clique para ocultar)' : 'Oculto da Loja (Clique para publicar)'}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleEditClick(product, e)}
                          className="w-8 h-8 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                          title="Editar Ficha"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  {readOnly && (
                    <button className="mt-auto w-full py-2 bg-indigo-600/10 text-indigo-400 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-colors group-hover:block hidden">
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* POS SIDEBAR (INTERNAL ONLY) */}
      {!readOnly && (
        <div className="w-[450px] bg-[#020617] border-l border-slate-800 flex flex-col h-full shadow-2xl z-20">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-500" />
              Carrinho ({cart.length})
            </h2>
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Carrinho Vazio</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex gap-3 relative group">
                  <button onClick={() => removeFromCart(idx)} className="absolute top-2 right-2 text-slate-600 hover:text-rose-500 p-1"><X className="w-3 h-3" /></button>
                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0">
                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-200 uppercase truncate">{item.productName}</h4>
                    <div className="flex flex-wrap gap-1 my-2">
                      {(Object.values(item.allowedGrades || {}).flat() as string[]).map(s => (
                        <button
                          key={s}
                          onClick={() => updateCartItem(idx, 'size', s)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border ${item.size === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                        >
                          {s}
                        </button>
                      ))}
                      {(!item.allowedGrades || Object.keys(item.allowedGrades).length === 0) && <span className="text-[9px] text-rose-500">Sem tamanhos</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800">
                        <button onClick={() => updateCartItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="px-2 text-slate-400 hover:text-white">-</button>
                        <span className="text-xs font-black px-1">{item.quantity}</span>
                        <button onClick={() => updateCartItem(idx, 'quantity', item.quantity + 1)} className="px-2 text-slate-400 hover:text-white">+</button>
                      </div>
                      <span className="text-xs font-black text-indigo-400">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* POS Footer */}
          <div className="p-6 bg-[#0f172a] border-t border-slate-800 space-y-4">
            {/* Client Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Cliente</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'PIX', icon: QrCode },
                  { label: 'DINHEIRO', icon: Banknote },
                  { label: 'CARTÃO', icon: CreditCard }
                ].map(m => (
                  <button
                    key={m.label}
                    onClick={() => setPosPaymentTypeLabel(m.label)}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${posPaymentTypeLabel === m.label ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}
                  >
                    <m.icon className="w-4 h-4" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-end pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Geral</span>
              <span className="text-3xl font-black text-white">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <button
              onClick={handlePOSCheckout}
              disabled={isSubmittingOrder}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Finalizar Venda
            </button>
          </div>
        </div>
      )}

      {/* PUBLIC CART MODAL (Only for ReadOnly) */}
      {readOnly && isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2rem] w-full max-w-lg border border-slate-800 p-8 shadow-2xl relative">
            <button onClick={() => setIsCartOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Seu Pedido</h3>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-200 text-xs uppercase">{item.productName}</p>
                    <div className="flex gap-2 mt-1">
                      <select value={item.size} onChange={e => updateCartItem(idx, 'size', e.target.value)} className="bg-slate-950 border border-slate-800 rounded text-[10px] px-2 py-1 text-white">
                        <option value="">Tam</option>
                        {(Object.values(item.allowedGrades || {}).flat() as string[]).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" value={item.quantity} onChange={e => updateCartItem(idx, 'quantity', parseInt(e.target.value))} className="w-12 bg-slate-950 border border-slate-800 rounded text-[10px] px-2 py-1 text-white text-center" />
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(idx)}><Trash2 className="w-4 h-4 text-rose-500" /></button>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <input placeholder="Seu Nome" value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold" />
              <input placeholder="WhatsApp" value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold" />
              <button onClick={handlePublicCheckout} disabled={isSubmittingOrder} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all">Enviar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-2xl border border-slate-800 p-8 md:p-10 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-100 tracking-tight uppercase">
                  {editingProduct.id ? 'Ficha do Produto' : 'Cadastrar Modelo'}
                </h3>
                <p className="text-slate-500 font-medium">Gerencie os dados e a ficha técnica.</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-500 hover:text-white bg-slate-800 p-2.5 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            {editingProduct.id && (
              <div className="flex gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 inline-flex">
                <button onClick={() => setActiveRecipeTab('details')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeRecipeTab === 'details' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Detalhes</button>
                <button onClick={() => setActiveRecipeTab('composition')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeRecipeTab === 'composition' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'} flex items-center gap-2`}><FlaskConical className="w-3.5 h-3.5" /> Composição</button>
              </div>
            )}

            {/* Content ... (Same as before but simplified for this write) */}
            <div className="min-h-[400px]">
              {activeRecipeTab === 'details' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* Image Upload */}
                  <div className="flex flex-col items-center">
                    <div onClick={() => fileInputRef.current?.click()} className="w-64 h-64 rounded-[2.5rem] bg-slate-900 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative hover:border-indigo-500/50">
                      {editingProduct.imageUrl ? <img src={editingProduct.imageUrl} className="w-full h-full object-contain bg-white" /> : <Upload className="w-10 h-10 text-slate-700" />}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-full space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Nome</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                    </div>
                    <div className="col-span-full space-y-2">
                      <div className="flex justify-between"><label className="text-[10px] font-black text-slate-500 uppercase">Descrição</label><button onClick={handleGenerateDescription} className="text-[9px] text-indigo-400 font-bold">✨ Gerar AI</button></div>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-medium h-24" value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Preço Venda (R$)</label>
                        <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-black text-lg focus:border-indigo-500 outline-none" value={editingProduct.basePrice} onChange={e => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Custo de Produção (R$)</label>
                        <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-300 font-black text-lg focus:border-indigo-500 outline-none" value={editingProduct.costPrice || ''} onChange={e => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })} />
                      </div>
                    </div>
                    {editingProduct.basePrice && editingProduct.costPrice && (
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest text-right">
                        Lucro: R$ {(editingProduct.basePrice - editingProduct.costPrice).toFixed(2)} ({((editingProduct.basePrice - editingProduct.costPrice) / editingProduct.basePrice * 100).toFixed(0)}%)
                      </p>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Categoria</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 font-bold" value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}>
                        {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Grades Selection */}
                  {/* Grades & Measurements Matrix */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Grades & Medidas (cm)</label>
                    <div className="space-y-3">
                      {GRADES.map(g => {
                        const isActive = editingProduct.allowedGrades?.[g.label];
                        return (
                          <div key={g.label} className={`border rounded-2xl transition-all ${isActive ? 'bg-slate-900/50 border-indigo-500/50' : 'bg-slate-950 border-slate-800'}`}>
                            {/* Header / Toggle */}
                            <div
                              className="p-4 flex items-center justify-between cursor-pointer"
                              onClick={() => {
                                const newGrades = { ...editingProduct.allowedGrades };
                                if (isActive) delete newGrades[g.label];
                                else newGrades[g.label] = g.sizes;
                                setEditingProduct({ ...editingProduct, allowedGrades: newGrades });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'}`}>
                                  {isActive && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}>{g.label}</span>
                              </div>
                              {isActive && <span className="text-[10px] text-indigo-400 font-bold">Configurar Medidas</span>}
                            </div>

                            {/* Measurements Grid (Expanded) */}
                            {isActive && (
                              <div className="px-4 pb-4 border-t border-slate-800/50 pt-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {g.sizes.map(size => {
                                    const key = `${g.label}-${size}`;
                                    const current = editingProduct.measurements?.[key] || { width: '', height: '' };
                                    return (
                                      <div key={size} className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase">{size}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-0.5">
                                            <label className="text-[8px] text-slate-600 font-bold uppercase block text-center">ALTURA</label>
                                            <input
                                              type="text"
                                              placeholder="cm"
                                              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-1 text-center text-xs text-white font-bold focus:border-indigo-500 outline-none"
                                              value={current.height}
                                              onChange={e => {
                                                const val = e.target.value;
                                                setEditingProduct((prev: any) => ({
                                                  ...prev,
                                                  measurements: {
                                                    ...prev.measurements,
                                                    [key]: { ...current, height: val }
                                                  }
                                                }));
                                              }}
                                            />
                                          </div>
                                          <div className="space-y-0.5">
                                            <label className="text-[8px] text-slate-600 font-bold uppercase block text-center">LARGURA</label>
                                            <input
                                              type="text"
                                              placeholder="cm"
                                              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-1 text-center text-xs text-white font-bold focus:border-indigo-500 outline-none"
                                              value={current.width}
                                              onChange={e => {
                                                const val = e.target.value;
                                                setEditingProduct((prev: any) => ({
                                                  ...prev,
                                                  measurements: {
                                                    ...prev.measurements,
                                                    [key]: { ...current, width: val }
                                                  }
                                                }));
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-3 text-center italic">Informe as medidas em Centímetros (cm).</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-3">
                    {recipeItems.map(item => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                        <div><p className="font-bold text-slate-200">{item.inventoryItemName}</p><p className="text-xs text-indigo-400">{item.quantityRequired} {item.unit} / un</p></div>
                        <button onClick={() => handleRemoveRecipeItem(item.id)} className="text-rose-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-slate-800">
                    <RecipeAdder inventory={inventory} onAdd={handleAddRecipeItem} />
                  </div>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end gap-4">
                <button onClick={() => setEditingProduct(null)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-800">Cancelar</button>
                <button onClick={handleSaveProduct} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <Save className="w-4 h-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreControl;
