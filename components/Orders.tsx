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
  ClipboardList,
  DollarSign,
  Link as LinkIcon,
  FileCode,
  FileCode2,
  Upload
} from 'lucide-react';
import { getWhatsAppLink, getStatusUpdateMessage } from '../utils/whatsappUtils';
import { ParsedOrderItem } from '../services/aiService';
import { FABRICS, STATUS_CONFIG, GRADES } from '../constants';
import { Order, OrderStatus, OrderType, Product, Client, OrderItem, PaymentStatus, OrderMessage } from '../types';
import { printServiceOrder, printInvoice } from '../utils/printUtils';
import { orderService } from '../services/orderService';
import { clientService } from '../services/clientService';
import { financeService } from '../services/financeService';
import { notify } from './ui/toast';
import { ConfirmModal } from './ui/ConfirmModal';

import { ProductionBoard } from './ProductionBoard';
import OrderAiBriefing from './Orders/OrderAiBriefing';
import OrderItemsForm from './Orders/OrderItemsForm';
import OrderChatDrawer from './Orders/OrderChatDrawer';

// ... (existing imports)

interface OrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  botDraft?: { clientName: string; items: ParsedOrderItem[]; briefing: string } | null;
  onDraftUsed?: () => void;
  isMasterAdmin?: boolean;
}

const Orders: React.FC<OrdersProps> = ({ orders, setOrders, products, clients, setClients, botDraft, onDraftUsed, isMasterAdmin }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'briefing'>('details');
  const [activeContext, setActiveContext] = useState<'production' | 'store'>('production'); // New: Switch between ERP and Store
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isAdding, setIsAdding] = useState(false);

  // Filter Orders based on Context
  const contextOrders = orders.filter(o => {
    if (activeContext === 'store') {
      return o.origin === 'store' && (o.status === OrderStatus.STORE_REQUEST || o.status === OrderStatus.STORE_CONFERENCE || o.status === OrderStatus.STORE_CHECKED);
    }
    // Production Context: Show everything else (Manual orders OR Store orders that have been Approved/Moved to Production)
    return o.origin !== 'store' || (o.status !== OrderStatus.STORE_REQUEST && o.status !== OrderStatus.STORE_CONFERENCE && o.status !== OrderStatus.STORE_CHECKED);
  });

  // ... (keep existing effects)





  const productsByName = React.useMemo(() => {
    const map = new Map<string, Product>();
    const safeProducts = Array.isArray(products) ? products : [];
    safeProducts.forEach(p => {
      if (p.name) map.set(p.name.trim().toLowerCase(), p);
    });
    return map;
  }, [products]);

  const clientsByName = React.useMemo(() => {
    const map = new Map<string, Client>();
    const safeClients = Array.isArray(clients) ? clients : [];
    safeClients.forEach(c => {
      if (c.name) map.set(c.name.toLowerCase(), c);
    });
    return map;
  }, [clients]);

  const [isSaving, setIsSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedOrderItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.SALE);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [customAmountPaid, setCustomAmountPaid] = useState<number | string>('');
  const [discountValue, setDiscountValue] = useState<number | string>('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isPartialEditMode, setIsPartialEditMode] = useState(false);
  const [newOrderBriefing, setNewOrderBriefing] = useState('');
  const [layoutUrls, setLayoutUrls] = useState<string[]>([]);
  const [designFileUrls, setDesignFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Confirm modal states (UX-001)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmPaymentOrder, setConfirmPaymentOrder] = useState<Order | null>(null);

  // Chat State
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  const openChat = (order: Order) => {
    setChatOrder(order);
  };

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
      const draftNameLower = (botDraft.clientName || '').toLowerCase();
      const clientMatch = Array.isArray(clients) ? clients.find(c => (c.name || '').toLowerCase().includes(draftNameLower)) : undefined;
      if (clientMatch) {
        setClientName(clientMatch.name);
      }
    }
  }, [botDraft]);

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
    setParsedItems(prev => [...prev, { product: '', grade: 'Unidade', size: 'UN', quantity: 1 }]);
  };

  const canEditOrder = (status: OrderStatus) => {
    return status === OrderStatus.RECEIVED ||
      status === OrderStatus.FINALIZATION ||
      status === OrderStatus.STORE_REQUEST ||
      status === OrderStatus.STORE_CONFERENCE;
  };

  const handleEditClick = (order: Order) => {
    const isPartial = !canEditOrder(order.status);
    setIsPartialEditMode(isPartial);

    setEditingOrderId(order.id);
    setClientName(order.clientName);
    setDeliveryDate(order.deliveryDate);
    setInternalNotes(order.internalNotes || '');
    setDelayReason(order.delayReason || '');
    setOrderType(order.orderType || OrderType.SALE);
    setPaymentStatus(order.paymentStatus || PaymentStatus.PENDING);
    setParsedItems((order.items || []).length > 0 ? (order.items || []).map(i => ({
      product: i.productName,
      grade: (i.gradeLabel || 'Unidade') as any,
      size: i.size || 'UN',
      quantity: i.quantity,
      fabric: i.fabricName
    })) : [{ product: '', grade: 'Masculino', size: 'G', quantity: 1 }]);

    // Set Custom Amount if exists
    setCustomAmountPaid(order.amountPaid ? order.amountPaid : '');
    setDiscountValue(order.discountValue || '');
    setLayoutUrls(order.layoutUrls && order.layoutUrls.length > 0
      ? order.layoutUrls
      : (order.layoutUrl ? [order.layoutUrl] : []));
    setDesignFileUrls(order.designFileUrls || []);

    setIsAdding(true);
  };

  const resizeImageToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800;
          if (width > height) {
            if (width > max_size) { height *= max_size / width; width = max_size; }
          } else {
            if (height > max_size) { width *= max_size / height; height = max_size; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Reset input so same file can be re-added if needed
    e.target.value = '';
    const dataUrls = await Promise.all(files.map(resizeImageToDataUrl));
    setLayoutUrls(prev => [...prev, ...dataUrls]);
  };

  const removeLayoutImage = (index: number) => {
    setLayoutUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDesignFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    const successUrls: string[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        console.log(`[Upload] Enviando: ${file.name} (${sizeMB}MB)`);
        const url = await orderService.uploadFile(file, `design-sources/${Date.now()}`);
        successUrls.push(url);
      } catch (err: any) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const msg = err?.message || err?.statusCode || 'Erro desconhecido';
        console.error(`[Upload] Falha: ${file.name} (${sizeMB}MB)`, err);
        errors.push(`${file.name} (${sizeMB}MB): ${msg}`);
      }
    }
    if (successUrls.length > 0) {
      setDesignFileUrls(prev => [...prev, ...successUrls]);
    }
    if (errors.length > 0) {
      notify.error(`Erro ao enviar ${errors.length} arquivo(s). Verifique se você está logado no sistema.`);
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const removeDesignFile = (index: number) => {
    setDesignFileUrls(prev => prev.filter((_, i) => i !== index));
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
    setPaymentStatus(PaymentStatus.PENDING);
    setCustomAmountPaid('');
    setDiscountValue('');
    setNewOrderBriefing('');
    setLayoutUrls([]);
    setDesignFileUrls([]);
    setIsUploading(false);
    setIsPartialEditMode(false);
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const doDelete = async (id: string) => {
    try {
      await orderService.delete(id);
      window.dispatchEvent(new Event('refreshData'));
      notify.success('Pedido excluído.');
    } catch (error) {
      console.error("Error deleting order", error);
      notify.error('Erro ao excluir pedido.');
    }
  };

  const handleFinalize = async () => {
    if (!clientName || !deliveryDate) return;

    setIsSaving(true);

    try {
      const calculatedTotal = parsedItems.reduce((acc, curr) => {
        const prod = productsByName.get((curr.product || '').trim().toLowerCase());
        const price = prod ? prod.basePrice : 35;
        return acc + (curr.quantity || 0) * price;
      }, 0);

      const parsedDiscount = typeof discountValue === 'number' ? discountValue : (parseFloat((discountValue || "0").toString()) || 0);
      const finalTotalValue = Math.max(0, calculatedTotal - parsedDiscount);

      const orderData = {
        orderNumber: await orderService.getNextOrderNumber(),
        clientId: clientsByName.get((clientName || '').toLowerCase())?.id || null, // Will be handled if not found? Service doesn't create client on fly currently.
        clientName: clientName,
        status: OrderStatus.RECEIVED,
        orderType: orderType,
        paymentStatus: paymentStatus, // Save payment status
        discountValue: parsedDiscount,
        totalValue: finalTotalValue,
        amountPaid: paymentStatus === PaymentStatus.FULL
          ? finalTotalValue
          : (customAmountPaid ? parseFloat(customAmountPaid.toString()) : 0),
        createdAt: new Date().toISOString(),
        deliveryDate: deliveryDate,
        briefing: editingOrderId ? undefined : newOrderBriefing,
        internalNotes: internalNotes,
        delayReason: delayReason,
        layoutUrl: layoutUrls[0] || '',
        layoutUrls: layoutUrls,
        items: parsedItems.map(item => {
          const prod = productsByName.get((item.product || '').trim().toLowerCase());
          
          let finalGrade = item.grade || 'Masculino';
          let finalSize = item.size || 'M';

          if (prod) {
            let allowedGradesObj: Record<string, string[]> | undefined;
            if (prod.allowedGrades && !Array.isArray(prod.allowedGrades)) {
              allowedGradesObj = prod.allowedGrades as Record<string, string[]>;
            } else if (Array.isArray(prod.allowedGrades)) {
              allowedGradesObj = {};
              (prod.allowedGrades as any).forEach((g: string) => {
                const cfg = GRADES.find((gconfig: any) => gconfig.label === g);
                if (cfg && allowedGradesObj) allowedGradesObj[g] = cfg.sizes;
              });
            }

            const allowedGradeLabels = allowedGradesObj ? Object.keys(allowedGradesObj) : GRADES.map((g: any) => g.label);
            const validGradesList = GRADES.filter((g: any) => allowedGradeLabels.includes(g.label));

            if (validGradesList.length === 0) {
                finalGrade = 'Unidade';
                finalSize = 'UN';
            } else if (!validGradesList.find((g: any) => g.label === finalGrade)) {
                finalGrade = validGradesList[0].label;
                finalSize = validGradesList[0].sizes[0] || 'UN';
            } else {
                const specificAllowedSizes = allowedGradesObj ? allowedGradesObj[finalGrade] : null;
                const currentGradeConfig = GRADES.find((g: any) => g.label === finalGrade);
                const availableSizes = specificAllowedSizes || (currentGradeConfig ? currentGradeConfig.sizes : []);
                if (!availableSizes.includes(finalSize)) {
                    finalSize = availableSizes[0] || 'UN';
                }
            }
          } else if (!item.grade) {
            finalGrade = 'Unidade';
            finalSize = 'UN';
          }

          return {
            id: Math.random().toString(), // Service ignores this on insert usually or mapping needs care
            productId: prod ? prod.id : 'p-custom',
            productName: item.product || 'Personalizado',
            fabricId: 'f-custom',
            fabricName: item.fabric || 'Não especificado',
            gradeLabel: finalGrade,
            size: finalSize,
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
        const newClient = await clientService.create({ name: clientName, whatsapp: '', email: '' });
        clientIdToUse = newClient.id;
      }

      if (editingOrderId) {
        await orderService.update(editingOrderId, {
          clientName,
          deliveryDate,
          totalValue: orderData.totalValue,
          discountValue: orderData.discountValue,
          internalNotes,
          delayReason,
          orderType,
          paymentStatus,
          clientId: clientIdToUse,
          amountPaid: orderData.amountPaid,
          items: orderData.items,
          layoutUrl: layoutUrls[0] || '',
          layoutUrls: layoutUrls,
          designFileUrls: designFileUrls
        });
      } else {
        await orderService.create({
          ...orderData,
          clientId: clientIdToUse,
          orderNumber: orderData.orderNumber,
          designFileUrls: designFileUrls,
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
      notify.error('Erro ao salvar pedido.');
    } finally {
      setIsSaving(false);
    }
  };

  const isOrderLate = deliveryDate && new Date(deliveryDate) < new Date();

  const handleReceivePayment = (order: Order) => {
    if (order.paymentStatus === PaymentStatus.FULL) return;
    setConfirmPaymentOrder(order);
  };

  const doReceivePayment = async (order: Order) => {
    setIsSaving(true);
    try {
      await orderService.update(order.id, {
        paymentStatus: PaymentStatus.FULL,
        amountPaid: order.totalValue
      });
      await financeService.create({
        type: 'income',
        category: 'sale',
        amount: order.totalValue,
        description: `Recebimento Pedido #${order.orderNumber} - ${order.clientName}`,
        date: new Date().toISOString()
      });
      window.dispatchEvent(new Event('refreshData'));
      notify.success('Pagamento registrado com sucesso!');
    } catch (error) {
      console.error("Error receiving payment:", error);
      notify.error('Erro ao registrar pagamento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">Gestão de Pedidos</h2>
          <p className="text-slate-500 font-medium whitespace-nowrap">Controle total sobre vendas e <span>{activeContext === 'store' ? 'solicitações da loja.' : 'produção.'}</span></p>
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
                        onClick={() => !isPartialEditMode && setActiveTab('items')}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-colors ${activeTab === 'items' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'} ${isPartialEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isPartialEditMode ? "Itens não podem ser editados em produção" : ""}
                      >Itens</button>
                      {isMasterAdmin && (
                        <button
                          onClick={() => !isPartialEditMode && setActiveTab('briefing')}
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'briefing' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300'} ${isPartialEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isPartialEditMode ? "Briefing bloqueado em produção" : ""}
                        >
                          <Bot className="w-3 h-3" /> Briefing IA
                        </button>
                      )}
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
                <div className={`grid grid-cols-1 ${isMasterAdmin ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-8 animate-in slide-in-from-left-4 duration-300`}>
                  <div className="space-y-6">
                    {/* Partial Edit Warning Banner */}
                    {isPartialEditMode && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Pedido em Produção</p>
                          <p className="text-[10px] text-amber-500/80 font-medium">Apenas o prazo de entrega e observações internas podem ser alterados para preservar a integridade do histórico financeiro e estoque.</p>
                        </div>
                      </div>
                    )}

                    {/* Order Type & Payment Status Logic moved here for cleaner UI */}
                    <div className={`bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6 ${isPartialEditMode ? 'opacity-60 pointer-events-none' : ''}`}>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configuração do Pedido</h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div>
                          <label className="text-[9px] font-bold text-emerald-500 uppercase block mb-2">Desconto</label>
                          <input
                            type="number"
                            placeholder="Desc. (R$)"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="w-full bg-slate-900 border border-emerald-900/50 rounded-xl px-3 py-3 text-[10px] font-black text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Layout Images — Multiple */}
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Layouts Aprovados
                          {layoutUrls.length > 0 && (
                            <span className="ml-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-lg text-[9px]">
                              {layoutUrls.length} imagem{layoutUrls.length !== 1 ? 'ns' : ''}
                            </span>
                          )}
                        </h4>
                      </div>
                      {/* Upload button — multiple files at once */}
                      <div className="mb-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="layout-upload"
                        />
                        <label
                          htmlFor="layout-upload"
                          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-2xl cursor-pointer transition-all text-xs font-bold text-slate-400 uppercase tracking-widest"
                        >
                          <Plus className="w-4 h-4" /> Adicionar Imagens
                        </label>
                      </div>
                      {/* Grid of thumbnails */}
                      {layoutUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                          {layoutUrls.map((url, idx) => (
                            <div
                              key={idx}
                              className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900"
                            >
                              <img src={url} alt={`Layout ${idx + 1}`} className="w-full h-full object-cover" />
                              {/* Overlay label */}
                              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-[8px] font-black text-slate-300 text-center py-0.5 uppercase tracking-widest">
                                Layout {idx + 1}
                              </div>
                              {/* Remove button */}
                              <button
                                onClick={(e) => { e.preventDefault(); removeLayoutImage(idx); }}
                                className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                title="Remover imagem"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Design Source Files — Heavy Files (.psd, .cdr, .rar) */}
                     <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                          <FileCode className="w-4 h-4" /> Arquivos de Design (Fontes)
                          {designFileUrls.length > 0 && (
                            <span className="ml-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[9px]">
                              {designFileUrls.length}
                            </span>
                          )}
                        </h4>
                        <span className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest">Suporta até 1GB (.psd, .cdr, .rar)</span>
                      </div>

                      <div className="mb-4">
                        <input
                          type="file"
                          accept=".psd,.cdr,.rar,.zip,.pdf,.ai,.eps,.svg,.7z,.tar,.gz,.tif,.tiff,.png,.jpg,.jpeg,.bmp,.indd,.xd,.fig,.sketch"
                          multiple
                          onChange={handleDesignFileUpload}
                          className="hidden"
                          id="design-upload"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="design-upload"
                          className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-xs font-bold uppercase tracking-widest ${isUploading ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-amber-500/5 border-amber-500/20 text-amber-500/60 hover:bg-amber-500/10 hover:border-amber-500'}`}
                        >
                          {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Enviando Arquivos...
                              </>
                          ) : (
                              <>
                                <Upload className="w-4 h-4" /> Anexar PSD, CDR, RAR...
                              </>
                          )}
                        </label>
                      </div>

                      {designFileUrls.length > 0 && (
                        <div className="space-y-2">
                          {designFileUrls.map((url, idx) => {
                              const fileName = url.split('/').pop() || 'Arquivo';
                              return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                            <FileCode2 className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-200 truncate">{fileName}</p>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-indigo-400 font-black uppercase hover:underline">Download</a>
                                        </div>
                                    </div>
                                    <button onClick={() => removeDesignFile(idx)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                              );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Client & Date */}
                    <div className="space-y-4">
                      <div className="relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className={`block text-[9px] font-black uppercase tracking-widest ml-1 ${!clientName ? 'text-rose-500' : 'text-slate-500'}`}>Cliente {!clientName && <span>*</span>}</label>
                            {clientName && orders.some(o => o.clientName?.toLowerCase() === clientName.toLowerCase() && (o.paymentStatus === 'Pendente' || o.paymentStatus === 'Sinal (50%)' || o.paymentStatus === 'Sinal / Parcial') && o.status !== 'CANCELLED') && (
                                <span className="text-[9px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded uppercase font-black tracking-widest animate-pulse border border-rose-500/30">
                                    ⚠️ Inadimplente / Débito Pendente
                                </span>
                            )}
                        </div>
                        <User className="absolute left-4 top-[2.2rem] text-slate-600 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          type="text"
                          list="client-options"
                          placeholder="Nome do Cliente"
                          value={clientName}
                          disabled={isPartialEditMode}
                          onChange={(e) => setClientName(e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 bg-slate-950 border rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all ${!clientName ? 'border-rose-900/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-slate-800'} ${isPartialEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        <datalist id="client-options">
                          {(clients || []).map(client => (
                            <option key={client.id} value={client.name} />
                          ))}
                        </datalist>
                      </div>
                      <div className="relative group">
                        <label className={`block text-[9px] font-black uppercase tracking-widest ml-1 mb-1 ${!deliveryDate ? 'text-rose-500' : 'text-slate-500'}`}>Entrega {!deliveryDate && <span>*</span>}</label>
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
                  {isMasterAdmin && (
                    <div className="space-y-4">
                      <OrderAiBriefing
                        products={products}
                        onItemsParsed={(aggregatedItems, formattedOutput) => {
                          setInternalNotes(prev => (prev ? prev + '\n\n' : '') + formattedOutput.trim());
                          setParsedItems(prev => [...prev, ...aggregatedItems]);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB: ITEMS (Original Right Column content) */}
              {activeTab === 'items' && (
                <OrderItemsForm
                  parsedItems={parsedItems}
                  products={products}
                  productsByName={productsByName}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  addNewManualItem={addNewManualItem}
                  discountValue={discountValue}
                  setDiscountValue={setDiscountValue}
                  isSaving={isSaving}
                  handleCloseModal={handleCloseModal}
                  handleFinalize={handleFinalize}
                />
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {contextOrders.map((order) => {
              const editable = canEditOrder(order.status);
              const estimatedCost = (order.items || []).reduce((acc, item) => {
                const prod = products.find(p => p.id === item.productId);
                return acc + (item.quantity * (prod?.costPrice || 0));
              }, 0);
              const realProfit = order.totalValue - estimatedCost;

              return (
                <div key={order.id} className="bg-slate-900/50 rounded-3xl border border-slate-800 p-5 flex flex-col hover:border-indigo-500/30 transition-all group overflow-hidden">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-slate-400 text-xs shrink-0">#{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border shrink-0 ${order.orderType === OrderType.SALE ? 'bg-emerald-900/20 border-emerald-900/40 text-emerald-400' : 'bg-amber-900/20 border-amber-900/40 text-amber-400'}`}>
                          {order.orderType === OrderType.SALE ? 'Venda' : 'Orçamento'}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-100 text-base truncate" title={order.clientName}>{order.clientName}</h4>
                      <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="truncate">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    {/* Status badge — fixed on the right, never overlaps name */}
                    <div className="shrink-0 max-w-[110px]">
                      <span className={`block px-2 py-1.5 rounded-xl text-[7px] font-black uppercase border tracking-wide text-center leading-tight ${STATUS_CONFIG[order.status]?.color}`}>
                        {STATUS_CONFIG[order.status]?.label}
                      </span>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="grid grid-cols-2 gap-3 mb-5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex-1">
                    <div className="min-w-0">
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-1">Valor Bruto</p>
                      <p className="font-black text-indigo-400 text-sm truncate">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-1">Pgto</p>
                      <div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wide border truncate max-w-full ${!order.paymentStatus || order.paymentStatus === PaymentStatus.PENDING ? 'bg-slate-800 border-slate-700 text-slate-400' :
                          order.paymentStatus === 'Sinal (50%)' || order.paymentStatus === 'Sinal / Parcial' ? 'bg-indigo-900/20 border-indigo-900/40 text-indigo-400' :
                            'bg-emerald-900/20 border-emerald-900/40 text-emerald-400'
                          }`}>
                          {order.paymentStatus || 'PENDENTE'}
                        </span>
                        {order.amountPaid && order.amountPaid > 0 && order.paymentStatus !== PaymentStatus.FULL && (
                          <p className="mt-1 text-[7px] text-slate-500 font-mono truncate">
                            PG: R$ {order.amountPaid.toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-1">Custo Est.</p>
                      <p className="font-bold text-slate-400 text-xs truncate">R$ {estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-1">Lucro Real</p>
                      <p className="font-bold text-emerald-500 text-xs truncate">R$ {realProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>


                  {/* Actions Grid */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/50">
                    {activeContext === 'store' ? (
                      <>
                        {order.status === OrderStatus.STORE_REQUEST && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const newStatus = OrderStatus.STORE_CONFERENCE;
                                await orderService.update(order.id, { status: newStatus });
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                                notify.info('Conferência iniciada.');
                                const client = clientsByName.get((order.clientName || '').toLowerCase());
                                if (client?.whatsapp) {
                                  const msg = getStatusUpdateMessage(order, newStatus);
                                  window.open(getWhatsAppLink(client.whatsapp, msg), '_blank');
                                }
                              } catch (err) { console.error(err); notify.error('Erro ao atualizar status.'); }
                            }}
                            className="flex-1 text-slate-400 hover:text-violet-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                            title="Iniciar Conferência"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === OrderStatus.STORE_CONFERENCE && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const newStatus = OrderStatus.STORE_CHECKED;
                                await orderService.update(order.id, { status: newStatus });
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                                notify.success('Conferência finalizada! Aguardando aprovação.');
                                const client = clientsByName.get((order.clientName || '').toLowerCase());
                                if (client?.whatsapp) {
                                  const msg = getStatusUpdateMessage(order, newStatus);
                                  window.open(getWhatsAppLink(client.whatsapp, msg), '_blank');
                                }
                              } catch (err) { console.error(err); notify.error('Erro ao atualizar status.'); }
                            }}
                            className="flex-1 text-slate-400 hover:text-teal-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                            title="Finalizar Conferência"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === OrderStatus.STORE_CHECKED && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const newStatus = OrderStatus.RECEIVED;
                                await orderService.update(order.id, { status: newStatus });
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                                notify.success('Pedido confirmado e movido para Produção!');
                                const client = clientsByName.get((order.clientName || '').toLowerCase());
                                if (client?.whatsapp) {
                                  const msg = getStatusUpdateMessage(order, newStatus);
                                  window.open(getWhatsAppLink(client.whatsapp, msg), '_blank');
                                }
                              } catch (err) { console.error(err); notify.error('Erro ao atualizar status.'); }
                            }}
                            className="flex-1 text-slate-400 hover:text-emerald-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                            title="Confirmar e Mover para Produção"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openChat(order)}
                          className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all text-slate-400 hover:text-indigo-400 flex justify-center items-center"
                          title="Chat com Cliente"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(order)}
                          className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all text-slate-400 hover:text-indigo-400 flex justify-center items-center"
                          title="Ver Detalhes"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="flex-1 text-slate-400 hover:text-rose-500 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                          title="Excluir Pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openChat(order)}
                          className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all text-slate-400 hover:text-indigo-400 flex justify-center items-center"
                          title="Chat com Cliente"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(order)}
                          className={`flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center ${editable ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 cursor-not-allowed opacity-50'}`}
                          title={editable ? "Editar Pedido" : "Pedido em produção - Edição bloqueada"}
                        >
                          {editable ? <Edit3 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={async () => await printServiceOrder(order)}
                          className="flex-1 text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                          title="OS Produção"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Receive Payment Button */}
                        {order.paymentStatus !== PaymentStatus.FULL && (
                          <button
                            onClick={() => handleReceivePayment(order)}
                            className="flex-1 text-slate-400 hover:text-emerald-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                            title="Registrar Pagamento Total"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={async () => await printInvoice(order)}
                          className="flex-1 text-slate-400 hover:text-emerald-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                          title="Visualizar DANFE"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const client = clientsByName.get((order.clientName || '').toLowerCase());
                            const phone = client?.whatsapp || '';
                            const message = getStatusUpdateMessage(order, order.status);
                            const link = getWhatsAppLink(phone, message);
                            window.open(link, '_blank');
                          }}
                          className="flex-1 text-slate-400 hover:text-indigo-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                          title="Enviar Status via WhatsApp"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const portalLink = `${window.location.origin}/?view=client_portal`;
                            const msg = `Olá! Acompanhe o status do seu pedido #${order.orderNumber} em nosso Portal do Cliente:\n\n🔗 ${portalLink}\n\nUse seu WhatsApp e o Número do Pedido (${order.orderNumber}) para acessar.`;
                            navigator.clipboard.writeText(msg);
                            notify.success('Link do Portal copiado! Cole no WhatsApp do cliente.');
                          }}
                          className="flex-1 text-slate-400 hover:text-cyan-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                          title="Copiar Link do Portal do Cliente"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="flex-1 text-slate-400 hover:text-rose-500 p-2.5 rounded-xl bg-slate-950 border border-slate-800 transition-all flex justify-center items-center"
                          title="Excluir Pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      {chatOrder && (
        <OrderChatDrawer
          chatOrder={chatOrder}
          onClose={() => setChatOrder(null)}
        />
      )}

      {/* Confirm: Delete Order */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Excluir Pedido"
        message="Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita."
        variant="danger"
        confirmLabel="Excluir"
        onConfirm={() => { if (confirmDeleteId) doDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Confirm: Receive Payment */}
      {confirmPaymentOrder && (
        <ConfirmModal
          isOpen={true}
          title="Confirmar Recebimento"
          message={`Confirmar recebimento INTEGRAL de R$ ${confirmPaymentOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para o Pedido #${confirmPaymentOrder.orderNumber}?\n\nIsso gerará um lançamento de receita no financeiro.`}
          variant="success"
          confirmLabel="Confirmar Pagamento"
          onConfirm={() => { doReceivePayment(confirmPaymentOrder); setConfirmPaymentOrder(null); }}
          onCancel={() => setConfirmPaymentOrder(null)}
        />
      )}
    </div>
  );
};

export default Orders;
