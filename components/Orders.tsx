
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Wand2,
  Trash2,
  Send,
  Loader2,
  ShoppingCart,
  Calendar,
  X,
  Edit3,
  User,
  Save,
  MessageSquare,
  AlertTriangle,
  FileText,
  Printer,
  FileCheck,
  Lock,
  Check,
  ArrowUpDown
} from 'lucide-react';
import { parseOrderText, ParsedOrderItem } from '../services/aiService';
import { FABRICS, STATUS_CONFIG, GRADES } from '../constants';
import { Order, OrderStatus, OrderType, Product, Client, OrderItem } from '../types';
import { printServiceOrder, printInvoice } from '../utils/printUtils';
import { orderService } from '../services/orderService';
import { clientService } from '../services/clientService';

interface OrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

const Orders: React.FC<OrdersProps> = ({ orders, setOrders, products, clients, setClients }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedOrderItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.SALE);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const handleAiParse = async () => {
    if (!aiText) return;
    setIsAiProcessing(true);
    try {
      // Safe access to products, defaulting to empty array if undefined
      const safeProducts = Array.isArray(products) ? products : [];
      const items = await parseOrderText(aiText, safeProducts.map(p => ({ id: p.id, name: p.name })));

      if (!items || items.length === 0) {
        alert("A IA não conseguiu identificar itens no texto. Tente reformular.");
        return;
      }

      // 1. Sort Sizes Ascending (Kids -> Adult -> Special)
      const getSizeWeight = (size: string) => {
        const s = size.toUpperCase().trim();
        // Numeric (Kids) first
        if (!isNaN(parseInt(s))) return parseInt(s);
        const weights: Record<string, number> = {
          'PP': 100, 'P': 101, 'M': 102, 'G': 103, 'GG': 104,
          'XG': 105, 'XXG': 106, 'G1': 107, 'G2': 108, 'G3': 109,
          'ESP': 200, 'ESP1': 201, 'ESP2': 202
        };
        return weights[s] || 999;
      };

      // Grouping: Layout -> Grade (Group) -> Product (SubGroup) -> Size
      const groups: Record<number, Record<string, Record<string, Record<string, { quantity: number, names: string[], fabric: string }>>>> = {};

      const teamName = items[0]?.teamName || "NOME DA EQUIPE";

      items.forEach(item => {
        const layout = item.layoutNumber || 9999;
        const product = (item.product || 'Produto Personalizado').toUpperCase();

        let grade = (item.grade || 'MASCULINO').toUpperCase();
        if (grade.includes('FEM')) grade = 'FEMININO';
        else if (grade.includes('INF') || grade.includes('UX')) grade = 'INFANTIL';
        else grade = 'MASCULINO'; // Default

        const size = (item.size || 'UN').toUpperCase();
        const fabric = item.fabric || '';

        if (!groups[layout]) groups[layout] = {};
        if (!groups[layout][grade]) groups[layout][grade] = {};
        if (!groups[layout][grade][product]) groups[layout][grade][product] = {};
        if (!groups[layout][grade][product][size]) {
          groups[layout][grade][product][size] = { quantity: 0, names: [], fabric };
        }

        groups[layout][grade][product][size].quantity += item.quantity || 0;
        if (item.names) groups[layout][grade][product][size].names.push(...item.names);
        if (fabric && !groups[layout][grade][product][size].fabric) {
          groups[layout][grade][product][size].fabric = fabric;
        }
      });

      let formattedOutput = '';

      // Iterate Layouts
      Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layoutKey => {
        const layoutNum = parseInt(layoutKey);
        // Only show separate layout block if strictly needed, but per request effectively just listing content
        const layoutGrades = groups[layoutNum];

        // Specific Order for Grades: Masculine -> Feminine -> Child
        const gradeOrder = ['MASCULINO', 'FEMININO', 'INFANTIL'];
        const sortedGrades = Object.keys(layoutGrades).sort((a, b) => {
          return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
        });

        // Track Grand Totals for this layout (or overall if single layout)
        let totalItems = 0;
        let formulaParts: string[] = [];

        sortedGrades.forEach(grade => {
          formattedOutput += `##########################################\n`;
          formattedOutput += `GRUPO: ${grade}\n`;
          formattedOutput += `##########################################\n\n`;

          const products = layoutGrades[grade];
          Object.keys(products).sort().forEach(product => {
            formattedOutput += `==========================================\n`;
            formattedOutput += `SUB-GRUPO: ${product}\n`;
            formattedOutput += `==========================================\n\n`;

            const sizes = products[product];
            Object.keys(sizes).sort((a, b) => getSizeWeight(a) - getSizeWeight(b)).forEach(size => {
              const data = sizes[size];
              totalItems += data.quantity;

              // Helper to clean "anos" duplication just for the header line if needed, 
              // but user example shows "10 ANOS" in header and "10 ANOS" in line.
              const formatAgeSize = (s: string) => {
                if (!isNaN(parseInt(s)) && !s.toLowerCase().includes('ano')) return `${s} ANOS`;
                return s;
              };
              const displaySizeHeader = formatAgeSize(size);

              // Add to formula: "1 (10 ANOS)"
              formulaParts.push(`${data.quantity} (${displaySizeHeader})`);

              formattedOutput += `------------------------------------------\n`;
              formattedOutput += `${displaySizeHeader} (${data.quantity} un)\n`;

              const itemSuffix = `(${product}/${grade})`;

              // List Names
              data.names.forEach(name => {
                const displayName = name.toUpperCase().trim();
                // User Example: NICOLLAS 💵 – 10 ANOS – (REGATA/MASCULINO) ✅
                // We'll reproduce: NAME – SIZE – SUFFIX
                formattedOutput += `${displayName} – ${displaySizeHeader} – ${itemSuffix}\n`;
              });

              // Fill placeholders
              const missing = data.quantity - data.names.length;
              for (let i = 0; i < missing; i++) {
                formattedOutput += `[SEM NOME] – ${displaySizeHeader} – ${itemSuffix}\n`;
              }
              formattedOutput += `\n`;
            });
          });
        });

        // Totals Section
        formattedOutput += `==========================================\n`;
        formattedOutput += `TOTAIS GERAIS DO PEDIDO (PEÇAS)\n`;
        formattedOutput += `==========================================\n`;
        formattedOutput += `Quantidade total de camisas:\n`;
        if (formulaParts.length > 0) {
          formattedOutput += `Fórmula: ${formulaParts.join(' + ')} \n`;
        }
        formattedOutput += `TOTAL GERAL: ${totalItems} peças\n\n`;
      });

      setInternalNotes(prev => (prev ? prev + '\n\n' : '') + formattedOutput.trim());

    } catch (e: any) {
      console.error(e);
      // Improve error message for user
      let msg = e?.message || "Erro desconhecido";

      // Try to parse JSON error message if it looks like one
      if (typeof msg === 'string' && (msg.startsWith('{') || msg.includes('429'))) {
        if (msg.includes('429') || msg.includes('quota')) {
          msg = "Limite de uso da IA excedido (Cota Grátis). Aguarde alguns segundos e tente novamente.";
        }
      }

      if (msg.includes("API key")) {
        alert("Erro de Chave API: Verifique se sua chave Gemini está configurada corretamente nos Ajustes.");
      } else {
        alert(`Erro ao processar com IA: ${msg}`);
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  const updateItem = (index: number, field: keyof ParsedOrderItem, value: any) => {
    setParsedItems(prev => {
      const newItems = [...prev];
      if (newItems[index]) {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const addNewManualItem = () => {
    setParsedItems(prev => [...prev, { product: '', grade: 'Masculino', size: 'M', quantity: 1 }]);
  };

  const canEditOrder = (status: OrderStatus) => {
    return status === OrderStatus.RECEIVED || status === OrderStatus.FINALIZATION;
  };

  const handleEditClick = (order: Order) => {
    if (!canEditOrder(order.status)) {
      alert("Este pedido já está em produção ou finalizado e não pode mais ser editado.");
      return;
    }
    setEditingOrderId(order.id);
    setClientName(order.clientName);
    setDeliveryDate(order.deliveryDate);
    setInternalNotes(order.internalNotes || '');
    setDelayReason(order.delayReason || '');
    setOrderType(order.orderType || OrderType.SALE);
    setParsedItems(order.items.length > 0 ? order.items.map(i => ({
      product: i.productName,
      grade: i.gradeLabel as any,
      size: i.size,
      quantity: i.quantity,
      fabric: i.fabricName
    })) : [{ product: '', grade: 'Masculino', size: 'G', quantity: 1 }]);
    setIsAdding(true);
  };

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingOrderId(null);
    setClientName('');
    setDeliveryDate('');
    setInternalNotes('');
    setDelayReason('');
    setParsedItems([]);
    setAiText('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await orderService.delete(id);
        window.dispatchEvent(new Event('refreshData'));
      } catch (error) {
        console.error("Error deleting order", error);
        alert("Erro ao excluir pedido.");
      }
    }
  };

  // ... import removed ...

  // ... inside component ...
  const handleFinalize = async () => {
    if (!clientName || !deliveryDate || parsedItems.length === 0) return;

    setIsSaving(true);

    try {
      const orderData = {
        orderNumber: (orders.length + 1).toString().padStart(4, '0'), // Ideally generated by DB/Service trigger, but ok for now
        clientId: clients.find(c => c.name.toLowerCase() === clientName.toLowerCase())?.id || null, // Will be handled if not found? Service doesn't create client on fly currently.
        clientName: clientName,
        status: OrderStatus.RECEIVED,
        orderType: orderType,
        totalValue: parsedItems.reduce((acc, curr) => {
          const prod = products.find(p => p.name === curr.product);
          const price = prod ? prod.basePrice : 35;
          return acc + (curr.quantity || 0) * price;
        }, 0), // Calculate properly based on product price
        createdAt: new Date().toISOString(),
        deliveryDate: deliveryDate,
        internalNotes: internalNotes,
        delayReason: delayReason,
        items: parsedItems.map(item => {
          const prod = products.find(p => p.name === item.product);
          return {
            id: Math.random().toString(), // Service ignores this on insert usually or mapping needs care
            productId: prod ? prod.id : 'p-custom',
            productName: item.product || 'Personalizado',
            fabricId: 'f-custom',
            fabricName: item.fabric || 'Não especificado',
            gradeLabel: item.grade || 'Masculino',
            size: item.size || 'M',
            quantity: item.quantity || 0,
            unitPrice: prod ? prod.basePrice : 35
          };
        })
      };

      // If client doesn't exist, we might need to create it strictly.
      // For MVP, we pass null client_id and rely on client_name in DB if strict relational integrity isn't blocking. 
      // Migration has: client_id uuid references clients(id).
      // If client doesn't exist, this will FAIL.
      // We must fetch or create client first.

      let clientIdToUse = orderData.clientId;

      if (!clientIdToUse) {
        // Create client first
        const { clientService } = await import('../services/clientService');
        const newClient = await clientService.create({ name: clientName, whatsapp: '', email: '' });
        clientIdToUse = newClient.id;
      }

      if (editingOrderId) {
        await orderService.update(editingOrderId, {
          clientName,
          deliveryDate,
          totalValue: orderData.totalValue,
          internalNotes,
          delayReason,
          orderType,
          clientId: clientIdToUse
        });
      } else {
        await orderService.create({
          ...orderData,
          clientId: clientIdToUse,
          orderNumber: orderData.orderNumber
        });
      }

      window.dispatchEvent(new Event('refreshData'));
      handleCloseModal();
    } catch (e) {
      console.error("Error saving order", e);
      alert("Erro ao salvar pedido");
    } finally {
      setIsSaving(false);
    }
  };

  const isOrderLate = deliveryDate && new Date(deliveryDate) < new Date();

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Gestão de Pedidos</h2>
          <p className="text-slate-500 font-medium">Controle total sobre vendas e orçamentos comerciais.</p>
        </div>
        <button
          onClick={() => { setOrderType(OrderType.SALE); setIsAdding(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 uppercase text-[11px] tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Gerar Novo Pedido
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[3rem] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-800 animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter">
                    {editingOrderId ? 'Edição de Pedido Existente' : 'Lançamento de Novo Pedido'}
                  </h3>
                  <div className="flex gap-4 mt-1">
                    <button
                      onClick={() => setOrderType(OrderType.SALE)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${orderType === OrderType.SALE ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >VENDA DIRETA</button>
                    <button
                      onClick={() => setOrderType(OrderType.BUDGET)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${orderType === OrderType.BUDGET ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >ORÇAMENTO</button>
                  </div>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white bg-slate-800 p-3 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8 border-r border-slate-800/50 pr-4">
                <div className="bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/10">
                  <label className="block text-xs font-black text-indigo-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> Inteligência Artificial
                  </label>
                  <textarea
                    className="w-full h-32 p-5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 text-sm text-slate-300 font-medium"
                    placeholder="Cole aqui a mensagem do cliente..."
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                  />
                  <button
                    onClick={handleAiParse}
                    disabled={isAiProcessing || !aiText}
                    className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-[0.2em]"
                  >
                    {isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Extrair com IA
                  </button>
                </div>

                <div className="space-y-5">
                  <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${!clientName ? 'text-rose-500' : 'text-slate-600'}`}>Cabeçalho do Pedido {!clientName && '*'}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                    <input
                      type="text"
                      list="client-options"
                      placeholder="Nome do Cliente"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={`w-full pl-12 pr-6 py-4 bg-slate-950 border rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all ${!clientName ? 'border-rose-900/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'border-slate-800'}`}
                    />
                    <datalist id="client-options">
                      {clients.map(client => (
                        <option key={client.id} value={client.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className={`w-full pl-12 pr-6 py-4 bg-slate-950 border rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 color-scheme-dark font-bold transition-all ${!deliveryDate ? 'border-rose-900/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'border-slate-800'}`}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-800/50">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <MessageSquare className="w-4 h-4" /> Informações Internas (Grade e Nomes)
                    </label>
                  </div>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Ex: M - João 10, G - Maria 7..."
                    className="w-full h-48 p-5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none shadow-inner"
                  />
                </div>

                {isOrderLate && (
                  <div className="space-y-4 pt-6 border-t border-slate-800/50">
                    <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <AlertTriangle className="w-4 h-4" /> Justificativa de Atraso
                    </label>
                    <input
                      type="text"
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="Motivo do atraso..."
                      className="w-full p-5 bg-rose-500/5 border border-rose-900/40 rounded-2xl text-sm text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="font-black text-slate-100 flex items-center gap-4 text-xl tracking-tighter uppercase">
                    <ShoppingCart className="w-6 h-6 text-indigo-400" />
                    Itens e Grade do Pedido
                  </h4>
                  <button
                    onClick={addNewManualItem}
                    className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-6 py-3 rounded-2xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20 tracking-widest"
                  >
                    + Adicionar Item Manual
                  </button>
                </div>

                <div className="flex-1 min-h-[400px] border-2 border-dashed border-slate-800 rounded-[3rem] p-8 bg-slate-900/20 overflow-y-auto space-y-6 scrollbar-hide">
                  {parsedItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800">
                      <ShoppingCart className="w-24 h-24 mb-6 opacity-5" />
                      <p className="font-black uppercase tracking-[0.4em] text-[11px] opacity-40">Adicione itens para continuar</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {parsedItems.map((item, idx) => {
                        // 1. Find Product (Case Insensitive for better UX)
                        const selectedProduct = products.find(p => p.name.toLowerCase() === (item.product || '').toLowerCase());

                        // 2. Resolve Allowed Grades (Handle Legacy Array vs New Record)
                        let allowedGradesObj: Record<string, string[]> | undefined;

                        if (selectedProduct?.allowedGrades) {
                          if (Array.isArray(selectedProduct.allowedGrades)) {
                            // Fallback runtime conversion if service didn't catch it
                            allowedGradesObj = {};
                            selectedProduct.allowedGrades.forEach((g: string) => {
                              const cfg = GRADES.find(gconfig => gconfig.label === g);
                              if (cfg && allowedGradesObj) allowedGradesObj[g] = cfg.sizes;
                            });
                          } else {
                            // It is a Record
                            allowedGradesObj = selectedProduct.allowedGrades as Record<string, string[]>;
                          }
                        }

                        // 3. Define Options for Dropdowns
                        // If product has restrictions, use keys. Else allow all GRADES.
                        const allowedGradeLabels = allowedGradesObj ? Object.keys(allowedGradesObj) : GRADES.map(g => g.label);
                        const allowedGradesList = GRADES.filter(g => allowedGradeLabels.includes(g.label));

                        // 4. Resolve Sizes for currently Selected Grade
                        const currentGradeLabel = item.grade || 'Masculino';
                        const specificAllowedSizes = allowedGradesObj ? allowedGradesObj[currentGradeLabel] : null;

                        // Fallback to strict constant lookup if no specific restriction, OR if custom product
                        const currentGradeConfig = GRADES.find(g => g.label === currentGradeLabel);
                        const availableSizes = specificAllowedSizes || (currentGradeConfig ? currentGradeConfig.sizes : []);

                        return (
                          <div key={idx} className="bg-[#0f172a] p-6 rounded-[2rem] border border-slate-800 shadow-xl space-y-6 animate-in slide-in-from-right-4 relative group">

                            {/* Product Search - Full Width */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">Produto</label>
                              <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5 pointer-events-none" />
                                <input
                                  list={`product-options-${idx}`}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-5 py-4 text-base font-black text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 uppercase tracking-tight"
                                  value={item.product}
                                  placeholder="BUSQUE O CAMISA, REGATA, ETC..."
                                  onChange={(e) => {
                                    const newVal = e.target.value;
                                    updateItem(idx, 'product', newVal);

                                    // Auto-update grade if product has restrictions
                                    const matchedProd = products.find(p => p.name.toLowerCase() === newVal.toLowerCase());

                                    if (matchedProd?.allowedGrades) {
                                      let validGrades: string[] = [];
                                      if (Array.isArray(matchedProd.allowedGrades)) {
                                        validGrades = matchedProd.allowedGrades;
                                      } else {
                                        validGrades = Object.keys(matchedProd.allowedGrades);
                                      }

                                      if (validGrades.length > 0 && !validGrades.includes(item.grade || '')) {
                                        updateItem(idx, 'grade', validGrades[0]); // Switch to first valid grade
                                        updateItem(idx, 'size', ''); // Reset size
                                      }
                                    }
                                  }}
                                />
                                <datalist id={`product-options-${idx}`}>
                                  {products.map(p => (
                                    <option key={p.id} value={p.name} />
                                  ))}
                                </datalist>
                              </div>
                            </div>

                            {/* Grade Logic - Buttons/Tabs */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">Modelo / Grade</label>
                              <div className="flex flex-wrap gap-3">
                                {allowedGradesList.length > 0 ? allowedGradesList.map(g => {
                                  const isActive = (item.grade || 'Masculino') === g.label;
                                  return (
                                    <button
                                      type="button"
                                      key={g.label}
                                      onClick={() => {
                                        updateItem(idx, 'grade', g.label);
                                        updateItem(idx, 'size', ''); // Reset size
                                      }}
                                      className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${isActive
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20 scale-105'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer'
                                        }`}
                                    >
                                      {g.label}
                                    </button>
                                  );
                                }) : (
                                  <p className="text-xs text-rose-500 font-bold py-2">Selecione um produto primeiro</p>
                                )}
                              </div>
                            </div>

                            {/* Size Logic - Grid of Buttons (PREMIUM UI) */}
                            <div className="space-y-3 p-6 bg-slate-900/30 rounded-3xl border border-slate-800/50">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block text-center w-full mb-2">Selecione o Tamanho Disponível</label>

                              <div className="flex flex-wrap gap-3 justify-center">
                                {availableSizes.length > 0 ? availableSizes.map(s => {
                                  const isSelected = item.size === s;
                                  return (
                                    <button
                                      type="button"
                                      key={s}
                                      onClick={() => updateItem(idx, 'size', s)}
                                      className={`min-w-[3.5rem] h-14 px-4 rounded-xl text-sm font-black transition-all border flex items-center justify-center ${isSelected
                                        ? 'bg-white border-white text-indigo-900 shadow-xl shadow-white/10 scale-110 z-10'
                                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-700'
                                        }`}
                                    >
                                      {s}
                                    </button>
                                  )
                                }) : (
                                  <div className="flex flex-col items-center justify-center py-4 text-slate-600 gap-2">
                                    <AlertTriangle className="w-5 h-5 opacity-50" />
                                    <span className="text-xs font-bold">Nenhum tamanho disponível para esta grade</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer: Fabric, Qty, Delete */}
                            <div className="grid grid-cols-12 gap-6 items-end">
                              <div className="col-span-12 md:col-span-6 space-y-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1">Tecido</label>
                                <div className="relative">
                                  <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-900 transition-all uppercase tracking-wide"
                                    value={item.fabric}
                                    onChange={(e) => updateItem(idx, 'fabric', e.target.value)}
                                  >
                                    <option value="">Padrão do Modelo</option>
                                    {FABRICS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                  </select>
                                  <ArrowUpDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                </div>
                              </div>

                              <div className="col-span-8 md:col-span-4 space-y-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-1 text-center">Quantidade</label>
                                <div className="flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => updateItem(idx, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                                    className="w-14 h-14 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:bg-slate-800"
                                  ><span className="text-xl font-bold">-</span></button>
                                  <input
                                    type="number"
                                    className="flex-1 w-full bg-transparent h-14 text-center text-indigo-400 font-black outline-none text-lg"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateItem(idx, 'quantity', (item.quantity || 1) + 1)}
                                    className="w-14 h-14 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:bg-slate-800"
                                  ><span className="text-xl font-bold">+</span></button>
                                </div>
                              </div>

                              <div className="col-span-4 md:col-span-2">
                                <button
                                  onClick={() => removeItem(idx)}
                                  className="w-full h-14 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-rose-900/10 group-hover/btn:scale-105"
                                  title="Remover Item"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-10 pt-10 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.4em] mb-2">Total do Pedido</p>
                    <p className="text-5xl font-black text-slate-100 tracking-tighter">R$ {(parsedItems.reduce((acc, curr) => {
                      const prod = products.find(p => p.name === curr.product);
                      const price = prod ? prod.basePrice : 35;
                      return acc + (curr.quantity || 0) * price;
                    }, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex gap-5">
                    <button
                      onClick={handleCloseModal}
                      className="px-10 py-5 border border-slate-800 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-slate-800 hover:text-slate-100 transition-all"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={parsedItems.length === 0 || !clientName || !deliveryDate || isSaving}
                      className={`px-16 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center gap-4 shadow-2xl disabled:opacity-30 ${orderType === OrderType.SALE ? 'bg-indigo-600 text-white shadow-indigo-600/40 hover:bg-indigo-700' : 'bg-amber-600 text-white shadow-amber-600/40 hover:bg-amber-700'}`}
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {isSaving ? 'Salvando...' : (editingOrderId ? 'Salvar Alterações' : (orderType === OrderType.SALE ? 'Lançar Venda' : 'Salvar Orçamento'))}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0f172a] rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex items-center gap-6 bg-slate-900/10">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, número ou tipo..."
              className="w-full pl-14 pr-8 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
            />
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-600 text-[10px] uppercase font-black tracking-[0.4em]">
              <tr>
                <th className="px-10 py-8">Nº Registro</th>
                <th className="px-10 py-8">Modalidade</th>
                <th className="px-10 py-8">Cliente</th>
                <th className="px-10 py-8">Status Produção</th>
                <th className="px-10 py-8">Valor Bruto</th>
                <th className="px-10 py-8 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((order) => {
                const editable = canEditOrder(order.status);
                return (
                  <tr key={order.id} className="hover:bg-indigo-500/5 transition-all group">
                    <td className="px-10 py-8">
                      <span className="font-black text-slate-500">#{order.orderNumber}</span>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${order.orderType === OrderType.SALE ? 'bg-emerald-900/20 border-emerald-900/40 text-emerald-400' : 'bg-amber-900/20 border-amber-900/40 text-amber-400'}`}>
                        {order.orderType === OrderType.SALE ? 'Venda' : 'Orçamento'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="font-black text-slate-100 text-lg">{order.clientName}</div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase border tracking-widest ${STATUS_CONFIG[order.status]?.color}`}>
                        {STATUS_CONFIG[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-10 py-8 font-black text-indigo-400 text-2xl tracking-tighter">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditClick(order)}
                          className={`p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all ${editable ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-700 cursor-not-allowed opacity-50'
                            }`}
                          title={editable ? "Editar Pedido" : "Pedido em produção - Edição bloqueada"}
                        >
                          {editable ? <Edit3 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => printServiceOrder(order)}
                          className="text-slate-500 hover:text-white p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                          title="OS Produção"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => printInvoice(order)}
                          className="text-slate-500 hover:text-emerald-400 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                          title="Visualizar DANFE"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          className="text-slate-500 hover:text-indigo-400 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-slate-500 hover:text-rose-500 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                          title="Excluir Pedido"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
