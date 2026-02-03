
import React, { useState, useMemo, useRef } from 'react';
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
  Eye,
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
  Minus
} from 'lucide-react';
import { FABRICS, GRADES } from '../constants.tsx';
import { Product } from '../types.ts';
import { productService } from '../services/productService.ts';
import { CatalogOrder, CatalogOrderItem } from '../types.ts';
import { catalogOrderService } from '../services/catalogOrderService.ts';
import { clientService } from '../services/clientService.ts';
import { InventoryItem, ProductRecipe } from '../types.ts';
import { inventoryService } from '../services/inventoryService.ts';
import { FlaskConical, Beaker } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  readOnly?: boolean;
}

// Extended Cart Item for autonomous flow
interface CartItem {
  productId: string;
  productName: string;
  imageUrl: string;
  size: string; // Can be empty initially
  quantity: number;
  notes: string;
  allowedGrades: any; // To allow size selection in cart
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

  // Public View State
  const [publicViewingProduct, setPublicViewingProduct] = useState<Product | null>(null);

  // Cart State (Autonomous Flow)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', team: '', phone: '', email: '' });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers for Recipe ---
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

  const handleAddRecipeItem = async (inventoryItemId: string, qty: number) => {
    if (!editingProduct) return;
    try {
      const newItem = await productService.addRecipeItem(
        editingProduct.id,
        inventoryItemId,
        qty
      );
      if (newItem) setRecipeItems(prev => [...prev, newItem]);
    } catch (e) {
      console.error("Error adding recipe item", e);
      alert("Erro ao adicionar item à receita.");
    }
  };

  const handleRemoveRecipeItem = async (recipeId: string) => {
    try {
      await productService.removeRecipeItem(recipeId);
      setRecipeItems(prev => prev.filter(i => i.id !== recipeId));
    } catch (e) {
      console.error("Erro removing", e);
    }
  };

  // --- Filtering & Sorting ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFabric = fabricFilter === 'all' || product.category === fabricFilter;
      return matchesSearch && matchesFabric;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
      if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
      return 0;
    });
  }, [products, searchTerm, fabricFilter, sortBy]);

  // --- Handlers ---
  // --- Handlers (Robust) ---
  const generateRandomSKU = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PROD-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleEditClick = (product: any) => setEditingProduct({ ...product });

  const toggleStatus = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      const updated = await productService.toggleStatus(id, product.status);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: updated.status } : p));
    } catch (e) {
      console.error("Error toggling status", e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Deseja excluir este produto permanentemente?')) {
      try {
        await productService.delete(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (e) {
        console.error("Error deleting product", e);
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct.name || !editingProduct.basePrice) {
      alert("Preencha nome e preço.");
      return;
    }
    try {
      let savedProduct;
      // If no ID, it's a create
      if (!editingProduct.id) {
        savedProduct = await productService.create({
          name: editingProduct.name,
          sku: editingProduct.sku || generateRandomSKU(),
          basePrice: editingProduct.basePrice,
          category: editingProduct.category,
          status: 'active',
          imageUrl: editingProduct.imageUrl,
          allowedGrades: editingProduct.allowedGrades,
          measurements: editingProduct.measurements
        });
        setProducts(prev => [...prev, savedProduct]);
      } else {
        // Update
        savedProduct = await productService.update(editingProduct.id, {
          name: editingProduct.name,
          sku: editingProduct.sku,
          basePrice: editingProduct.basePrice,
          category: editingProduct.category,
          imageUrl: editingProduct.imageUrl,
          allowedGrades: editingProduct.allowedGrades,
          measurements: editingProduct.measurements
        });
        setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
      }
      setEditingProduct(null);
    } catch (e) {
      console.error("Error saving product", e);
      alert("Erro ao salvar produto");
    }
  };

  // Automatic Image Adjustment (Centering & 1:1 Contain - FULL VISIBILITY)
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
            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate scale to FIT/CONTAIN
            const scale = Math.min(size / img.width, size / img.height);
            const w = img.width * scale;
            const h = img.height * scale;

            // Center the image
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
      } catch (err) {
        console.error("Error adjusting image:", err);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleGenerateDescription = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingProduct?.name) {
      alert("Por favor, preencha o nome do produto primeiro.");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const { generateProductDescription } = await import('../services/aiService');
      const desc = await generateProductDescription(editingProduct.name, editingProduct.category);
      setEditingProduct((prev: any) => prev ? ({ ...prev, description: desc }) : null);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar descrição automática. Verifique sua conexão ou chave de API.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // --- Public Catalog Handlers ---
  const handleDirectAddToCart = (product: Product) => {
    const newItem: CartItem = {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      size: '', // User must select in cart
      quantity: 1,
      notes: '',
      allowedGrades: product.allowedGrades || {}
    };

    setCart(prev => [...prev, newItem]);
    setIsCartOpen(true); // Open cart immediately
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    const newCart = [...cart];
    (newCart[index] as any)[field] = value;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinishOrder = async () => {
    // Validation
    if (!clientForm.name || !clientForm.phone) {
      alert("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    // Check sizes
    if (cart.some(item => !item.size)) {
      alert("Por favor, selecione o tamanho de todos os itens no carrinho.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // 1. Create Client
      const newClient = await clientService.create({
        name: clientForm.name,
        whatsapp: clientForm.phone,
        email: clientForm.email || `temp_${Date.now()}@system.com`,
        address: 'Cliente do Catálogo'
      });

      // 2. Create Order
      const orderData: Omit<CatalogOrder, 'id' | 'createdAt'> = {
        clientId: newClient.id,
        clientName: clientForm.team ? `${clientForm.name} (${clientForm.team})` : clientForm.name,
        clientPhone: clientForm.phone,
        clientTeam: clientForm.team,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          quantity: item.quantity,
          notes: item.notes
        })),
        status: 'pending',
        totalEstimated: 0 // Will be calculated by admin
      };

      await catalogOrderService.create(orderData);

      alert("Pedido enviado com sucesso! Entraremos em contato em breve.");
      setCart([]);
      setIsCartOpen(false);
      setClientForm({ name: '', team: '', phone: '', email: '' });
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleShareCatalog = () => {
    const url = window.location.href; // In real app, this would be the public URL
    navigator.clipboard.writeText(url);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in slide-in-from-top duration-700">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            CONTROLE DE LOJA <span className="text-emerald-500">.</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Gerencie o que aparece (ou não) na sua Mini Loja Pública
          </p>
        </div>

        {readOnly ? (
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl transition-all border border-slate-800 shadow-lg group w-full md:w-auto flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-black uppercase text-xs tracking-widest">Ver Carrinho</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg shadow-rose-500/30 animate-bounce">
                  {cart.length}
                </span>
              )}
            </button>
            <button
              onClick={handleShareCatalog}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 group w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="font-black uppercase text-xs tracking-widest block md:hidden">Compartilhar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingProduct({
              id: '',
              name: '',
              sku: '',
              category: 'Dry-Fit',
              basePrice: 0,
              imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=60',
              allowedGrades: GRADES.reduce((acc, g) => ({ ...acc, [g.label]: g.sizes }), {}),
              measurements: {},
              description: ''
            })}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-3 hover:scale-105 active:scale-95 group w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Novo Produto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-10 space-y-4 animate-in slide-in-from-right duration-700 delay-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50 flex items-center transition-all focus-within:bg-slate-900 focus-within:border-indigo-500/50 focus-within:shadow-lg focus-within:shadow-indigo-500/10">
            <Search className="w-5 h-5 text-slate-500 ml-3" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-600 focus:ring-0 text-sm font-bold uppercase tracking-wider px-4 py-2"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {['all', ...FABRICS].map((fabric) => (
              <button
                key={fabric}
                onClick={() => setFabricFilter(fabric)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${fabricFilter === fabric
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
              >
                {fabric === 'all' ? 'Todos' : fabric}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-in slide-in-from-bottom duration-1000 delay-200">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => setEditingProduct({ ...product })}
            className="group relative bg-slate-900/40 rounded-[2rem] border border-slate-800/50 overflow-hidden hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer flex flex-col"
          >
            {/* Image Aspect Ratio Container */}
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-950">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 z-10" />
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />

              {/* Floating ROI Badge - Only logic, can be hidden for customer */}
              {!readOnly && (
                <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white tracking-widest">R$ {product.basePrice.toFixed(0)}</span>
                </div>
              )}
              {/* ReadOnly Price Badge */}
              {readOnly && (
                <div className="absolute bottom-4 right-4 z-20 bg-indigo-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/50 shadow-lg">
                  <span className="text-xs font-black text-white tracking-widest">R$ {product.basePrice.toFixed(0)}</span>
                </div>
              )}
            </div>

            {/* Content using Flex Grow to push footer down */}
            <div className="p-5 relative z-20 flex-1 flex flex-col">
              <div className="mb-4">
                <span className="inline-block px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                  {product.category}
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-100 uppercase tracking-tight leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </div>

              {/* Store Status Toggle */}
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${product.published ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${product.published ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {product.published ? 'Na Loja' : 'Oculto'}
                  </span>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    // Ideally, togglePublished would be a service call.
                    // For now, I'll update the 'published' field in update call or new method.
                    try {
                      const newStatus = !product.published;
                      await productService.update(product.id, { published: newStatus });
                      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, published: newStatus } : p));
                    } catch (error) {
                      console.error("Error updating published status", error);
                    }
                  }}
                  className={`text-[10px] uppercase font-bold px-3 py-1 rounded-lg transition-colors border ${product.published ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
                >
                  {product.published ? 'Ocultar' : 'Publicar'}
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Editar Visual
                </span>
                <div
                  onClick={() => setEditingProduct({ ...product })}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Modal - Full Screen Mobile */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] rounded-t-[2rem] md:rounded-[2.5rem] w-full max-w-2xl border-t md:border border-slate-800 p-6 md:p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-500 h-[85vh] md:h-auto flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Seu Carrinho</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{cart.length} Itens adicionados</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="bg-slate-900 text-slate-400 p-3 rounded-xl hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 flex flex-col items-center">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-bold text-sm uppercase tracking-wide">Seu carrinho está vazio.</p>
                    <button onClick={() => setIsCartOpen(false)} className="mt-4 text-indigo-400 font-black text-xs uppercase tracking-widest hover:underline">
                      Voltar ao Catálogo
                    </button>
                  </div>
                ) : (
                  cart.map((item, index) => {
                    // Get all unique sizes from allowedGrades
                    const allSizes = Object.values(item.allowedGrades || {}).flat().filter((v: any, i, a) => a.indexOf(v) === i) as string[];

                    return (
                      <div key={index} className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex flex-col gap-4 group relative">
                        {/* Remove Button Absolute */}
                        <button onClick={() => removeFromCart(index)} className="absolute top-4 right-4 text-slate-600 hover:text-rose-500 transition-colors p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex gap-4">
                          <div className="w-20 h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0">
                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 pr-8">
                            <h5 className="font-black text-slate-200 uppercase tracking-tight text-sm leading-tight mb-1">{item.productName}</h5>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Configure o item abaixo</p>

                            {/* Size Selector */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {allSizes.length > 0 ? allSizes.map(size => (
                                <button
                                  key={size}
                                  onClick={() => updateCartItem(index, 'size', size)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${item.size === size
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                    }`}
                                >
                                  {size}
                                </button>
                              )) : <span className="text-xs text-rose-500">Sem tamanhos definidos</span>}
                            </div>
                          </div>
                        </div>

                        {/* Qty & Notes */}
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-5 md:col-span-4">
                            <label className="text-[8px] uppercase font-black text-slate-600 tracking-widest ml-1 block mb-1">Quantidade</label>
                            <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                              <button
                                onClick={() => updateCartItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateCartItem(index, 'quantity', Math.max(1, parseInt(e.target.value)))}
                                className="flex-1 bg-transparent text-center text-sm font-bold text-white outline-none w-full appearance-none"
                              />
                              <button
                                onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="col-span-7 md:col-span-8">
                            <label className="text-[8px] uppercase font-black text-slate-600 tracking-widest ml-1 block mb-1">Nomes / Detalhes</label>
                            <input
                              placeholder="Ex: Nome da camisa..."
                              value={item.notes}
                              onChange={(e) => updateCartItem(index, 'notes', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>

                        {!item.size && (
                          <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-wide">Selecione o tamanho</span>
                          </div>
                        )}
                      </div>
                    )
                  }))}

              </div>

              {/* Client Form */}
              {cart.length > 0 && (
                <div className="space-y-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 mt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Users className="w-4 h-4" />
                    </span>
                    <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Gerenciar Produtos</h1>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Seu Nome</label>
                      <input
                        placeholder="Ex: João da Silva"
                        value={clientForm.name}
                        onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Equipe</label>
                        <input
                          placeholder="Ex: Terceirão"
                          value={clientForm.team || ''}
                          onChange={(e) => setClientForm({ ...clientForm, team: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">WhatsApp</label>
                        <input
                          placeholder="(99) 99999-9999"
                          value={clientForm.phone}
                          onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-6 mt-4 border-t border-slate-800 flex gap-4 md:flex-row flex-col-reverse">
              <button onClick={() => setIsCartOpen(false)} className="py-4 px-6 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                Continuar Comprando
              </button>
              <button
                onClick={handleFinishOrder}
                disabled={isSubmittingOrder}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isSubmittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isSubmittingOrder ? 'Enviando...' : 'Finalizar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Admin Modal logic would go here if we were preserving it, but likely we need to keep it since `readOnly` toggle exists. 
            For brevity in this tool call, I'm focusing on the refactor. 
            However, I must ensure I don't delete the Admin Modal.
            Checking the previous file content, lines 1000+ contained the admin modal?
            Actually, the admin modal was likely inside the main component before. 
            Wait, looking at the file read (Step 2415), the Cart Modal was at the end.
            Where is the Admin Product Edit modal?
            It seems `editingProduct` state controls it.
            It was likely in the truncated part of the file or I need to make sure I don't delete it.
            
            Strategy: The previous file read showed lines 900-1157 which contained the PUBLIC VIEW modal (lines 900-1000) and CART modal (1002+).
            The ADMIN EDIT modal is usually rendered when `editingProduct && !readOnly`.
            I need to locate where that was.
            Let's assume the previous `Catalog.tsx` structure was:
            Header
            Filters
            Grid
            {editingProduct && <Modal ... />}
            {publicViewingProduct && <PublicModal ... />}
            {isCartOpen && <CartModal ... />}
            
            By replacing standard Catalog, I am removing `publicViewingProduct` modal because the new requirement is "Direct Add to Cart" -> No intermediate modal.
            So removing `publicViewingProduct` logic is correct as per "UX: Click-to-Add Flow".
            
            But I must keep the ADMIN `editingProduct` modal.
            I will append the ADMIN modal code (which I haven't changed) at the end, or ensure I don't lose it.
            Since I haven't seen the Admin Modal code in the `view_file` (it was likely in middle lines), I should be careful.
            
            Wait, I only viewed lines 1-100 and 900-1157. The middle is missing.
            The Admin Modal is critical.
            I will perform a `read_file` of the middle section to capture the Admin Modal code, then construct the full file.
            
            actually, I can just not touch the Admin Modal if I target only the Public/Cart sections.
            But the `grid` layout change requires editing the main JSX.
            
            Let's do this: I will read the Full File to be safe, then replace.
        */}
      {/* Admin Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-2xl border border-slate-800 p-8 md:p-10 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
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
                <button
                  onClick={() => setActiveRecipeTab('details')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeRecipeTab === 'details' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Detalhes
                </button>
                <button
                  onClick={() => setActiveRecipeTab('composition')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeRecipeTab === 'composition' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'} flex items-center gap-2`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Composição
                </button>
              </div>
            )}

            <div className="min-h-[400px]">
              {activeRecipeTab === 'details' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-64 h-64 rounded-[2.5rem] bg-slate-900 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative transition-all hover:border-indigo-500/50 shadow-inner"
                    >
                      {isProcessingImage ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Ajustando Proporção...</span>
                        </div>
                      ) : editingProduct.imageUrl ? (
                        <>
                          <img src={editingProduct.imageUrl} className="w-full h-full object-contain bg-white" alt="Preview" />
                          <div className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                            <Camera className="w-10 h-10 text-white mb-2" />
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Mudar Foto</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-slate-700 mb-4" />
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] text-center px-8">Clique para upload</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    <p className="text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">Foto ajustada automaticamente (Sem Cortar)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Modelo</label>
                      <input
                        placeholder="Ex: Camiseta Dry Masculina 2024"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 font-bold outline-none"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 col-span-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descrição Comercial</span>
                        <button
                          onClick={handleGenerateDescription}
                          disabled={isGeneratingDescription}
                          className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 transition-all disabled:opacity-50"
                        >
                          {isGeneratingDescription ? 'Gerando...' : '✨ AI Gerar'}
                        </button>
                      </div>
                      <textarea
                        placeholder="Descreva o produto..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium outline-none h-24 resize-none"
                        value={editingProduct.description || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Base (R$)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 font-black text-lg outline-none"
                        value={editingProduct.basePrice}
                        onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-500 uppercase">Custo (R$)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-950 border border-emerald-900/50 rounded-2xl px-5 py-4 text-emerald-400 focus:ring-2 focus:ring-emerald-500 font-black text-lg outline-none"
                        value={editingProduct.costPrice || ''}
                        placeholder="0.00"
                        onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                        <span>Referência / SKU</span>
                        {/* <button onClick={() => setEditingProduct({...editingProduct, sku: generateRandomSKU()})} className="text-indigo-400 hover:text-indigo-300 transition-colors">Gerar Novo</button> */}
                      </label>
                      <input
                        placeholder="EST-001"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 uppercase font-bold"
                        value={editingProduct.sku}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4 col-span-full">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grades e Tamanhos Disponíveis</label>
                      <p className="text-[10px] text-slate-400"> Selecione quais tamanhos específicos estarão disponíveis para este modelo.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {GRADES.map(grade => {
                          const currentAllowed = editingProduct.allowedGrades || {};
                          const selectedSizes = currentAllowed[grade.label] || [];
                          const isGradeActive = selectedSizes.length > 0;

                          const toggleGrade = () => {
                            const newAllowed = { ...currentAllowed };
                            if (isGradeActive) {
                              delete newAllowed[grade.label];
                            } else {
                              newAllowed[grade.label] = [...grade.sizes];
                            }
                            setEditingProduct({ ...editingProduct, allowedGrades: newAllowed });
                          };

                          return (
                            <div key={grade.label} className={`rounded-3xl border transition-all overflow-hidden ${isGradeActive ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}>
                              <div className="px-5 py-4 flex items-center justify-between bg-slate-900/50 border-b border-slate-800/50">
                                <span className="font-black text-xs uppercase tracking-wider text-slate-300">{grade.label}</span>
                                <button
                                  onClick={toggleGrade}
                                  className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${isGradeActive ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white'}`}
                                >
                                  {isGradeActive ? 'Todos' : 'Nenhum'}
                                </button>
                              </div>

                              {selectedSizes.length > 0 && (
                                <div className="col-span-full pt-2 p-2">
                                  <div className="flex items-center gap-2 mb-2 px-1">
                                    <Ruler className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Tabela de Medidas (cm)</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {selectedSizes.map((size: string) => (
                                      <div key={size} className="flex gap-2 items-center bg-slate-900/30 p-1.5 rounded-lg border border-slate-800/50">
                                        <span className="text-[10px] font-black text-slate-300 w-8 text-center bg-slate-800 py-1 rounded">{size}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                          <div className="relative">
                                            <input
                                              placeholder="0"
                                              type="number"
                                              value={editingProduct.measurements?.[size]?.height || ''}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const newMeasurements = { ...editingProduct.measurements };
                                                if (!newMeasurements[size]) newMeasurements[size] = { height: 0, width: 0 };
                                                newMeasurements[size].height = parseFloat(e.target.value);
                                                setEditingProduct({ ...editingProduct, measurements: newMeasurements });
                                              }}
                                              className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-2 py-1.5 text-[10px] text-white text-center outline-none focus:border-indigo-500 focus:bg-indigo-900/10 transition-colors"
                                            />
                                            <span className="absolute right-2 top-1.5 text-[8px] text-slate-600 font-bold pointer-events-none">ALT</span>
                                          </div>
                                          <div className="relative">
                                            <input
                                              placeholder="0"
                                              type="number"
                                              value={editingProduct.measurements?.[size]?.width || ''}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const newMeasurements = { ...editingProduct.measurements };
                                                if (!newMeasurements[size]) newMeasurements[size] = { height: 0, width: 0 };
                                                newMeasurements[size].width = parseFloat(e.target.value);
                                                setEditingProduct({ ...editingProduct, measurements: newMeasurements });
                                              }}
                                              className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-2 py-1.5 text-[10px] text-white text-center outline-none focus:border-indigo-500 focus:bg-indigo-900/10 transition-colors"
                                            />
                                            <span className="absolute right-2 top-1.5 text-[8px] text-slate-600 font-bold pointer-events-none">LARG</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-500/20 p-3 rounded-xl block">
                        <Beaker className="w-8 h-8 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-indigo-300 font-black uppercase tracking-widest text-sm mb-1">Receita de Produção</h4>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                          Defina quais materiais do estoque são consumidos para produzir <strong>1 unidade</strong> deste produto.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {recipeItems.map((item) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                            <FlaskConical className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-slate-200 font-bold">{item.inventoryItemName || 'Item'}</p>
                            <p className="text-xs text-slate-500 font-black uppercase tracking-wider">
                              Consumo: <span className="text-indigo-400">{item.quantityRequired} {item.unit}</span> / un
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveRecipeItem(item.id)}
                          className="text-slate-600 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {recipeItems.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-600 font-medium">Nenhum material vinculado.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-800/50">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Adicionar Material</p>
                    <RecipeAdder inventory={inventory} onAdd={handleAddRecipeItem} />
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end gap-4">
                <button onClick={() => setEditingProduct(null)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-800 transition-all">Cancelar</button>
                <button
                  onClick={handleSaveProduct}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
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
