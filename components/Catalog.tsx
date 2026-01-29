
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
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';
import { FABRICS, GRADES } from '../constants.tsx';
import { Product } from '../types.ts';
import { productService } from '../services/productService.ts';

interface CatalogProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  readOnly?: boolean;
}

const Catalog: React.FC<CatalogProps> = ({ products, setProducts, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fabricFilter, setFabricFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'none'>('none');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
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

    // In Public Mode, usually only show Active products? 
    // Generally yes, but sticking to simple readOnly flag first.
    // If strict requirement: if (readOnly) result = result.filter(p => p.status === 'active');

    return result;
  }, [products, searchTerm, sortBy]);

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
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
          {!readOnly && (
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
          )}
        </div>
      </header>

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
          <div key={product.id} className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-sm overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col relative">
            <div className="relative aspect-square overflow-hidden bg-white">
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${product.status === 'inactive' ? 'grayscale opacity-40' : ''}`}
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
                {!readOnly ? (
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
                ) : (
                  /* Read Only View might show nothing or an "Order" button in future, for now empty */
                  <div />
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
      )}
    </div>
  );
};

export default Catalog;
