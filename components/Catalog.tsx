
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
  Users
} from 'lucide-react';
import { FABRICS, GRADES } from '../constants.tsx';
import { Product } from '../types.ts';
import { productService } from '../services/productService.ts';
import { ShoppingCart, ShoppingBag, Ruler } from 'lucide-react';
import { CatalogOrder, CatalogOrderItem } from '../types.ts';
import { catalogOrderService } from '../services/catalogOrderService.ts';
import { clientService } from '../services/clientService.ts';

interface CatalogProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  readOnly?: boolean;
}

const Catalog: React.FC<CatalogProps> = ({ products, setProducts, readOnly }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fabricFilter, setFabricFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'none'>('none');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Public Catalog State
  const [cart, setCart] = useState<CatalogOrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [publicViewingProduct, setPublicViewingProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', team: '' });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... import removed ...

  // ... inside component ...
  const handleEditClick = (product: any) => setEditingProduct({ ...product });

  const toggleStatus = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      await productService.toggleStatus(id, product.status);
      window.dispatchEvent(new Event('refreshData'));
    } catch (e) {
      console.error("Error toggling status", e);
    }
  };

  // ... 

  const handleSaveProduct = async () => {
    try {
      if (!editingProduct.id) {
        await productService.create({
          name: editingProduct.name,
          sku: editingProduct.sku,
          basePrice: editingProduct.basePrice,
          category: editingProduct.category,
          status: 'active',
          imageUrl: editingProduct.imageUrl
        });
      } else {
        await productService.update(editingProduct.id, {
          name: editingProduct.name,
          sku: editingProduct.sku,
          basePrice: editingProduct.basePrice,
          category: editingProduct.category,
          imageUrl: editingProduct.imageUrl
        });
      }
      setEditingProduct(null);
      window.dispatchEvent(new Event('refreshData'));
    } catch (e) {
      console.error("Error saving product", e);
      alert("Erro ao salvar produto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Deseja excluir este produto permanentemente?')) {
      try {
        await productService.delete(id);
        window.dispatchEvent(new Event('refreshData'));
      } catch (e) {
        console.error("Error deleting product", e);
      }
    }
  };

  // Helper for Random SKU
  const generateRandomSKU = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PROD-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
    if (file) {
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleShareCatalog = () => {
    // Generate link based on current domain + query param
    const link = `${window.location.origin}?view=public_catalog`;
    navigator.clipboard.writeText(link);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 3000);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortBy === 'price-asc') result.sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.basePrice - a.basePrice);
    return result;
  }, [products, searchTerm, sortBy]);

  const addToCart = () => {
    if (!publicViewingProduct || !selectedSize) return;

    const newItem: CatalogOrderItem = {
      productId: publicViewingProduct.id,
      productName: publicViewingProduct.name,
      imageUrl: publicViewingProduct.imageUrl,
      size: selectedSize,
      quantity: quantity,
      notes: orderNotes
    };

    setCart([...cart, newItem]);
    setPublicViewingProduct(null);
    setQuantity(1);
    setSelectedSize('');
    setOrderNotes('');
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleFinishOrder = async () => {
    if (!clientForm.name || !clientForm.phone || cart.length === 0) {
      alert("Por favor, preencha nome, telefone e adicione itens.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // 1. Create or Find Client (Simplistic logic: we just create a generic client entry or use existing if we implemented search, 
      // but for now we create a specific 'Lead' or check by phone. 
      // To keep it simple and robust, we will just pass the client info to the order for now, 
      // or create a new client record if email provided.)

      let clientId = '';

      // Try to create client, or if exists (by email/phone logic in service) get id. 
      // For this MVP, we will create a new client entry or update.
      const newClient = await clientService.create({
        name: clientForm.name,
        whatsapp: clientForm.phone,
        email: clientForm.email || `temp_${Date.now()}@system.com`,
        address: 'Cliente do Catálogo'
      });
      clientId = newClient.id;

      // 2. Create Catalog Order
      await catalogOrderService.create({
        clientId,
        clientName: clientForm.name,
        clientTeam: clientForm.team,
        clientPhone: clientForm.phone,
        items: cart,
        totalEstimated: 0 // Calculated by Admin later
      });

      setOrderSuccess(true);
      setCart([]);
      setClientForm({ name: '', phone: '', email: '' });
      setTimeout(() => {
        setOrderSuccess(false);
        setIsCartOpen(false);
      }, 5000);

    } catch (error) {
      console.error("Order error:", error);
      alert("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      {!readOnly ? (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Catálogo de Produtos</h2>
            <p className="text-slate-500 font-medium">Fotos ajustadas automaticamente (Sem Cortes) para visual profissional.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handleShareCatalog}
              className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black transition-all border border-slate-700 uppercase text-[10px] tracking-widest relative overflow-hidden"
            >
              <Share2 className="w-4 h-4 text-indigo-400" />
              Compartilhar Link
              {showShareNotification && (
                <span className="absolute inset-0 bg-emerald-600 text-white flex items-center justify-center animate-in slide-in-from-bottom duration-300">
                  Link Copiado!
                </span>
              )}
            </button>
            <button
              onClick={() => setEditingProduct({
                name: '',
                sku: generateRandomSKU(),
                basePrice: 0,
                category: 'Uniforme',
                imageUrl: '',
                description: '',
                allowedGrades: {
                  'Masculino': GRADES.find(g => g.label === 'Masculino')?.sizes || [],
                  'Feminino': GRADES.find(g => g.label === 'Feminino')?.sizes || [],
                  'Infantil': GRADES.find(g => g.label === 'Infantil')?.sizes || []
                }
              })}
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase text-[10px] tracking-widest"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>
          </div>
        </header>) : (
        /* ReadOnly Header (Public) */
        <header className="flex justify-between items-center relative z-20">
          <div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Catálogo</h2>
            <p className="text-xs text-slate-500 font-bold">Solicite seu orçamento online</p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-slate-900">
                {cart.length}
              </span>
            )}
          </button>
        </header>
      )}

      <div className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou referência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={fabricFilter}
              onChange={(e) => setFabricFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-8 relative"
            >
              <option value="all">Todos os Tecidos</option>
              {FABRICS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-8 relative"
          >
            <option value="none">Ordenar por...</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => readOnly && setPublicViewingProduct(product)}
            className={`bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-sm overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col relative ${readOnly ? 'cursor-pointer' : ''}`}
          >
            <div className="relative aspect-square overflow-hidden bg-black flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ${product.status === 'inactive' ? 'grayscale opacity-40' : ''}`}
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase shadow-xl flex items-center gap-1.5 transition-all border ${product.status === 'active'
                  ? 'bg-emerald-900/90 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-900/90 text-rose-400 border-rose-500/30'
                  }`}>
                  {product.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {product.status === 'active' ? 'Ativo' : 'Pausado'}
                </span>
              </div>
              {!readOnly && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-3 bg-indigo-600 text-white rounded-2xl border border-indigo-500 hover:bg-indigo-500 transition-all shadow-xl"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-3 bg-rose-600 text-white rounded-2xl border border-rose-500 hover:bg-rose-500 transition-all shadow-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-black mb-2 uppercase tracking-[0.2em]">
                  <Tag className="w-3.5 h-3.5" />
                  {product.category}
                </div>
                <h3 className={`text-xl font-black text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors tracking-tight uppercase ${product.status === 'inactive' ? 'text-slate-600' : ''}`}>
                  {product.name}
                </h3>
                <p className="text-[10px] text-slate-500 font-black mt-2 uppercase tracking-widest">REF: {product.sku}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-slate-600 font-black uppercase mb-0.5">Venda</p>
                  <span className={`text-xl font-black tracking-tighter ${product.status === 'active' ? 'text-slate-100' : 'text-slate-600'}`}>
                    R$ {product.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => toggleStatus(product.id)}
                    title={product.status === 'active' ? 'Pausar Venda' : 'Ativar Venda'}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${product.status === 'active'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      }`}
                  >
                    {product.status === 'active' ? <Eye className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-2xl border border-slate-800 p-8 md:p-10 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-100 tracking-tight uppercase">
                  {editingProduct.id ? 'Ficha do Produto' : 'Cadastrar Modelo'}
                </h3>
                <p className="text-slate-500 font-medium">Imagens redimensionadas para 800x800px automaticamente.</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-500 hover:text-white bg-slate-800 p-2.5 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <div
                  onClick={triggerFileInput}
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Comercial</label>
                  <textarea
                    placeholder="Descreva detalhes como gola, acabamento, etc. (Aparecerá no Pedido)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium outline-none h-24 resize-none"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço Base (R$)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 font-black text-lg outline-none"
                    value={editingProduct.basePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                    <span>Referência / SKU</span>
                    <button
                      onClick={() => setEditingProduct({ ...editingProduct, sku: generateRandomSKU() })}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Gerar Novo
                    </button>
                  </label>
                  <input
                    placeholder="EST-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 uppercase font-bold"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    readOnly
                  />
                </div>

                <div className="space-y-4 col-span-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grades e Tamanhos Disponíveis</label>
                  <p className="text-[10px] text-slate-400"> Selecione quais tamanhos específicos estarão disponíveis para este modelo.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {GRADES.map(grade => {
                      // Safety check for allowedGrades being an object
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

                      const toggleSize = (size: string) => {
                        const newAllowed = { ...currentAllowed };
                        const currentSizes = newAllowed[grade.label] || [];

                        if (currentSizes.includes(size)) {
                          newAllowed[grade.label] = currentSizes.filter((s: string) => s !== size);
                          if (newAllowed[grade.label].length === 0) delete newAllowed[grade.label];
                        } else {
                          newAllowed[grade.label] = [...currentSizes, size];
                        }
                        setEditingProduct({ ...editingProduct, allowedGrades: newAllowed });
                      };

                      return (
                        <div key={grade.label} className={`rounded-3xl border transition-all overflow-hidden ${isGradeActive ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}>
                          {/* Header */}
                          <div className="px-5 py-4 flex items-center justify-between bg-slate-900/50 border-b border-slate-800/50">
                            <span className="font-black text-xs uppercase tracking-wider text-slate-300">{grade.label}</span>
                            <button
                              onClick={toggleGrade}
                              className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${isGradeActive ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white'}`}
                            >
                              {isGradeActive ? 'Todos' : 'Nenhum'}
                            </button>
                          </div>

                          {/* Sizes Grid */}
                          <div className="p-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {grade.sizes.map(size => {
                              const isSizeSelected = selectedSizes.includes(size);
                              return (
                                <button
                                  key={size}
                                  onClick={() => toggleSize(size)}
                                  className={`py-2 rounded-xl text-[10px] font-black transition-all ${isSizeSelected
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20 scale-105'
                                    : 'bg-slate-900 text-slate-600 hover:bg-slate-800 hover:text-slate-400'}`}
                                >
                                  {size}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-800 flex gap-4">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-slate-900 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">Cancelar</button>
                <button onClick={handleSaveProduct} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl transition-all"><Save className="w-4 h-4" /> Confirmar Produto</button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Public Product Modal (Details & Measurements & Order) */}
      {
        publicViewingProduct && (
          <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-4xl border border-slate-800 p-6 md:p-8 relative animate-in zoom-in-95 duration-300 shadow-2xl my-auto">
              <button
                onClick={() => setPublicViewingProduct(null)}
                className="absolute top-4 right-4 bg-slate-800 text-slate-400 p-2 rounded-full hover:bg-slate-700 hover:text-white transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Product Image */}
                <div className="flex-1 bg-black rounded-3xl overflow-hidden shadow-inner aspect-square relative flex items-center justify-center">
                  <img src={publicViewingProduct.imageUrl} className="w-full h-full object-contain" alt={publicViewingProduct.name} />
                  <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                    REF: {publicViewingProduct.sku}
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">{publicViewingProduct.name}</h3>
                    <p className="text-indigo-400 font-bold text-sm mt-1 uppercase tracking-wider">{publicViewingProduct.category}</p>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{publicViewingProduct.description || "Sem descrição disponível."}</p>
                  </div>

                  {/* Measurements Table (ReadOnly) */}
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Ruler className="w-3 h-3" /> Tabela de Medidas (cm)
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Simple visual representation of Grades */}
                      {Object.entries(publicViewingProduct.allowedGrades || {}).map(([gradeLabel, sizes]: any) => (
                        <div key={gradeLabel} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <span className="text-[9px] text-slate-400 block mb-1 uppercase tracking-wider">{gradeLabel}</span>
                          <div className="flex flex-wrap gap-1">
                            {sizes.map((s: string) => (
                              <span key={s} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">{s}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Selection */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div>
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Escolha o Tamanho</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(publicViewingProduct.allowedGrades || {}).flat().filter((v, i, a) => a.indexOf(v) === i).map((size: any) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${selectedSize === size
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-24">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Qtd.</label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-center outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Lista de Conferência (Nomes/Tamanhos)</label>
                      <textarea
                        placeholder="Ex: 01 - João (M)&#10;02 - Maria (P)..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 min-h-[100px] resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addToCart}
                    disabled={!selectedSize}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Adicionar ao Carrinho
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      {/* Cart Modal (Checkout) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-2xl border border-slate-800 p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 my-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Seu Pedido</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{cart.length} Itens adicionados</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="bg-slate-900 text-slate-400 p-3 rounded-xl hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Client Form */}
              <div className="space-y-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Users className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest">Seus Dados</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Seu Nome</label>
                    <input
                      placeholder="Ex: João da Silva"
                      value={clientForm.name}
                      onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Equipe / Turma</label>
                    <input
                      placeholder="Ex: 3º Ano B / Time de Futebol"
                      value={clientForm.team || ''}
                      onChange={(e) => setClientForm({ ...clientForm, team: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">WhatsApp</label>
                    <input
                      placeholder="(00) 00000-0000"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Email (Opcional)</label>
                    <input
                      placeholder="seu@email.com"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-sm">Seu carrinho está vazio.</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex gap-4 items-start group">
                      <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-black text-slate-200 uppercase tracking-tight">{item.productName}</h5>
                            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Tamanho: {item.size}</span>
                          </div>
                          <button onClick={() => removeFromCart(index)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="flex gap-4 items-end">
                          <div className="space-y-1 w-20">
                            <label className="text-[8px] uppercase font-black text-slate-600 tracking-widest">Qtd.</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newCart = [...cart];
                                newCart[index].quantity = Math.max(1, parseInt(e.target.value));
                                setCart(newCart);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-sm font-bold text-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[8px] uppercase font-black text-slate-600 tracking-widest"><Edit3 className="w-3 h-3 inline mr-1" /> Lista de Conferência (Nomes/Tamanhos)</label>
                            <textarea
                              value={item.notes}
                              placeholder="Ex: 01 - João (M)&#10;02 - Maria (P)&#10;..."
                              onChange={(e) => {
                                const newCart = [...cart];
                                newCart[index].notes = e.target.value;
                                setCart(newCart);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 outline-none resize-none min-h-[100px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-6 border-t border-slate-800 flex gap-4">
                <button onClick={() => setIsCartOpen(false)} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  + Adicionar Mais Itens
                </button>
                <button
                  onClick={handleFinishOrder}
                  disabled={isSubmittingOrder}
                  className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all relative overflow-hidden"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Finalizar Pedido
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
