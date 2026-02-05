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
  ArrowUpDown,
  Bot,
  ThumbsUp,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { getWhatsAppLink, getStatusUpdateMessage } from '../utils/whatsappUtils';
import { parseOrderText, ParsedOrderItem } from '../services/aiService';
import { FABRICS, STATUS_CONFIG, GRADES } from '../constants';
import { Order, OrderStatus, OrderType, Product, Client, OrderItem, PaymentStatus } from '../types';
import { printServiceOrder, printInvoice } from '../utils/printUtils';
import { orderService } from '../services/orderService';
import { clientService } from '../services/clientService';

import { ProductionBoard } from './ProductionBoard';

// ... (existing imports)

interface OrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  botDraft?: { clientName: string; items: ParsedOrderItem[]; briefing: string } | null;
  onDraftUsed?: () => void;
}

const Orders: React.FC<OrdersProps> = ({ orders, setOrders, products, clients, setClients, botDraft, onDraftUsed }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'briefing'>('details');
  const [activeContext, setActiveContext] = useState<'production' | 'store'>('production'); // New: Switch between ERP and Store
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Filter Orders based on Context
  const contextOrders = orders.filter(o => {
    if (activeContext === 'store') {
      return o.origin === 'store' && (o.status === OrderStatus.STORE_REQUEST || o.status === OrderStatus.STORE_CONFERENCE || o.status === OrderStatus.STORE_CHECKED);
    }
    // Production Context: Show everything else (Manual orders OR Store orders that have been Approved/Moved to Production)
    return o.origin !== 'store' || (o.status !== OrderStatus.STORE_REQUEST && o.status !== OrderStatus.STORE_CONFERENCE && o.status !== OrderStatus.STORE_CHECKED);
  });

  // ... (keep existing effects)




  const [isSaving, setIsSaving] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedOrderItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.SALE);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [customAmountPaid, setCustomAmountPaid] = useState<number | string>(''); // For UI input
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newOrderBriefing, setNewOrderBriefing] = useState('');

  // Watch for Bot Draft
  React.useEffect(() => {
    if (botDraft && !isAdding) {
      handleAddNew();
      setClientName(botDraft.clientName);
      setParsedItems(botDraft.items);
      setNewOrderBriefing(botDraft.briefing);
      setIsAdding(true);
      setActiveTab('briefing');
      onDraftUsed && onDraftUsed();
      // Try to auto-select client if match found
      const clientMatch = clients.find(c => c.name.toLowerCase().includes(botDraft.clientName.toLowerCase()));
      if (clientMatch) {
        setClientName(clientMatch.name);
      }
    }
  }, [botDraft]);

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

      let formattedOutput = 'LISTA DE CONFERENCIA\n\n';

      // Iterate Layouts
      Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layoutKey => {
        const layoutNum = parseInt(layoutKey);
        const layoutGrades = groups[layoutNum];

        // Specific Order for Grades: Masculine -> Feminine -> Child
        const gradeOrder = ['MASCULINO', 'FEMININO', 'INFANTIL'];
        const sortedGrades = Object.keys(layoutGrades).sort((a, b) => {
          return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
        });

        sortedGrades.forEach(grade => {
          const products = layoutGrades[grade];
          Object.keys(products).sort().forEach(product => {
            // Header: LAYOUT REGATA MASCULINA - Single Line
            formattedOutput += `LAYOUT ${product} ${grade}\n\n`; // Double newline after header for separation

            const sizes = products[product];
            Object.keys(sizes).sort((a, b) => getSizeWeight(a) - getSizeWeight(b)).forEach(size => {
              const data = sizes[size];
              // ... existing size formatting ...
              const formatAgeSize = (s: string) => {
                if (!isNaN(parseInt(s)) && !s.toLowerCase().includes('ano')) return `${s} ANOS`;
                return s;
              };
              const displaySizeHeader = formatAgeSize(size);

              formattedOutput += `TAMANHO - ${displaySizeHeader}\n`; // Single newline after Size Header? User asked for single spacing list, but maybe header needs space. Let's keep one empty line before size group.

              // List Names (Single Spacing)
              data.names.forEach(name => {
                const displayName = name.toUpperCase().trim();
                formattedOutput += `1 - ${displayName} - ${displaySizeHeader}\n`;
              });

              // Fill placeholders
              const missing = data.quantity - data.names.length;
              for (let i = 0; i < missing; i++) {
                formattedOutput += `1 - [SEM NOME] - ${displaySizeHeader}\n`;
              }
              formattedOutput += `\n`; // Space between size groups
            });
            // formattedOutput += `\n`; // Space between products (already has newlines from sizes)
          });
        });
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
    return status === OrderStatus.RECEIVED ||
      status === OrderStatus.FINALIZATION ||
      status === OrderStatus.STORE_REQUEST ||
      status === OrderStatus.STORE_CONFERENCE;
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
    setPaymentStatus(order.paymentStatus || PaymentStatus.PENDING);
    setParsedItems(order.items.length > 0 ? order.items.map(i => ({
      product: i.productName,
      grade: i.gradeLabel as any,
      size: i.size,
      quantity: i.quantity,
      fabric: i.fabricName
    })) : [{ product: '', grade: 'Masculino', size: 'G', quantity: 1 }]);

    // Set Custom Amount if exists
    setCustomAmountPaid(order.amountPaid ? order.amountPaid : '');

    setIsAdding(true);
  };

  const handleAddNew = () => {
    setOrderType(OrderType.SALE);

    // Smart Scheduling Logic: 20 Business Days
    // Helper to add business days
    const addBusinessDays = (date: Date, days: number) => {
      let count = 0;
      const result = new Date(date);
      while (count < days) {
        result.setDate(result.getDate() + 1);
        // 0 = Sunday, 6 = Saturday
        if (result.getDay() !== 0 && result.getDay() !== 6) {
          count++;
        }
      }
      return result;
    };

    const activeOrdersCount = orders.filter(o => o.status !== OrderStatus.FINISHED && o.status !== OrderStatus.RECEIVED).length;
    // Base 20 business days + 1 extra WORK day for every 10 active orders (reduced weight)
    const extraDays = Math.floor(activeOrdersCount / 10);
    const totalBusinessDays = 20 + extraDays;

    const suggestedDate = addBusinessDays(new Date(), totalBusinessDays);

    setDeliveryDate(suggestedDate.toISOString().split('T')[0]);
    setIsAdding(true);
  }

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingOrderId(null);
    setClientName('');
    setDeliveryDate('');
    setInternalNotes('');
    setDelayReason('');
    setParsedItems([]);
    setAiText('');
    setPaymentStatus(PaymentStatus.PENDING);
    setCustomAmountPaid('');
    setNewOrderBriefing('');
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
        paymentStatus: paymentStatus, // Save payment status
        totalValue: parsedItems.reduce((acc, curr) => {
          const prod = products.find(p => p.name === curr.product);
          const price = prod ? prod.basePrice : 35;
          return acc + (curr.quantity || 0) * price;
        }, 0),
        amountPaid: paymentStatus === PaymentStatus.FULL
          ? 999999 // Logic to calculate full later? Or just dont send amountPaid for FULL?
          // Actually, let's just save EXACT amount if provided, or logic below
          : (customAmountPaid ? parseFloat(customAmountPaid.toString()) : 0),
        createdAt: new Date().toISOString(),
        deliveryDate: deliveryDate,
        briefing: editingOrderId ? undefined : newOrderBriefing,
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
          paymentStatus,
          clientId: clientIdToUse,
          amountPaid: orderData.amountPaid
        });
      } else {
        await orderService.create({
          ...orderData,
          clientId: clientIdToUse,
          orderNumber: orderData.orderNumber,
          // If FULL, we might want to ensure amountPaid == totalValue in backend or just handle in UI
          amountPaid: paymentStatus === PaymentStatus.FULL
            ? orderData.totalValue
            : ((paymentStatus === PaymentStatus.HALF || paymentStatus === PaymentStatus.DEPOSIT) && !customAmountPaid ? orderData.totalValue / 2 : orderData.amountPaid)
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Gestão de Pedidos</h2>
          <p className="text-slate-500 font-medium whitespace-nowrap">Controle total sobre vendas e {activeContext === 'store' ? 'solicitações da loja.' : 'produção.'}</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveContext('production')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeContext === 'production' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
          >
            Produção
          </button>
          <button
            onClick={() => setActiveContext('store')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeContext === 'store' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
          >
            Solicitações Loja
            {orders.filter(o => o.origin === 'store' && o.status === OrderStatus.STORE_REQUEST).length > 0 && (
              <span className="bg-rose-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px]">{orders.filter(o => o.origin === 'store' && o.status === OrderStatus.STORE_REQUEST).length}</span>
            )}
          </button>
        </div>

        <button
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 uppercase text-[11px] tracking-widest whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Gerar Novo Pedido
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-[2rem] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-800 animate-in zoom-in-95">
            <div className="px-6 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-tighter">
                      {editingOrderId ? 'Edição' : 'Novo Pedido'}
                    </h3>
                    {/* Tab Buttons */}
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-colors ${activeTab === 'details' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                      >Detalhes</button>
                      <button
                        onClick={() => setActiveTab('items')}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-colors ${activeTab === 'items' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                      >Itens</button>
                      <button
                        onClick={() => setActiveTab('briefing')}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'briefing' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Bot className="w-3 h-3" /> Briefing IA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/20">

              {/* TAB: DETAILS (Original Left Column) */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-left-4 duration-300">
                  <div className="space-y-6">
                    {/* Order Type & Payment Status Logic moved here for cleaner UI */}
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configuração do Pedido</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Tipo</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setOrderType(OrderType.SALE)}
                              className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${orderType === OrderType.SALE ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                            >VENDA</button>
                            <button
                              onClick={() => setOrderType(OrderType.BUDGET)}
                              className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${orderType === OrderType.BUDGET ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                            >ORÇAMENTO</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Pagamento</label>
                          <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-[10px] font-black text-slate-200 uppercase outline-none focus:border-indigo-500"
                          >
                            {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {(paymentStatus === PaymentStatus.HALF || paymentStatus === PaymentStatus.DEPOSIT || paymentStatus === PaymentStatus.PENDING) && (
                            <input
                              type="number"
                              placeholder="R$ Pago"
                              value={customAmountPaid}
                              onChange={e => setCustomAmountPaid(e.target.value)}
                              className="w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-emerald-400 font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Client & Date */}
                    <div className="space-y-4">
                      <div className="relative group">
                        <label className={`block text-[9px] font-black uppercase tracking-widest ml-1 mb-1 ${!clientName ? 'text-rose-500' : 'text-slate-500'}`}>Cliente {!clientName && '*'}</label>
                        <User className="absolute left-4 top-[2.2rem] text-slate-600 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          type="text"
                          list="client-options"
                          placeholder="Nome do Cliente"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 bg-slate-950 border rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all ${!clientName ? 'border-rose-900/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-slate-800'}`}
                        />
                        <datalist id="client-options">
                          {clients.map(client => (
                            <option key={client.id} value={client.name} />
                          ))}
                        </datalist>
                      </div>
                      <div className="relative group">
                        <label className={`block text-[9px] font-black uppercase tracking-widest ml-1 mb-1 ${!deliveryDate ? 'text-rose-500' : 'text-slate-500'}`}>Entrega {!deliveryDate && '*'}</label>
                        <Calendar className="absolute left-4 top-[2.2rem] text-slate-600 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 bg-slate-950 border rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 color-scheme-dark font-bold transition-all ${!deliveryDate ? 'border-rose-900/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-slate-800'}`}
                        />
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <MessageSquare className="w-3 h-3" /> Informações Internas / Lista
                      </label>
                      <textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Cole a lista ou deixe observações..."
                        className="w-full h-40 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none shadow-inner leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* AI Helper Column */}
                  <div className="space-y-4">
                    <div className="bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-500/20 h-full flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                          <Wand2 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h4 className="font-black text-indigo-300 uppercase tracking-wider text-xs">Extrator de Pedidos</h4>
                      </div>
                      <p className="text-[10px] text-indigo-300/60 font-medium mb-4 leading-relaxed">
                        Cole o texto do WhatsApp aqui para a IA identificar itens, tamanhos e quantidades automaticamente.
                      </p>
                      <textarea
                        className="w-full flex-1 p-4 bg-slate-950/50 border border-indigo-500/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-indigo-900/30 text-xs text-indigo-200 font-medium mb-4 resize-none"
                        placeholder="Ex: 'Quero 10 camisetas P e 5 M...'"
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                      />
                      <button
                        onClick={handleAiParse}
                        disabled={isAiProcessing || !aiText}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-indigo-600/20"
                      >
                        {isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Processar Texto
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ITEMS (Original Right Column content) */}
              {activeTab === 'items' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-slate-100 flex items-center gap-3 text-lg tracking-tighter uppercase">
                      <ShoppingCart className="w-5 h-5 text-indigo-400" />
                      Itens do Pedido ({parsedItems.length})
                    </h4>
                    <button
                      onClick={addNewManualItem}
                      className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-5 py-2.5 rounded-xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20 tracking-widest flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* ... Previous Item Mapping Logic reused here ... */}
                    {parsedItems.length === 0 ? (
                      <div className="py-20 flex flex-col items-center justify-center text-slate-800 border-2 border-dashed border-slate-800 rounded-[2rem]">
                        <ShoppingCart className="w-16 h-16 mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-[0.3em] text-[10px] opacity-40">Nenhum item adicionado</p>
                      </div>
                    ) : (
                      parsedItems.map((item, idx) => {
                        // Re-use Logic for Dropdowns
                        const selectedProduct = products.find(p => p.name.toLowerCase() === (item.product || '').toLowerCase());
                        // ... (Same Logic as before, just inline render for cleanliness in replacement)
                        let allowedGradesObj: Record<string, string[]> | undefined;
                        if (selectedProduct?.allowedGrades) {
                          if (Array.isArray(selectedProduct.allowedGrades)) {
                            allowedGradesObj = {};
                            selectedProduct.allowedGrades.forEach((g: string) => {
                              const cfg = GRADES.find(gconfig => gconfig.label === g);
                              if (cfg && allowedGradesObj) allowedGradesObj[g] = cfg.sizes;
                            });
                          } else {
                            allowedGradesObj = selectedProduct.allowedGrades as Record<string, string[]>;
                          }
                        }
                        const allowedGradeLabels = allowedGradesObj ? Object.keys(allowedGradesObj) : GRADES.map(g => g.label);
                        const allowedGradesList = GRADES.filter(g => allowedGradeLabels.includes(g.label));
                        const currentGradeLabel = item.grade || 'Masculino';
                        const specificAllowedSizes = allowedGradesObj ? allowedGradesObj[currentGradeLabel] : null;
                        const currentGradeConfig = GRADES.find(g => g.label === currentGradeLabel);
                        const availableSizes = specificAllowedSizes || (currentGradeConfig ? currentGradeConfig.sizes : []);

                        return ( // RENDER ITEM
                          <div key={idx} className="bg-[#0f172a] p-5 rounded-[1.5rem] border border-slate-800 shadow-sm relative group hover:border-indigo-500/30 transition-colors">
                            <div className="absolute top-4 right-4 z-10">
                              <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                              <div className="md:col-span-4 space-y-1">
                                <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1">Produto</label>
                                <input
                                  list={`prod-list-${idx}`}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-white uppercase focus:border-indigo-500 outline-none"
                                  value={item.product}
                                  onChange={(e) => updateItem(idx, 'product', e.target.value)}
                                  placeholder="Busque..."
                                />
                                <datalist id={`prod-list-${idx}`}>{products.map(p => <option key={p.id} value={p.name} />)}</datalist>
                              </div>
                              <div className="md:col-span-8 flex gap-4">
                                <div className="flex-1 space-y-1">
                                  <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1">Grade</label>
                                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-slate-300 outline-none uppercase" value={item.grade} onChange={e => updateItem(idx, 'grade', e.target.value)}>
                                    {allowedGradesList.map(g => <option key={g.label} value={g.label}>{g.label}</option>)}
                                  </select>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1">Tamanho</label>
                                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-slate-300 outline-none" value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)}>
                                    {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div className="w-24 space-y-1">
                                  <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider ml-1 text-center block">Qtd</label>
                                  <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-xs font-black text-indigo-400 text-center outline-none" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between sticky bottom-0 bg-[#0f172a] pb-2">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Valor Total</p>
                      <p className="text-3xl font-black text-slate-100">R$ {(parsedItems.reduce((acc, curr) => {
                        const prod = products.find(p => p.name === curr.product);
                        return acc + (curr.quantity || 0) * (prod ? prod.basePrice : 35);
                      }, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={handleCloseModal} className="px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-800">Cancelar</button>
                      <button onClick={handleFinalize} disabled={isSaving} className="px-10 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50">{isSaving ? 'Salvando...' : 'Finalizar Pedido'}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: BRIEFING IA (New) */}
              {activeTab === 'briefing' && (
                <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                  <div className="bg-purple-900/10 border border-purple-500/20 rounded-[2rem] p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Briefing IA</h3>
                        <p className="text-xs text-purple-300 font-medium">Gerado automaticamente pelo CloudBot</p>
                      </div>
                    </div>

                    {/* We will assume `order.briefing` exists or use a placeholder for now until we connect fully */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-line font-medium text-xs">
                        {editingOrderId
                          ? (orders.find(o => o.id === editingOrderId)?.briefing || "Nenhum briefing registrado para este pedido.")
                          : (newOrderBriefing || "O briefing será gerado após criar o pedido pelo CloudBot.")
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-6 gap-2">
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'board' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <ProductionBoard
          orders={orders}
          onOrderUpdate={() => window.location.reload()}
        />
      ) : (
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
                  <th className="px-10 py-8">Pgto</th>
                  <th className="px-10 py-8">Cliente</th>
                  <th className="px-10 py-8">Status Produção</th>
                  <th className="px-10 py-8">Valor Bruto</th>
                  <th className="px-10 py-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {contextOrders.map((order) => {
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
                        <span className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${!order.paymentStatus || order.paymentStatus === PaymentStatus.PENDING ? 'bg-slate-800 border-slate-700 text-slate-400' :
                          order.paymentStatus === 'Sinal (50%)' || order.paymentStatus === 'Sinal / Parcial' ? 'bg-indigo-900/20 border-indigo-900/40 text-indigo-400' :
                            'bg-emerald-900/20 border-emerald-900/40 text-emerald-400'
                          }`}>
                          {order.paymentStatus || 'PENDENTE'}
                        </span>
                        {order.amountPaid && order.amountPaid > 0 && order.paymentStatus !== PaymentStatus.FULL && (
                          <div className="mt-1 text-[9px] text-slate-500 font-mono">
                            PG: R$ {order.amountPaid.toLocaleString('pt-BR')}
                          </div>
                        )}
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
                          {activeContext === 'store' ? (
                            <>
                              {order.status === OrderStatus.STORE_REQUEST && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('Iniciar conferência deste pedido?')) return;
                                    try {
                                      const newStatus = OrderStatus.STORE_CONFERENCE;
                                      await orderService.update(order.id, { status: newStatus });
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

                                      const client = clients.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
                                      if (client?.whatsapp) {
                                        const msg = getStatusUpdateMessage(order, newStatus);
                                        window.open(getWhatsAppLink(client.whatsapp, msg), '_blank');
                                      }
                                    } catch (err) { console.error(err); alert('Erro ao atualizar status'); }
                                  }}
                                  className="text-slate-500 hover:text-violet-400 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                                  title="Iniciar Conferência"
                                >
                                  <ClipboardList className="w-5 h-5" />
                                </button>
                              )}
                              {order.status === OrderStatus.STORE_CONFERENCE && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('Finalizar conferência e aguardar aprovação?')) return;
                                    try {
                                      const newStatus = OrderStatus.STORE_CHECKED;
                                      await orderService.update(order.id, { status: newStatus });
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

                                      const client = clients.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
                                      if (client?.whatsapp) {
                                        const msg = getStatusUpdateMessage(order, newStatus);
                                        window.open(getWhatsAppLink(client.whatsapp, msg), '_blank');
                                      }
                                    } catch (err) { console.error(err); alert('Erro ao atualizar status'); }
                                  }}
                                  className="text-slate-500 hover:text-teal-400 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                                  title="Finalizar Conferência"
                                >
                                  <ThumbsUp className="w-5 h-5" />
                                </button>
                              )}
                              {order.status === OrderStatus.STORE_CHECKED && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('Confirmar pedido e mover para Produção?')) return;
                                    try {
                                      const newStatus = OrderStatus.RECEIVED;
                                      await orderService.update(order.id, { status: newStatus });
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

                                      const client = clients.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
                                      if (client?.whatsapp) {
                                        const msg = getStatusUpdateMessage(order, newStatus);
                                        window.open(getWhatsAppLink(client.whatsapp, msg), '_blank');
                                      }
                                    } catch (err) { console.error(err); alert('Erro ao atualizar status'); }
                                  }}
                                  className="text-slate-500 hover:text-emerald-400 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                                  title="Confirmar e Mover para Produção"
                                >
                                  <ArrowRight className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditClick(order)}
                                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all text-slate-500 hover:text-indigo-400"
                                title="Ver Detalhes"
                              >
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="text-slate-500 hover:text-rose-500 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                                title="Excluir Pedido"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(order)}
                                className={`p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all ${editable ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-700 cursor-not-allowed opacity-50'
                                  }`}
                                title={editable ? "Editar Pedido" : "Pedido em produção - Edição bloqueada"}
                              >
                                {editable ? <Edit3 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={async () => await printServiceOrder(order)}
                                className="text-slate-500 hover:text-white p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                                title="OS Produção"
                              >
                                <Printer className="w-5 h-5" />
                              </button>
                              <button
                                onClick={async () => await printInvoice(order)}
                                className="text-slate-500 hover:text-emerald-400 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                                title="Visualizar DANFE"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                              <button
                                onClick={async () => {
                                  // Find client to get phone - simplistic matching
                                  const client = clients.find(c => c.name.toLowerCase() === order.clientName.toLowerCase());
                                  const phone = client?.whatsapp || '';
                                  const message = getStatusUpdateMessage(order, order.status);
                                  const link = getWhatsAppLink(phone, message);
                                  window.open(link, '_blank');
                                }}
                                className="text-slate-500 hover:text-indigo-400 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 transition-all"
                                title="Enviar Status via WhatsApp"
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
