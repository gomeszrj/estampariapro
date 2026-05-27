import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  User, 
  Search, 
  Send, 
  Wand2, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Loader2, 
  FileText, 
  Flame,
  Shirt, 
  RotateCcw, 
  ArrowRight, 
  Heart,
  Smartphone,
  Check,
  Award,
  ShieldCheck,
  Zap,
  Truck,
  Eye,
  ChevronRight,
  Printer,
  Compass,
  DollarSign,
  ShoppingBag,
  X,
  Info,
  Phone,
  Clock,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Product Type matching server model
interface Product {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  badges: string[];
  details: string;
  price: number;
}

// AI Proposal Type matching the server return
interface DesignProposal {
  teamName: string;
  colorPalette: string[];
  chestGraphic: string;
  collarStyle: string;
  jerseyDetails: string;
  slogan: string;
  designConcept: string;
}

// Support Chat message structure
interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

// Realized Quote Response
interface QuoteResult {
  productName: string;
  quantity: number;
  baseUnitPrice: number;
  customFeeUnit: number;
  discountPercentage: number;
  finalUnitPrice: number;
  finalTotalPrice: number;
  deliveryEstimate: string;
  minimumUnitsAlert: string | null;
}

export default function App() {
  // --- CORE STATE ---
  const [products, setProducts] = useState<Product[]>([
    {
      id: "regata-lakers",
      category: "NBA",
      title: "Regata NBA Lakers Roxa",
      subtitle: "Regata com sublimação premium e respirabilidade máxima.",
      description: "Estilo Lakers com corte profissional e tecido Dry-Max AeroMesh.",
      badges: ["Tec Premium", "Sublimação Total", "AeroMesh Pro"],
      details: "Acabamento reforçado nas costuras ombro-a-ombro, gola em V, tecido AeroMesh ultra respirável ideal para alta performance em quadra e no cotidiano.",
      price: 89.90,
    },
    {
      id: "regata-bulls",
      category: "NBA",
      title: "Regata NBA Bulls Vermelha",
      subtitle: "Regata Bulls Vermelha premium com tecido AeroMesh.",
      description: "Corte clássico de basquete premium, estampa de alto brilho.",
      badges: ["Tec Premium", "Bulls Classic", "Secagem Rápida"],
      details: "Uniformes oficiais da Chicago Bulls Concept, costura dupla e elastano para máximo conforto e durabilidade.",
      price: 89.90,
    },
    {
      id: "manga-longa-azul",
      category: "UV+50",
      title: "Manga Longa UV+50 Azul",
      subtitle: "Proteção solar extrema UV+50 com termorregulação.",
      description: "Manga longa azul de alta performance para treinos ao ar livre.",
      badges: ["Proteção Solar", "Termorregulação", "Flexabilidade"],
      details: "Malha com proteção UV+50 bloqueadora de raios solares nocivos, com toque frio e ótima dispersão de suor.",
      price: 129.90,
    },
    {
      id: "manga-longa-preta",
      category: "UV+50",
      title: "Manga Longa UV+50 Preta",
      subtitle: "Sleek manga longa com detalhe neon e proteção UV+50.",
      description: "Visual tático com detalhes em circuitos de energia limão.",
      badges: ["Proteção Solar", "Design Tático", "Toque Frio"],
      details: "Ideal para treinos intensos sob o sol ou proteção tática em esportes ao ar livre. Tecido tecnológico super resistente.",
      price: 129.90,
    },
    {
      id: "camiseta-roxa",
      category: "MANGA CURTA",
      title: "Camiseta Dry Fit Roxa",
      subtitle: "Modelagem slim fit com caimento esportivo italiano.",
      description: "Camiseta premium Dry Fit na cor roxa de alta performance.",
      badges: ["Dry Fit Pro", "Super Leve", "Anti-Odor"],
      details: "A camiseta esportiva definitiva. Combina poliéster inteligente com fios elastano de toque suave, antialérgico e secagem ultra veloz.",
      price: 69.90,
    },
    {
      id: "camiseta-branca",
      category: "MANGA CURTA",
      title: "Camiseta Dry Fit Branca",
      subtitle: "Peça essencial branca com recortes cinza táticos.",
      description: "Dry Fit branca clássica com caimento estruturado moderno.",
      badges: ["Dry Fit Pro", "Proteção Térmica", "Não Amassa"],
      details: "Confeccionada em Poliamida Dry Touch, com painéis laterais respiráveis em cinza escuro para melhor fluxo térmico corporal.",
      price: 69.90,
    },
    {
      id: "oversized-bear",
      category: "DTF",
      title: "Oversized DTF Bear",
      subtitle: "Streetwear de algodão premium com estampa de alta nitidez.",
      description: "Estilo urbano oversized moderno com ilustração Bear robusta.",
      badges: ["100% Algodão", "Estamparia DTF Touchless", "Modelagem Solta"],
      details: "Malha penteada premium fio 30.1, estampa aplicada com tecnologia DTF industrial que garante cores ultra vibrantes que nunca desbotam ou racham.",
      price: 99.90,
    }
  ]);

  const [activeTab, setActiveTab] = useState<'catalog' | 'customizer' | 'generator' | 'chat'>('catalog');
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0] || {
    id: "regata-lakers",
    category: "NBA",
    title: "Regata NBA Lakers Roxa",
    subtitle: "Regata com sublimação premium e respirabilidade máxima.",
    description: "Estilo Lakers com corte profissional e tecido Dry-Max AeroMesh.",
    badges: ["Tec Premium", "Sublimação Total", "AeroMesh Pro"],
    details: "Acabamento reforçado nas costuras ombro-a-ombro, gola em V, tecido AeroMesh ultra respirável.",
    price: 89.90,
  });
  const [isApiKeyConnected, setIsApiKeyConnected] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // --- IMAGES MAPPING (from compiled Gemini generation) ---
  const jerseyImages: Record<string, string> = {
    "regata-lakers": "/src/assets/images/jersey_nba_purple_1779853332145.png",
    "regata-bulls": "/src/assets/images/jersey_nba_red_1779854006937.png",
    "manga-longa-azul": "/src/assets/images/jersey_manga_longa_1779853348937.png",
    "manga-longa-preta": "/src/assets/images/jersey_manga_longa_preto_1779854022944.png",
    "camiseta-roxa": "/src/assets/images/jersey_manga_curta_1779853362847.png",
    "camiseta-branca": "/src/assets/images/jersey_manga_curta_branco_1779854037116.png",
    "oversized-bear": "/src/assets/images/jersey_oversized_bear_1779853381876.png",
  };

  // State to hold highlighted hero jersey
  const [heroJerseyId, setHeroJerseyId] = useState<string>("regata-lakers");

  // --- CART STATE ---
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<any[]>([
    {
      id: "cart-item-1",
      product: {
        id: "manga-longa-azul",
        category: "UV+50",
        title: "Manga Longa UV+50 Azul",
        price: 129.90
      },
      quantity: 1,
      name: "ATLETA",
      number: "07"
    },
    {
      id: "cart-item-2",
      product: {
        id: "regata-lakers",
        category: "NBA",
        title: "Regata NBA Lakers Roxa",
        price: 89.90
      },
      quantity: 15,
      name: "GMZ PLAYER",
      number: "10"
    }
  ]);

  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [favoritesList, setFavoritesList] = useState<string[]>(["regata-lakers", "camiseta-roxa"]);

  // --- CUSTOMIZER & QUOTE STATE ---
  const [quoteQuantity, setQuoteQuantity] = useState<number>(15);
  const [hasCustomName, setHasCustomName] = useState<boolean>(true);
  const [hasCustomNumber, setHasCustomNumber] = useState<boolean>(true);
  const [customNameInput, setCustomNameInput] = useState<string>("ATLETA");
  const [customNumberInput, setCustomNumberInput] = useState<string>("10");
  const [layoutNotes, setLayoutNotes] = useState<string>("Desejamos o escudo do time no peito esquerdo em tons de prata.");
  
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState<boolean>(false);

  // --- AI DESIGN PROPOSAL GENERATOR STATE ---
  const [teamConcept, setTeamConcept] = useState<string>("Tigres mecânicos neon com garras de energia azul e roxa");
  const [predominantColor, setPredominantColor] = useState<string>("Roxo Neon e Cinza Escuro");
  const [selectedSport, setSelectedSport] = useState<string>("Futebol Americano / Flag Football");
  const [isGeneratingDesign, setIsGeneratingDesign] = useState<boolean>(false);
  const [generatedProposal, setGeneratedProposal] = useState<DesignProposal | null>(null);

  // --- VIRTUAL SUPPORT CHAT STATE ---
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([
    {
      id: "1",
      role: 'assistant',
      content: "Olá! Sou o assistente inteligente da GMZ Performance. Posso ajudar você com especificações técnicas de tecidos, prazos de envio, orçamentos em lote para seu time ou explicar a sublimação total esportiva. Como posso te apoiar hoje?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat console
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Toast Notification handler
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Perform a system integration check on start
  const verifySystemApi = async () => {
    try {
      // Connect to products api first
      const res = await fetch('/api/products');
      if (res.ok) {
        setIsApiKeyConnected(true);
        const data = await res.json();
        setProducts(data);
      } else {
        setIsApiKeyConnected(false);
      }
    } catch (err) {
      setIsApiKeyConnected(false);
    }
  };

  useEffect(() => {
    verifySystemApi();
    calculateQuotePreview();
  }, [selectedProduct, quoteQuantity, hasCustomName, hasCustomNumber]);

  // --- API CALL HANDLERS ---

  // 1. Calculate Quote Preview
  const calculateQuotePreview = async () => {
    setIsCalculatingQuote(true);
    try {
      const res = await fetch('/api/quote-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: quoteQuantity,
          hasCustomName,
          hasCustomNumber,
          notes: layoutNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setQuoteResult(data);
      } else {
        setErrorMessage(data.error || "Erro ao computar orçamento.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingQuote(false);
    }
  };

  // 2. Generate Team Design Proposal via Gemini AI
  const handleGenerateProposal = async () => {
    if (!teamConcept.trim()) return;
    setIsGeneratingDesign(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ai-design-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamConcept,
          mainColor: predominantColor,
          sport: selectedSport
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Houve uma falha na criação criativa do uniforme.");
      }
      setGeneratedProposal(data);
      triggerToast("Proposta criativa de uniforme esportivo gerada com sucesso!");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de conexão com o servidor de IA.");
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  // 3. Send Message in Sales Support Chat
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: SupportMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput("");
    setIsChatLoading(true);

    try {
      // Map entire history
      const history = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ai-chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao consultar o robô inteligente.");
      }

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro no chat de suporte.");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Copy text helper
  const handleCopyToClipboard = (text: string, label: string = "Copiado!") => {
    navigator.clipboard.writeText(text);
    triggerToast(`${label} copiado para a área de transferência.`);
  };

  const addToCart = (product: Product, quantity: number, name: string, number: string) => {
    const newItem = {
      id: Date.now().toString(),
      product,
      quantity,
      name: name || "ATLETA",
      number: number || "10"
    };
    setCartItems(prev => [...prev, newItem]);
    triggerToast(`Adicionado ao faturamento!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    triggerToast(`Item removido.`);
  };

  return (
    <div className="min-h-screen bg-[#040507] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white" id="gmz-catalog-app">
      
      {/* Dynamic Floating Success Notifications */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-purple-950/90 border border-purple-500/40 text-purple-200 px-6 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(139,92,246,0.3)] flex items-center gap-3 backdrop-blur-md"
            id="app-toast-alert"
          >
            <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 animate-pulse" />
            <span className="text-sm font-medium tracking-wide">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PREMIUM UPGRADED SHOPPING CART DRAWER --- */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setIsCartOpen(false)}
            id="cart-overlay-shadow"
          >
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#090b11] border-l border-purple-950/40 h-full flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              id="cart-drawer-body"
            >
              {/* Header */}
              <div className="p-5 border-b border-purple-950/30 flex justify-between items-center bg-[#0d0f17]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                  <span className="font-extrabold text-white text-sm uppercase tracking-wider">Seu Faturamento ({cartItems.length})</span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-800 animate-pulse" />
                    <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Carrinho Vazio</p>
                    <p className="text-slate-500 text-xs">Simule ou selecione produtos para adicioná-los aqui.</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3 bg-slate-950/40 border border-purple-950/20 rounded-xl flex items-start gap-3 relative group"
                    >
                      <img 
                        src={jerseyImages[item.product.id]} 
                        alt={item.product.title} 
                        className="w-14 h-14 object-contain rounded bg-slate-900 border border-slate-950 mt-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-xs text-white truncate max-w-[180px]">{item.product.title}</h4>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-500 text-[10px] font-bold uppercase hover:underline opacity-80 group-hover:opacity-100"
                          >
                            Excluir
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10 inline-block">{item.product.category}</p>
                        
                        <div className="flex mt-2 items-center justify-between text-[11px] text-slate-350 bg-[#0c0d13] p-1.5 rounded border border-purple-950/30">
                          <div>
                            <span className="text-slate-500 font-bold uppercase tracking-wide text-[9px] block">Por Unidade:</span>
                            <span className="font-mono text-cyan-400 font-bold">R$ {item.product.price.toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 font-bold uppercase tracking-wide text-[9px] block">Quantidade:</span>
                            <span className="font-mono text-white font-black">{item.quantity} Un.</span>
                          </div>
                        </div>

                        {(item.name || item.number) && (
                          <div className="text-[10px] text-purple-400 pt-1 font-mono flex gap-2">
                            <span>Costas: {item.name || "Sem Nome"}</span>
                            <span>• N°: {item.number || "Sem Número"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal & Checkout Actions */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-purple-950/30 bg-[#0d0f17] space-y-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Qtde Total de Peças:</span>
                      <span className="font-mono text-white font-bold">{cartItems.reduce((acc, item) => acc + item.quantity, 0)} Peças</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-purple-950/20 font-extrabold text-white">
                      <span>INVESTIMENTO TOTAL ESTIMADO:</span>
                      <span className="font-mono text-cyan-400">R$ {cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0).toLocaletoLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedProduct(products.find(p => p.id === cartItems[cartItems.length - 1].product.id) || products[0]);
                      setQuoteQuantity(cartItems.reduce((acc, item) => acc + item.quantity, 0));
                      setActiveTab('customizer');
                      setIsCartOpen(false);
                      triggerToast("Carregando itens no faturamento mestre...");
                    }}
                    className="w-full py-3 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Finalizar & Gerar Orçamento Oficial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider">Imprima e envie ao WhatsApp do faturamento oficial</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- APP HEADER BAR --- */}
      <header className="border-b border-purple-950/30 bg-[#07090d]/85 px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-40 backdrop-blur-lg" id="app-marketing-header">
        
        {/* Logo brand marker */}
        <div 
          onClick={() => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="flex items-center gap-3.5 cursor-pointer hover:opacity-95 transition-all" 
          id="brand-emblem-section"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]" id="header-logo-icon">
            <Shirt className="w-5.5 h-5.5 text-white transform -rotate-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-purple-400">GMZ Performance</span>
              <span className="text-[9px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">AeroMesh Pro</span>
            </div>
            <h1 className="text-xs font-bold tracking-tight text-slate-400 uppercase">Catálogo Premium</h1>
          </div>
        </div>

        {/* Global Web Navigation List - EXACTLY LIKE MOCKUP WRITER */}
        <nav className="flex items-center gap-1" id="header-nav-tabs">
          {[
            { label: 'Início', tab: 'catalog', action: () => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }},
            { label: 'Coleções', tab: 'catalog', action: () => { setActiveTab('catalog'); setTimeout(() => { document.getElementById("categories-grid-anchored")?.scrollIntoView({ behavior: 'smooth' }); }, 100); }},
            { label: 'Todos os produtos', tab: 'catalog', action: () => { setActiveTab('catalog'); setTimeout(() => { document.getElementById("products-grid-anchored")?.scrollIntoView({ behavior: 'smooth' }); }, 100); }},
            { label: 'Personalize', tab: 'customizer', action: () => { setActiveTab('customizer'); calculateQuotePreview(); }},
            { label: 'Como funciona', tab: 'catalog', action: () => { setActiveTab('catalog'); setTimeout(() => { document.getElementById("brand-process-timeline")?.scrollIntoView({ behavior: 'smooth' }); }, 100); }},
            { label: 'Contato', tab: 'chat', action: () => { setActiveTab('chat'); }}
          ].map((navItem, idx) => (
            <button 
              key={idx}
              onClick={navItem.action}
              className={`px-3 py-2 rounded-lg text-xs tracking-wide uppercase font-extrabold transition-all duration-200 ${
                activeTab === navItem.tab 
                  ? 'bg-purple-600/10 text-purple-300 font-semibold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
              id={`nav-tab-${idx}`}
            >
              {navItem.label}
            </button>
          ))}
        </nav>

        {/* Right Area: Search inputs, Shopping Cart indicator, contact details */}
        <div className="flex items-center gap-4" id="header-right-actions">
          
          {/* Mock Search trigger */}
          <div className="relative hidden md:block" id="header-search-bar">
            <input 
              type="text" 
              placeholder="Pesquisar fardamento..." 
              className="bg-[#0e1118]/80 border border-purple-950/40 rounded-xl py-1.5 pl-8 pr-4 text-[11px] text-white focus:outline-none focus:border-purple-600 w-44 transition-all placeholder-slate-600"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  triggerToast(`Buscando por fardamentos...`);
                }
              }}
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Interactive Shopping Cart Trigger Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/40 rounded-xl relative transition-all"
            id="cart-trigger-btn"
          >
            <ShoppingBag className="w-4 h-4 text-purple-300" />
            
            {/* Real Counter showing dynamic state count */}
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 border border-slate-900 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center animate-bounce shadow">
              {cartItems.length}
            </span>
          </button>

          {/* Fale Conosco CTA */}
          <button 
            onClick={() => setActiveTab('chat')}
            className="hidden lg:flex px-4 py-2 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_2px_15px_rgba(139,92,246,0.3)] items-center gap-2 transition-all active:scale-95"
            id="fale-conosco-btn"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Fale conosco</span>
          </button>
        </div>
      </header>

      {/* --- ERROR BANNER DISMISSIBLE --- */}
      {errorMessage && (
        <div className="mx-6 mt-6 bg-red-950/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between gap-4 animate-bounce" id="alert-banner">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-red-300">Aviso do Sistema</h5>
              <p className="text-xs text-red-200 mt-1">{errorMessage}</p>
            </div>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-xs text-slate-400 hover:text-white uppercase font-bold tracking-wider"
            id="dismiss-error-button"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* 1. DISCOVERY / DASHBOARD VIEW TAB (HOME LIKE THE MOCKUP)   */}
      {/* ========================================================== */}
      <AnimatePresence mode="wait">
        {activeTab === 'catalog' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex-1"
            id="discovery-catalogue-view"
          >
            
            {/* --- HERO MAIN GRAPHIC SECTION --- */}
            <section className="relative px-6 py-12 md:py-20 overflow-hidden border-b border-purple-950/20 bg-[#05060a]" id="hero-showcase">
              {/* Background abstract radial glows like the mockup */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-700/10 to-transparent blur-[120px] pointer-events-none" />
              <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-cyan-700/10 blur-[90px] pointer-events-none" />
              
              <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10" id="hero-layout-grid">
                
                {/* Hero textual column */}
                <div className="lg:col-span-5 space-y-6" id="hero-text-block">
                  <div className="space-y-4">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 inline-block" id="hero-tagline-category">
                      Coleções Alta Performance
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight uppercase" id="hero-title-header">
                      VISTA SUA <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-400 selection:text-white">
                        IDENTIDADE
                      </span>
                    </h2>
                    <p className="text-[11px] md:text-xs font-black tracking-widest text-[#989eba] uppercase block">
                      QUALIDADE. ESTILO. PERFORMANCE.
                    </p>
                  </div>
                  
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed tracking-wide font-sans max-w-lg" id="hero-promo-pitch">
                    Sua equipe merece o melhor em quadras, pistas ou salas de campeonato. 
                    Uniformes personalizados com materiais ultra leves Dry Touch, proteção solar homologada 
                    e estamparia digital de toque imperceptível que não racha.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2" id="hero-call-to-action">
                    <button 
                      onClick={() => {
                        const targetElement = document.getElementById("categories-grid-anchored");
                        targetElement?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-[0_4px_25px_rgba(139,92,246,0.35)] flex items-center gap-2 transition-all group cursor-pointer"
                      id="hero-explore-btn"
                    >
                      <span>Explorar Coleções</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" />
                    </button>
                    
                    <button 
                      onClick={() => {
                        setSelectedProduct(products.find(p => p.id === "regata-lakers") || products[0]);
                        setActiveTab('customizer');
                      }}
                      className="px-5 py-3.5 bg-[#11131a] hover:bg-[#1a1d26] text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase rounded-xl border border-purple-950/80 flex items-center gap-2.5 transition-all cursor-pointer"
                      id="hero-sim-btn"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      <span>Simulador Uniforme</span>
                    </button>
                  </div>

                  {/* Benefit items matching the sub-hero rows of mockup */}
                  <div className="pt-6 border-t border-purple-950/20 grid grid-cols-1 sm:grid-cols-3 gap-4" id="hero-bullets-row">
                    {[
                      { title: "TECNOLOGIA", desc: "Sublimação premium", icon: Zap },
                      { title: "QUALIDADE", desc: "Tecido e costura premium", icon: Award },
                      { title: "ENTREGA RÁPIDA", desc: "Para todo o Brasil", icon: Truck }
                    ].map((bullet, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-950/30 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <bullet.icon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-wide text-white">{bullet.title}</p>
                          <p className="text-[10px] text-slate-400">{bullet.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CENTRAL MOCKUP OVERLAPPING DISPLAY SIDE-BY-SIDE (Renders exactly matches the uploaded image jerseys) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center relative mt-10 lg:mt-0" id="hero-rendering-display">
                  
                  {/* Glowing neon purple giant circle backdrop matching layout */}
                  <div className="absolute w-[350px] md:w-[650px] h-[350px] md:h-[650px] rounded-full border-[1.5px] border-purple-700/20 shadow-[0_0_100px_rgba(168,85,247,0.15)] pointer-events-none" />
                  <div className="absolute w-[250px] md:w-[480px] h-[250px] md:h-[480px] rounded-full bg-gradient-to-tr from-purple-600/5 via-transparent to-transparent blur-3xl pointer-events-none" />

                  {/* Overlapping 4 Premium Jerseys layout in row on stage */}
                  <div className="w-full flex items-center justify-center relative select-none" id="stage-3d-jerseys-frame">
                    
                    {/* Stage background panel */}
                    <div className="absolute bottom-[-15px] w-[90%] h-6 bg-black/60 rounded-full blur-md opacity-70 pointer-events-none" />

                    <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl w-full relative z-10">
                      
                      {/* Jersey 1: Regata Lakers */}
                      <motion.div 
                        whileHover={{ y: -12, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="cursor-pointer flex flex-col items-center justify-end"
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "regata-lakers") || products[0]);
                          setActiveTab('customizer');
                        }}
                      >
                        <img 
                          src="/src/assets/images/jersey_nba_purple_1779853332145.png" 
                          alt="Regata Lakers Purple" 
                          className="max-h-[140px] md:max-h-[200px] object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.65)] hover:drop-shadow-[0_20px_25px_rgba(139,92,246,0.3)] transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[8px] md:text-[9px] uppercase font-black text-purple-400 bg-purple-950/40 px-2 py-0.5 mt-2 rounded border border-purple-500/10">NBA Lakers</span>
                      </motion.div>

                      {/* Jersey 2: Manga Longa Azul */}
                      <motion.div 
                        whileHover={{ y: -12, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="cursor-pointer flex flex-col items-center justify-end"
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "manga-longa-azul") || products[0]);
                          setActiveTab('customizer');
                        }}
                      >
                        <img 
                          src="/src/assets/images/jersey_manga_longa_1779853348937.png" 
                          alt="Manga Longa Azul" 
                          className="max-h-[140px] md:max-h-[200px] object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.65)] hover:drop-shadow-[0_20px_25px_rgba(139,92,246,0.3)] transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[8px] md:text-[9px] uppercase font-black text-cyan-400 bg-cyan-950/40 px-2 py-0.5 mt-2 rounded border border-cyan-500/10">UV+50 Cyan</span>
                      </motion.div>

                      {/* Jersey 3: Camiseta Roxa */}
                      <motion.div 
                        whileHover={{ y: -12, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="cursor-pointer flex flex-col items-center justify-end"
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "camiseta-roxa") || products[0]);
                          setActiveTab('customizer');
                        }}
                      >
                        <img 
                          src="/src/assets/images/jersey_manga_curta_1779853362847.png" 
                          alt="Dry Fit Roxa" 
                          className="max-h-[140px] md:max-h-[200px] object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.65)] hover:drop-shadow-[0_20px_25px_rgba(139,92,246,0.3)] transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[8px] md:text-[9px] uppercase font-black text-purple-400 bg-purple-950/40 px-2 py-0.5 mt-2 rounded border border-purple-500/10">Dry-Fit Purple</span>
                      </motion.div>

                      {/* Jersey 4: Oversized Bear */}
                      <motion.div 
                        whileHover={{ y: -12, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="cursor-pointer flex flex-col items-center justify-end"
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "oversized-bear") || products[0]);
                          setActiveTab('customizer');
                        }}
                      >
                        <img 
                          src="/src/assets/images/jersey_oversized_bear_1779853381876.png" 
                          alt="Oversized BEAR" 
                          className="max-h-[140px] md:max-h-[200px] object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.65)] hover:drop-shadow-[0_20px_25px_rgba(139,92,246,0.3)] transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[8px] md:text-[9px] uppercase font-black text-amber-500 bg-amber-950/40 px-2 py-0.5 mt-2 rounded border border-amber-500/10 font-sans">Street Bear</span>
                      </motion.div>

                    </div>
                  </div>

                  {/* Tiny caption under overlap row */}
                  <p className="text-[10px] text-slate-500 mt-6 tracking-widest uppercase flex items-center gap-1">
                    <Info className="w-3 h-3 text-purple-500" /> Clique em qualquer fardamento para carregar na área de personalização
                  </p>
                </div>

              </div>
            </section>

            {/* --- PREMIUM METRICS & FEEDBACK BANNER RIGHT BELOW HERO --- */}
            <section className="bg-[#080a0f] border-b border-purple-950/20 px-6 py-5" id="stats-banner-showcase">
              <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Stats numbers */}
                <div className="grid grid-cols-3 gap-6 md:gap-14 w-full md:w-auto text-left py-2 border-b md:border-b-0 border-purple-950/20 md:pr-10">
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">+5 ANOS</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">De mercado</span>
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">+10K</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Clientes atendidos</span>
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">+50K</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Peças produzidas</span>
                  </div>
                </div>

                {/* Middle client recommendation */}
                <div className="flex-1 flex items-center gap-3 justify-center md:justify-start">
                  {/* Testimonial avatar badges */}
                  <div className="flex -space-x-2.5">
                    <span className="w-7.5 h-7.5 rounded-full bg-purple-500 border border-slate-900 text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#7c3aed' }}>JC</span>
                    <span className="w-7.5 h-7.5 rounded-full bg-teal-500 border border-slate-900 text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#0d9488' }}>MA</span>
                    <span className="w-7.5 h-7.5 rounded-full bg-blue-500 border border-slate-900 text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#2563eb' }}>FL</span>
                  </div>
                  <div className="text-xs">
                    <p className="text-white font-bold tracking-wide italic leading-snug">"A qualidade do fardamento submetido é absurda! Tecido leve e visual neon impactante."</p>
                    <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mt-0.5">— Julio C., Cap. Vikings Flag Football</p>
                  </div>
                </div>

                {/* Right CTA button */}
                <button 
                  onClick={() => setActiveTab('chat')}
                  className="px-4 py-2 hover:bg-purple-600/10 border border-purple-950 hover:border-purple-600 text-[10px] uppercase font-extrabold tracking-widest text-purple-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Ver todas avaliações</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

              </div>
            </section>

            {/* --- PREMIUM "COLEÇÕES EM DESTAQUE" BENTO SECTION --- */}
            <section className="px-6 py-16 bg-[#06080b]" id="categories-grid-anchored">
              <div className="max-w-[1500px] mx-auto space-y-10">
                
                {/* Section title header */}
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block p-0">LINHAS SELECIONADAS</span>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">COLEÇÕES EM DESTAQUE</h3>
                  <div className="w-16 h-1 bg-purple-500 mx-auto rounded-full" />
                  <p className="text-xs text-slate-500 leading-normal max-w-md mx-auto">Cortes esportivos estruturados e desenvolvidos por modelistas profissionais brasileiros.</p>
                </div>

                {/* Bento Grid - 4 Large Categories matching layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Card 1: NBA BASKET */}
                  <div className="bg-gradient-to-tr from-purple-950/20 to-[#0e111a] border border-purple-950/40 rounded-2xl p-6 flex flex-col justify-between h-[340px] relative overflow-hidden group shadow-xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 pointer-events-none transition-all" />
                    
                    {/* Visual miniature overlap */}
                    <div className="absolute right-[-10px] bottom-[10px] w-36 h-36">
                      <img 
                        src="/src/assets/images/jersey_nba_purple_1779853332145.png" 
                        alt="Regatas NBA" 
                        className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-2 relative z-10">
                      <span className="text-[10px] uppercase font-black text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">NBA CATEGORY</span>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">REGATAS</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[150px]">Estilo e liberdade para jogar ou para o dia a dia.</p>
                    </div>

                    <div className="relative z-10">
                      <button 
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "regata-lakers") || products[0]);
                          setActiveTab('customizer');
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold uppercase text-[10px] tracking-wider py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1"
                      >
                        <span>Simular Farda</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card 2: UV+50 PROTECTION */}
                  <div className="bg-gradient-to-tr from-cyan-950/10 to-[#0e111a] border border-purple-950/40 rounded-2xl p-6 flex flex-col justify-between h-[340px] relative overflow-hidden group shadow-xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 pointer-events-none transition-all" />
                    
                    {/* Visual miniature overlap */}
                    <div className="absolute right-[-10px] bottom-[10px] w-36 h-36">
                      <img 
                        src="/src/assets/images/jersey_manga_longa_1779853348937.png" 
                        alt="Uniformes UV+50" 
                        className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-2 relative z-10">
                      <span className="text-[10px] uppercase font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">PROTEÇÃO UV+50</span>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">MANGA LONGA</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[150px]">Proteção solar extrema no seu treino livre.</p>
                    </div>

                    <div className="relative z-10">
                      <button 
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "manga-longa-azul") || products[0]);
                          setActiveTab('customizer');
                        }}
                        className="bg-[#11131a] border border-purple-950/80 hover:border-purple-600 text-slate-300 hover:text-white font-extrabold uppercase text-[10px] tracking-wider py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1"
                      >
                        <span>Simular Farda</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card 3: DRY FIT CAMISETA */}
                  <div className="bg-gradient-to-tr from-purple-950/20 to-[#0e111a] border border-purple-950/40 rounded-2xl p-6 flex flex-col justify-between h-[340px] relative overflow-hidden group shadow-xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 pointer-events-none transition-all" />
                    
                    {/* Visual miniature overlap */}
                    <div className="absolute right-[-10px] bottom-[10px] w-36 h-36">
                      <img 
                        src="/src/assets/images/jersey_manga_curta_1779853362847.png" 
                        alt="Dry Fit Camisetas" 
                        className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-2 relative z-10">
                      <span className="text-[10px] uppercase font-black text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">TECNOLOGIA SECA</span>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">CAMISETAS</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[150px]">Modelagem inteligente que valoriza a ação esportiva.</p>
                    </div>

                    <div className="relative z-10">
                      <button 
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "camiseta-roxa") || products[0]);
                          setActiveTab('customizer');
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold uppercase text-[10px] tracking-wider py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1"
                      >
                        <span>Simular Farda</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card 4: STREETWEAR DTF OVERSIZED */}
                  <div className="bg-gradient-to-tr from-rose-950/10 to-[#0e111a] border border-purple-950/40 rounded-2xl p-6 flex flex-col justify-between h-[340px] relative overflow-hidden group shadow-xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 pointer-events-none transition-all" />
                    
                    {/* Visual miniature overlap */}
                    <div className="absolute right-[-10px] bottom-[10px] w-36 h-36">
                      <img 
                        src="/src/assets/images/jersey_oversized_bear_1779853381876.png" 
                        alt="Streetwear Oversized" 
                        className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="space-y-2 relative z-10">
                      <span className="text-[10px] uppercase font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">STREETWEAR</span>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">OVERSIZED</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-[150px]">Estilo com estampa de toque zero ultra durável.</p>
                    </div>

                    <div className="relative z-10">
                      <button 
                        onClick={() => {
                          setSelectedProduct(products.find(p => p.id === "oversized-bear") || products[0]);
                          setActiveTab('customizer');
                        }}
                        className="bg-[#11131a] border border-purple-950/80 hover:border-purple-600 text-slate-300 hover:text-white font-extrabold uppercase text-[10px] tracking-wider py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1"
                      >
                        <span>Simular Farda</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* --- CORE "PRODUTOS EM DESTAQUE" PORTFOLIO SYSTEM MATCHING REF 100% --- */}
            <section className="px-6 py-16 bg-[#040507] border-t border-purple-950/15 scroll-mt-20" id="products-grid-anchored">
              <div className="max-w-[1500px] mx-auto space-y-10">
                
                {/* Header */}
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <span className="text-xs font-black uppercase tracking-widest text-[#a855f7] block">COLEÇÃO COMPLETA</span>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">PRODUTOS EM DESTAQUE</h3>
                  <div className="w-16 h-1 bg-purple-500 mx-auto rounded-full" />
                  <p className="text-xs text-slate-450 leading-relaxed">Interação completa em tempo real. Favorite, visualize detalhes ou carregue na engrenagem customizadora de lotes.</p>
                </div>

                {/* 7 Gorgeous Products Grid System */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <motion.div 
                      key={product.id}
                      whileHover={{ y: -8 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="bg-[#0b0d13] border border-purple-950/30 rounded-2xl p-5 flex flex-col justify-between relative group shadow-xl"
                      id={`destaque-card-${product.id}`}
                    >
                      {/* Aura */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-purple-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/10 transition-all" />

                      {/* Top Header Tags & Favorite Button */}
                      <div className="flex justify-between items-center relative z-10 w-full">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded">
                          {product.category} STYLE
                        </span>
                        
                        {/* Interactive Favorite Trigger */}
                        <button 
                          onClick={() => {
                            if (favoritesList.includes(product.id)) {
                              setFavoritesList(prev => prev.filter(f => f !== product.id));
                              triggerToast("Removido dos favoritos.");
                            } else {
                              setFavoritesList(prev => [...prev, product.id]);
                              triggerToast("Adicionado aos seus favoritos! ❤️");
                            }
                          }}
                          className="p-1.5 bg-[#0e1119] rounded-lg border border-purple-950 hover:bg-[#131722] hover:border-purple-600/40 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Heart className={`w-3.5 h-3.5 ${favoritesList.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Product display premium image layout */}
                      <div className="my-6 aspect-square max-h-[190px] flex items-center justify-center relative z-10 overflow-hidden">
                        <img 
                          src={jerseyImages[product.id]} 
                          alt={product.title} 
                          className="max-h-[180px] object-contain filter drop-shadow-[0_12px_15px_rgba(0,0,0,0.65)] hover:scale-105 transition-transform duration-500 cursor-pointer"
                          referrerPolicy="no-referrer"
                          onClick={() => setSelectedDetailProduct(product)}
                        />
                      </div>

                      {/* Info & Price Tags block */}
                      <div className="space-y-4 relative z-10">
                        <div>
                          <h4 
                            onClick={() => setSelectedDetailProduct(product)}
                            className="text-xs font-black text-white hover:text-purple-400 cursor-pointer transition-colors uppercase tracking-wide truncate"
                          >
                            {product.title}
                          </h4>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block p-0 mt-0.5">{product.category} PRO SUBLIMAÇÃO</span>
                        </div>

                        {/* Price Details */}
                        <div className="bg-[#0e1119] p-3 rounded-xl border border-purple-950/40 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 block leading-none">Preço Lote</span>
                            <span className="font-mono text-cyan-400 text-sm font-black">R$ {product.price.toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-emerald-400 block leading-none uppercase">Lote 3x s/ juros</span>
                            <span className="text-[9px] text-slate-400">R$ {(product.price / 3).toFixed(2)} / un</span>
                          </div>
                        </div>

                        {/* Interactive Footer Action buttons */}
                        <div className="flex gap-2 w-full pt-1">
                          
                          {/* Specific customizer action triggers */}
                          <button 
                            onClick={() => setSelectedDetailProduct(product)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-[#131722]/80 border border-purple-950 text-slate-300 hover:text-white font-extrabold text-[10px] uppercase rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Atalhos</span>
                          </button>

                          <button 
                            onClick={() => {
                              setSelectedProduct(product);
                              setActiveTab('customizer');
                              calculateQuotePreview();
                            }}
                            className="flex-1 py-2 bg-gradient-to-tr from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-[10px] uppercase rounded-xl shadow-[0_2px_10px_rgba(139,92,246,0.25)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Simular</span>
                          </button>

                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

              </div>
            </section>

            {/* --- FLOATING DETAILED PREVIEW AND QUICK ACTION MODAL OVERLAY --- */}
            <AnimatePresence>
              {selectedDetailProduct && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedDetailProduct(null)}
                  id="product-details-modal-box"
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="w-full max-w-2xl bg-[#090b12] border border-purple-950/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-bl-full pointer-events-none blur-3xl" />
                    
                    {/* Close button modal */}
                    <button 
                      onClick={() => setSelectedDetailProduct(null)}
                      className="p-1.5 hover:bg-slate-900 rounded-lg absolute top-5 right-5 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      
                      {/* Left: Product enlarged high resolution render */}
                      <div className="flex flex-col items-center justify-center bg-slate-950/40 border border-purple-950/30 p-4 rounded-2xl relative">
                        <img 
                          src={jerseyImages[selectedDetailProduct.id]} 
                          alt={selectedDetailProduct.title} 
                          className="max-h-[220px] object-contain filter drop-shadow-[0_15px_20px_rgba(0,0,0,0.65)] hover:scale-105 transition-transform duration-500 select-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="mt-4 text-center">
                          <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded">Tecnologia AeroMesh Pro</span>
                        </div>
                      </div>

                      {/* Right: Technical specifications list */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-[#a855f7] tracking-widest bg-purple-500/10 border border-purple-500/15 px-2.5 py-0.5 rounded inline-block">LINHA PROFISSIONAL</span>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">{selectedDetailProduct.title}</h3>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Categoria: {selectedDetailProduct.category} + Sublimação total</p>
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed font-sans">{selectedDetailProduct.details}</p>

                        <div className="bg-[#0d0f17] border border-purple-950/35 p-3.5 rounded-xl space-y-1 my-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Preço Base Unitário:</span>
                            <span className="font-mono text-white font-extrabold">R$ {selectedDetailProduct.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-purple-950/10 text-emerald-400 font-bold">
                            <span>Com 20% desconto em fardamentos (50+):</span>
                            <span className="font-mono">R$ {(selectedDetailProduct.price * 0.8).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Modal Action CTA */}
                        <div className="space-y-2 pt-1">
                          
                          <button 
                            onClick={() => {
                              setSelectedProduct(selectedDetailProduct);
                              setActiveTab('customizer');
                              calculateQuotePreview();
                              setSelectedDetailProduct(null);
                            }}
                            className="w-full py-3 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Wand2 className="w-4 h-4" />
                            <span>Simular Fardamento Completo</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => {
                                addToCart(selectedDetailProduct, 1, "ATLETA", "10");
                                setSelectedDetailProduct(null);
                              }}
                              className="py-2.5 bg-slate-900 hover:bg-[#12141a] border border-purple-950/40 hover:border-purple-600 text-[10px] font-bold uppercase text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer"
                            >
                              Adicionar Retalho (1)
                            </button>
                            <button 
                              onClick={() => {
                                addToCart(selectedDetailProduct, 25, "LOTE TIME", "05");
                                setSelectedDetailProduct(null);
                              }}
                              className="py-2.5 bg-purple-950/30 hover:bg-purple-900/30 border border-purple-500/30 text-[10px] font-bold uppercase text-purple-300 rounded-xl transition-all cursor-pointer"
                            >
                              Adicionar Lote (25)
                            </button>
                          </div>

                        </div>
                      </div>

                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- INTERACTIVE "PERSONALIZE DO SEU JEITO" BANNER CARD SECTION --- */}
            <section className="px-6 py-10 bg-[#06080b]">
              <div className="max-w-[1500px] mx-auto bg-gradient-to-tr from-[#0b0c13] via-[#040507] to-purple-950/20 rounded-3xl p-8 md:p-12 border border-purple-950/50 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden" id="promotional-banner-customized">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-bl-full blur-3xl pointer-events-none" />
                
                {/* Text explanation */}
                <div className="space-y-4 max-w-xl text-center md:text-left">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#a855f7] bg-purple-500/10 border border-purple-500/15 px-3 py-1 rounded-lg">PROJETO SOB MEDIDA</span>
                  <h4 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">PERSONALIZE DO SEU JEITO</h4>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                    Fardamento 100% autoral. Adicione nome de cada membro, numeração customizada, patrocinadores e brasões vetorizados no painel do layout. 
                    Escolha a gola ideal, tecidos na barra e a costura tática perfeita para estufar as redes ou erguer taças.
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
                    <button 
                      onClick={() => {
                        setSelectedProduct(products[0]);
                        setActiveTab('customizer');
                      }}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                    >
                      Personalizar agora &rarr;
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('generator');
                      }}
                      className="px-5 py-3 bg-slate-900 hover:bg-[#12141a] border border-purple-950/60 text-slate-350 hover:text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      Diretor criativo IA
                    </button>
                  </div>
                </div>

                {/* Right: Steps in flow schema vector matching reference */}
                <div className="bg-[#0b0c11] border border-purple-950/40 p-5 rounded-2xl w-full max-w-sm shrink-0 space-y-4 shadow-xl">
                  <h5 className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Etapas de faturamento e entrega</h5>
                  
                  <div className="space-y-3">
                    
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-black flex items-center justify-center shrink-0">1</div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase">ESCOLHA O MODELO BASE</p>
                        <p className="text-[10px] text-slate-500">Sublimação Dry Fit ou Proteção Térmica UV+50.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-black flex items-center justify-center shrink-0">2</div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase">DEFINA ARQUIVOS & SEÇÕES</p>
                        <p className="text-[10px] text-slate-500">Insira nomes, listagem de tamanhos e logo do time.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-black flex items-center justify-center shrink-0">3</div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase">RECEBA EM CASA COM FRETE SEGURO</p>
                        <p className="text-[10px] text-slate-500">Confecção expressa monitorada pelos especialistas GMZ.</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 2. CUSTOMIZER & QUOTE CALCULATOR VIEW TAB                  */}
      {/* ========================================================== */}
      <AnimatePresence mode="wait">
        {activeTab === 'customizer' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex-1 max-w-[1450px] mx-auto w-full p-6 "
            id="builder-customizer-view"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Visual Custom Setup (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-6" id="visual-control-panel">
                
                {/* Uniform Selection Header */}
                <div className="bg-[#0b0d12] border border-purple-950/20 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-purple-950/30 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-purple-400">PASSO 1 DE 3</span>
                      <h3 className="text-base font-bold text-white uppercase tracking-tight">Selecione o fardamento esportivo</h3>
                    </div>
                    <span className="text-xs text-slate-400">Orçamento em tempo real</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0d0f14] p-2.5 rounded-xl border border-purple-950/40" id="product-tabs-grid">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                        }}
                        className={`p-3 rounded-lg text-left border flex flex-col justify-between transition-all ${
                          selectedProduct.id === p.id 
                            ? 'bg-purple-500/10 border-purple-500/40 text-white' 
                            : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                        id={`product-tab-btn-${p.id}`}
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{p.category}</span>
                        <span className="text-xs font-black truncate mt-1">{p.title}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5 items-center p-4 bg-[#0d0f14]/80 rounded-xl border border-purple-950/20" id="selected-product-summary">
                    {/* Render visual product */}
                    <div className="w-24 h-24  rounded-lg flex items-center justify-center p-1" id="selected-rendering-thumbnail">
                      <img 
                        src={jerseyImages[selectedProduct.id]} 
                        alt="Jersey Visual Summary" 
                        className="h-20 object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold uppercase text-purple-400 tracking-wider">Características Base do Modelo</h4>
                      <p className="text-sm font-black text-white">{selectedProduct.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{selectedProduct.details}</p>
                    </div>
                  </div>
                </div>

                {/* Personalization specifications (Names & Numbers) */}
                <div className="bg-[#0b0d12] border border-purple-950/20 rounded-2xl p-5 space-y-5 shadow-xl" id="customizer-options-card">
                  <div className="flex justify-between items-center border-b border-purple-950/30 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-purple-400">PASSO 2 DE 3</span>
                      <h3 className="text-base font-bold text-white uppercase tracking-tight">Personalize Nome, Número e Observações</h3>
                    </div>
                    <span className="text-xs text-slate-400">Mockup Pro</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="specifications-input-block">
                    {/* Character custom name input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <input 
                            type="checkbox" 
                            checked={hasCustomName}
                            onChange={(e) => setHasCustomName(e.target.checked)}
                            className="rounded accent-purple-500 w-3.5 h-3.5"
                          />
                          <span>Personalizar Nome nas Costas</span>
                        </label>
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">+ R$ 10,00 Un.</span>
                      </div>
                      <input 
                        type="text"
                        value={customNameInput}
                        onChange={(e) => setCustomNameInput(e.target.value.toUpperCase())}
                        disabled={!hasCustomName}
                        placeholder="NOME DO ATLETA"
                        className="w-full p-3 bg-[#0d0f14] border border-purple-950/40 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-600 disabled:opacity-30 uppercase font-bold tracking-widest"
                        id="custom-name-box"
                      />
                    </div>

                    {/* Character custom number input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <input 
                            type="checkbox" 
                            checked={hasCustomNumber}
                            onChange={(e) => setHasCustomNumber(e.target.checked)}
                            className="rounded accent-purple-500 w-3.5 h-3.5"
                          />
                          <span>Personalizar Número</span>
                        </label>
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">+ R$ 5,00 Un.</span>
                      </div>
                      <input 
                        type="text"
                        maxLength={3}
                        value={customNumberInput}
                        onChange={(e) => setCustomNumberInput(e.target.value.replace(/\D/g, ''))}
                        disabled={!hasCustomNumber}
                        placeholder="10"
                        className="w-full p-3 bg-[#0d0f14] border border-purple-950/40 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-600 disabled:opacity-30 text-center font-bold font-mono"
                        id="custom-number-box"
                      />
                    </div>
                  </div>

                  {/* Quantity Slider / Bulk selector */}
                  <div className="space-y-3 p-4 bg-[#0d0f14]/80 rounded-xl border border-purple-950/20" id="quantity-slider-block">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Quantidade total do fardamento:</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            if (quoteQuantity > 1) setQuoteQuantity(prev => prev - 1);
                          }}
                          className="w-7 h-7 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 rounded flex items-center justify-center text-white"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-white bg-slate-900 px-3.5 py-1 rounded font-mono border border-purple-500/20">{quoteQuantity}</span>
                        <button 
                          onClick={() => setQuoteQuantity(prev => prev + 1)}
                          className="w-7 h-7 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 rounded flex items-center justify-center text-white"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-slate-500">unids.</span>
                      </div>
                    </div>

                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={quoteQuantity}
                      onChange={(e) => setQuoteQuantity(parseInt(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      id="quote-range-slider"
                    />

                    {/* Scale explanation info */}
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>1 unid. (Retalho)</span>
                      <span className="text-purple-400 font-bold">10 unids. (Mínimo recomendado)</span>
                      <span>50+ unids. (Super Desconto de 20%)</span>
                    </div>
                  </div>

                  {/* Instructions details */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Observações de Layout / Escudo do Time</label>
                    <textarea 
                      value={layoutNotes}
                      onChange={(e) => setLayoutNotes(e.target.value)}
                      placeholder="Descreva as cores das mangas, posição e logotipo do brasão, patrocínio ou outras particularidades..."
                      className="w-full min-h-[90px] p-4 bg-[#0d0f14] border border-purple-950/40 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-600 resize-none font-sans"
                      id="quote-textarea-notes"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: Detailed pricing summary simulation (lg:col-span-4) */}
              <div className="lg:col-span-4" id="pricing-results-panel">
                <div className="bg-[#0b0d12] border border-purple-950/20 rounded-2xl p-5 space-y-6 shadow-2xl relative overflow-hidden" id="price-card-summary">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full pointer-events-none blur-3xl" />
                  
                  <div className="border-b border-purple-950/30 pb-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400">RESULTADO DA SIMULAÇÃO</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">Faturamento & Orçamento</h3>
                  </div>

                  {isCalculatingQuote ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-3" id="quote-loader-frame">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      <p className="text-xs text-slate-400">Calculando desconto progressivo...</p>
                    </div>
                  ) : quoteResult ? (
                    <div className="space-y-5 text-xs text-slate-350" id="quote-calculated-summary">
                      
                      {/* Sub-itemization */}
                      <div className="space-y-2.5 bg-slate-900/40 p-3.5 rounded-xl border border-purple-950/40" id="itemized-pricing-list">
                        
                        <div className="flex justify-between">
                          <span>Preço Base Unitário ({selectedProduct.category}):</span>
                          <span className="font-mono text-white">R$ {quoteResult.baseUnitPrice.toFixed(2)}</span>
                        </div>
                        
                        {(hasCustomName || hasCustomNumber) && (
                          <div className="flex justify-between text-[11px] text-purple-400">
                            <span>Personalizações unitárias:</span>
                            <span className="font-mono">+ R$ {quoteResult.customFeeUnit.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between pb-1.5 border-b border-purple-950/30">
                          <span>Soma Parcial Unitária:</span>
                          <span className="font-mono text-white font-bold">R$ {(quoteResult.baseUnitPrice + quoteResult.customFeeUnit).toFixed(2)}</span>
                        </div>

                        {quoteResult.discountPercentage > 0 ? (
                          <div className="flex justify-between text-emerald-400 font-bold">
                            <span>Desconto de Lote ({quoteResult.discountPercentage}%):</span>
                            <span className="font-mono">- R$ {((quoteResult.baseUnitPrice + quoteResult.customFeeUnit) * (quoteResult.discountPercentage / 100)).toFixed(2)} / Un.</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-500 italic flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Adicione mais 10 p/ desconto inicial</span>
                          </div>
                        )}

                        <div className="flex justify-between pt-1.5 font-bold text-white text-xs">
                          <span>Valor Unitário Final:</span>
                          <span className="font-mono text-cyan-400">R$ {quoteResult.finalUnitPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Giant Display final pricing */}
                      <div className="text-center p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-1 shadow-inner" id="giant-total-price">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Investimento Total Estimado</span>
                        <h4 className="text-3xl font-black text-white font-mono tracking-tight">R$ {quoteResult.finalTotalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        <p className="text-[11px] text-slate-500">Para {quoteResult.quantity} unidades do modelo {selectedProduct.category}</p>
                      </div>

                      {/* Logistical Estimate */}
                      <div className="space-y-2 text-xs" id="logistical-delivery-estimate">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Prazo de Confecção / Entrega:</span>
                          <span className="font-semibold text-white">{quoteResult.deliveryEstimate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Garantia Costura e Cor:</span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>12 Meses integral</span>
                          </span>
                        </div>
                      </div>

                      {/* Alert if units below 10 requirement */}
                      {quoteResult.minimumUnitsAlert && (
                        <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 p-3 rounded-xl flex items-start gap-2 text-[11px]" id="qty-under-requirement-alert">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{quoteResult.minimumUnitsAlert}</p>
                        </div>
                      )}

                      {/* Active CTAs */}
                      <div className="space-y-2.5 pt-2" id="quote-card-cta-block">
                        <button
                          onClick={() => {
                            const summaryText = 
                              `*ORÇAMENTO SIMULADO GMZ PERFORMANCE*\n` +
                              `Item: ${quoteResult.productName}\n` +
                              `Quantidade: ${quoteResult.quantity} unidades\n` +
                              `Valor Unitário: R$ ${quoteResult.finalUnitPrice.toFixed(2)}\n` +
                              `Valor Total: R$ ${quoteResult.finalTotalPrice.toFixed(2)}\n` +
                              `Estimativa de entrega: ${quoteResult.deliveryEstimate}\n` +
                              `Comentários: ${layoutNotes}`;
                            handleCopyToClipboard(summaryText, "Orçamento de uniforme");
                          }}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold tracking-wider uppercase rounded-xl shadow-[0_4px_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95"
                          id="copy-quote-and-close-btn"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copiar Resumo da Simulação</span>
                        </button>

                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-purple-950/50 text-[11px] font-bold uppercase text-slate-400 hover:text-white rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          id="print-quote-btn"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir Orçamento Oficial</span>
                        </button>
                      </div>

                    </div>
                  ) : null}

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 3. AI DESIGNblue PROPOSAL GENERATOR CARD VIRTUAL (CREATIVE)*/}
      {/* ========================================================== */}
      <AnimatePresence mode="wait">
        {activeTab === 'generator' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-8"
            id="ai-concept-creator-view"
          >
            
            {/* Explanatory introduction header */}
            <div className="bg-[#0b0d12] border border-purple-950/20 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5" id="ai-concept-introduction">
              <div className="space-y-1.5 flex-1">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Criação de Uniformes por Inteligência Artificial</span>
                </span>
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">O DIRETOR DE DESIGN ESPORTIVO INTELIGENTE</h2>
                <p className="text-xs text-slate-405 leading-relaxed">Preencha o conceito temático do fardamento de seu time. O assistente Gemini planejará paletas de cores esportivas de alto impacto, golas ideais, emblemas para o peito e até grito de guerra para motivar os fardados!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="ai-proposal-layout">
              
              {/* Left query controller (lg:col-span-4) */}
              <div className="lg:col-span-5 bg-[#0b0d12] border border-purple-950/20 rounded-2xl p-5 space-y-4 shadow-xl" id="generator-prompt-card">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-350 border-b border-purple-950/30 pb-2">Parâmetros Criativos</h3>
                
                <div className="space-y-4">
                  {/* Selected Sport Choice */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Modalidade do Time</label>
                    <select 
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      className="w-full p-3 bg-[#0d0f14] border border-purple-950/40 rounded-xl text-xs text-white focus:outline-none focus:border-purple-600"
                      id="sport-select-menu"
                    >
                      <option value="Futebol de Campo / Futsal">Futebol / Futsal</option>
                      <option value="Basquetebol / Streetball">Basquete / Streetball</option>
                      <option value="E-Sports / Pro Gaming">E-Sports / Pro Gaming</option>
                      <option value="Corrida de Rua e Triatlo">Corrida / Triatlo</option>
                      <option value="Voleibol / Vôlei de Praia">Vôlei de Praia</option>
                      <option value="Vôlei de Quadra">Vôlei de Quadra</option>
                      <option value="Crossfit / CrossTraining">Crossfit / Treino Funcional</option>
                    </select>
                  </div>

                  {/* Vibe / Theme Concept */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="font-bold uppercase tracking-wider text-slate-400">Concept Vibe do Uniforme</label>
                      <button 
                        onClick={() => {
                          const concepts = [
                            "Fênix cibernética de fogo ressurgindo de cinzas escuras com asas neon laranja e dourado",
                            "Tubarões da costa norte com dentes de metal e escamas de grafite em degradê azul gelo",
                            "Templários futuristas com armaduras pretas e linhas místicas vermelhas brilhantes",
                            "Pantera das sombras camuflada com olhos violetas elétricos e garras roxas neon"
                          ];
                          setTeamConcept(concepts[Math.floor(Math.random() * concepts.length)]);
                        }}
                        className="text-[10px] text-purple-400 hover:underline"
                        id="shuffle-concept-btn"
                      >
                        Embaralhar ideia
                      </button>
                    </div>
                    <textarea 
                      value={teamConcept}
                      onChange={(e) => setTeamConcept(e.target.value)}
                      className="w-full min-h-[105px] p-3.5 bg-[#0d0f14] border border-purple-950/40 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-600 resize-none font-sans"
                      placeholder="e.g. Lobos de gelo nórdicos com garras que emitem raios azuis neon..."
                      id="team-concept-textbox"
                    />
                  </div>

                  {/* Color suggestion preview */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-sans">Cor Predominante da Camisa</label>
                    <input 
                      type="text"
                      value={predominantColor}
                      onChange={(e) => setPredominantColor(e.target.value)}
                      className="w-full p-3 bg-[#0d0f14] border border-purple-950/40 rounded-xl text-xs text-white focus:outline-none focus:border-purple-600 font-sans"
                      placeholder="e.g. Preto com detalhes em Lilás Laser e Verde Flúor"
                      id="color-suggestion-input"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerateProposal}
                    disabled={isGeneratingDesign || !teamConcept.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-[0_4px_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95"
                    id="submit-generate-layout-btn"
                  >
                    {isGeneratingDesign ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Desenhando proposta criativa...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Gerar Proposta via Gemini AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right generated result display card (lg:col-span-8) */}
              <div className="lg:col-span-7" id="proposal-rendering-panel">
                <AnimatePresence mode="wait">
                  {generatedProposal ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-[#0b0d12] border border-purple-500/30 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden"
                      id="generated-team-proposal-card"
                    >
                      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-bl-full pointer-events-none blur-3xl animate-pulse" />
                      
                      {/* Shield design mockup */}
                      <div className="flex-col sm:flex-row flex justify-between items-start gap-4 border-b border-purple-950/30 pb-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-purple-400 uppercase font-black tracking-widest">
                            <Flame className="w-4.5 h-4.5 text-purple-400" />
                            <span>Proposta Criativa Homologada</span>
                          </div>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{generatedProposal.teamName}</h4>
                          <span className="text-[10px] text-slate-500 italic">Conceito sob medida para {selectedSport}</span>
                        </div>

                        <button 
                          onClick={() => {
                            const formatted = 
                              `TIME SUGERIDO: ${generatedProposal.teamName}\n` +
                              `CONCEITO: ${generatedProposal.designConcept}\n` +
                              `GOLA: ${generatedProposal.collarStyle}\n` +
                              `LOGOCENTRO: ${generatedProposal.chestGraphic}\n` +
                              `CORES: ${generatedProposal.colorPalette.join(', ')}\n` +
                              `GRITO DE GUERRA: ${generatedProposal.slogan}`;
                            handleCopyToClipboard(formatted, "Ficha criativa do time");
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-purple-950/70 text-slate-400 hover:text-white rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                          id="copy-proposal-btn"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Ficha</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs" id="proposal-cards-detail-grid">
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h5 className="font-extrabold uppercase tracking-widest text-slate-400">🌈 Paleta Esportiva Recomendada</h5>
                            <div className="flex flex-wrap gap-2 pt-1" id="palette-color-boxes">
                              {generatedProposal.colorPalette.map((color, i) => (
                                <span 
                                  key={i} 
                                  className="bg-purple-950/40 border border-purple-500/20 px-2.5 py-1 rounded text-[11px] font-bold text-slate-300 flex items-center gap-1.5"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                  <span>{color}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h5 className="font-extrabold uppercase tracking-widest text-slate-400">🛡️ Gráfico Central / Escudo</h5>
                            <p className="text-slate-350 bg-[#0d0f14] p-3 rounded-xl border border-purple-950/40 leading-relaxed font-sans">{generatedProposal.chestGraphic}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3" id="apparel-specs-proposal-grid">
                            <div className="space-y-1">
                              <h5 className="font-extrabold uppercase tracking-widest text-slate-400">👕 Padrão da Gola</h5>
                              <p className="bg-[#0d0f14] p-2.5 rounded-lg border border-purple-950/40 text-white font-bold">{generatedProposal.collarStyle}</p>
                            </div>
                            <div className="space-y-1">
                              <h5 className="font-extrabold uppercase tracking-widest text-slate-400">⚔️ Grito de Guerra (Nuca)</h5>
                              <p className="bg-purple-950/15 border border-purple-500/20 p-2.5 rounded-lg text-purple-300 font-bold italic">"{generatedProposal.slogan}"</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h5 className="font-extrabold uppercase tracking-widest text-slate-400">🧵 Grafismos e Detalhes da Camisa</h5>
                            <p className="text-slate-350 bg-[#0d0f14] p-3 rounded-xl border border-purple-950/40 leading-relaxed">{generatedProposal.jerseyDetails}</p>
                          </div>
                        </div>

                      </div>

                      {/* Philosophy summary block */}
                      <div className="bg-[#0d0f14] border border-purple-950/30 p-4 rounded-xl space-y-1.5" id="design-concept-poetic">
                        <h5 className="text-[10px] font-bold tracking-widest uppercase text-purple-400">Conceito e Identidade de Vendas</h5>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{generatedProposal.designConcept}</p>
                      </div>

                      {/* Insertion to simulator CTA */}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setLayoutNotes(prev => 
                              `*CONCEITO DE TIME IA*\n` +
                              `Nome sugerido: ${generatedProposal.teamName}\n` +
                              `Escudo: ${generatedProposal.chestGraphic}\n` +
                              `Cores: ${generatedProposal.colorPalette.join(', ')}\n` +
                              `Gola: ${generatedProposal.collarStyle}\n\n` +
                              `Adicionais: ${prev}`
                            );
                            setActiveTab('customizer');
                            triggerToast("Conceito mestre importado com sucesso para as notas do orçamento!");
                          }}
                          className="w-full py-2.5 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/30 text-xs font-bold uppercase tracking-wider text-purple-200 rounded-xl transition-all"
                          id="import-to-notes-btn"
                        >
                          Importar Conceito Detalhado ao Simulador de Orçamento
                        </button>
                      </div>

                    </motion.div>
                  ) : (
                    <div className="border border-dashed border-purple-950/40 rounded-2xl p-16 text-center text-slate-500 space-y-2.5 shadow-inner" id="generator-empty-state">
                      <Sparkles className="w-10 h-10 text-purple-950 mx-auto animate-pulse" />
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma Proposta Gerada</h4>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto">Adicione o conceito criativo de seu elenco para que o Gemini elabore as diretrizes visuais perfeitas em segundos.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 4. SALES ASSISTANT / INTEGRATIVE CUSTOM CHAT BOT (VIRTUAL) */}
      {/* ========================================================== */}
      <AnimatePresence mode="wait">
        {activeTab === 'chat' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex-1 max-w-[850px] mx-auto w-full p-6"
            id="virtual-sales-support-view"
          >
            <div className="bg-[#0b0d12] border border-purple-950/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px]" id="chat-assistance-container">
              
              {/* Header block with avatar */}
              <div className="bg-[#0d0f14] border-b border-purple-950/30 p-4 flex justify-between items-center" id="support-chat-header">
                <div className="flex items-center gap-3" id="bot-avatar-emblem">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center relative">
                    <MessageSquare className="w-4.5 h-4.5 text-purple-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 border border-[#0d0f14]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white uppercase flex items-center gap-1.5">
                      Consultor GMZ Performance
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Auxiliar inteligente de vendas em atacado</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setChatMessages([
                      {
                        id: "1",
                        role: 'assistant',
                        content: "Histórico limpo. Estou pronto para tirar qualquer dúvida sobre nossos fardamentos personalizados!",
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                    triggerToast("Memória do consultor reiniciada.");
                  }}
                  className="text-[9px] uppercase font-bold text-slate-500 hover:text-white hover:underline transition-all"
                  id="reset-history-btn"
                >
                  Limpar Chat
                </button>
              </div>

              {/* Preloaded interactive macro queries */}
              <div className="p-2 bg-[#08090d] border-b border-purple-950/20 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none text-xs text-slate-450" id="preset-queries-shortcut-row">
                {[
                  "Qual a quantidade mínima para personalizar?",
                  "Qual o tecido usado nas regatas?",
                  "Quais são as garantias e o frete?",
                  "Oferecem descontos para fardamentos?"
                ].map((shortcutStr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, shortcutStr)}
                    className="px-3 py-1 bg-slate-900 hover:bg-[#12141c] text-slate-300 hover:text-white border border-purple-950 rounded-lg text-[10px] inline-block transition-all shadow-sm select-none"
                    id={`shortcut-query-${idx}`}
                  >
                    ⭐ {shortcutStr}
                  </button>
                ))}
              </div>

              {/* Chat message listing layout */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-transparent" id="chat-messages-viewer">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    id={`chat-bubble-${msg.id}`}
                  >
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-tr from-purple-800 to-slate-900 text-white border border-purple-500/25 rounded-tr-none shadow-md' 
                        : 'bg-[#0e1117] text-slate-300 border border-purple-950/50 rounded-tl-none shadow-sm'
                    }`}>
                      <p className="select-text whitespace-pre-line">{msg.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">{msg.time}</span>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="mr-auto items-start max-w-[85%] flex flex-col" id="chat-assistant-spinner">
                    <div className="p-3.5 bg-[#0e1117] border border-purple-950/50 rounded-2xl rounded-tl-none text-xs text-slate-400 italic flex items-center gap-2">
                      <span className="flex h-2 w-2 items-center justify-center relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                      </span>
                      <span>Consultando catálogos de fardamentos...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input sender form box */}
              <form onSubmit={handleSendMessage} className="p-4 bg-[#0d0f14] border-t border-purple-950/30 flex items-center gap-2.5" id="chat-input-row">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte ao consultor GMZ sobre materiais, quantidades ou prazos..."
                  className="flex-1 p-3 bg-[#08090d] border border-purple-950/40 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-600"
                  id="chat-user-textbox"
                />
                
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-3.5 bg-gradient-to-tr from-purple-600/20 to-indigo-600/10 hover:from-purple-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-500/45 rounded-xl transition-all disabled:opacity-30"
                  id="chat-send-trigger"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 5. BRAND WORKFLOW TIMELINE PATH ("QUALIDADE EM CADA DETALHE")*/}
      {/* ========================================================== */}
      <section className="px-6 py-12 bg-[#050608] border-t border-purple-950/15" id="brand-process-timeline">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          <div className="text-center space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400">PASSO A PASSO DA COMPRA</h4>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Qualidade em Cada Detalhe</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center relative" id="process-steps-timeline">
            {/* Steps indicator item 1 */}
            <div className="space-y-3 bg-[#0b0d12]/50 p-4 border border-purple-950/20 rounded-xl" id="step-one">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400 font-bold font-mono text-sm shadow-md">
                1
              </div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Escolha</h5>
              <p className="text-[11px] text-slate-500 leading-normal">Selecione o modelo esportivo desejado no catálogo.</p>
            </div>

            {/* Steps indicator item 2 */}
            <div className="space-y-3 bg-[#0b0d12]/50 p-4 border border-purple-950/20 rounded-xl" id="step-two">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400 font-bold font-mono text-sm shadow-md">
                2
              </div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Personalize</h5>
              <p className="text-[11px] text-slate-500 leading-normal">Defina nomes, números, patrocínios e escudo.</p>
            </div>

            {/* Steps indicator item 3 */}
            <div className="space-y-3 bg-[#0b0d12]/50 p-4 border border-purple-950/20 rounded-xl" id="step-three">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400 font-bold font-mono text-sm shadow-md">
                3
              </div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Aprovação</h5>
              <p className="text-[11px] text-slate-500 leading-normal">Nossa equipe cria o layout digital 3D completo.</p>
            </div>

            {/* Steps indicator item 4 */}
            <div className="space-y-3 bg-[#0b0d12]/50 p-4 border border-purple-950/20 rounded-xl" id="step-four">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400 font-bold font-mono text-sm shadow-md">
                4
              </div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Produção</h5>
              <p className="text-[11px] text-slate-500 leading-normal">Sublimação total digital pro com costura esportiva.</p>
            </div>

            {/* Steps indicator item 5 */}
            <div className="space-y-3 bg-[#0b0d12]/50 p-4 border border-purple-950/20 rounded-xl" id="step-five">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400 font-bold font-mono text-sm shadow-md">
                5
              </div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Entrega rápida</h5>
              <p className="text-[11px] text-slate-500 leading-normal">Despacho garantido de seu lote com frete rastreável.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CELLPHONE ORDER PROMOTION BOX ("COMPRE DE ONDE ESTIVER") --- */}
      <section className="px-6 py-10 bg-[#090b10] border-t border-purple-950/20" id="promotional-banner-card">
        <div className="max-w-[1200px] mx-auto bg-gradient-to-r from-purple-950/20 via-[#0c0d14] to-purple-950/20 rounded-2xl p-6 md:p-10 border border-purple-950/60 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden" id="promo-banner-container">
          <div className="space-y-4 max-w-xl text-center md:text-left" id="promo-text-field">
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/15 px-3 py-1 rounded inline-block">PEDIDO DIRETO</span>
            <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Compre de Onde Estiver</h4>
            <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-sans">
              Interaja com nosso catálogo, simule os fardamentos de sua agremiação ou use nosso Diretor de Design por IA para receber um dossiê criativo. Nossa equipe de faturamento estará aguardando para validar seus arquivos.
            </p>
            
            <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start" id="promo-cta-row">
              <button 
                onClick={() => {
                  setSelectedProduct(products[0]);
                  setActiveTab('customizer');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase rounded-xl shadow-lg transition-all"
                id="promo-order-now-btn"
              >
                Iniciar Orçamento Simulador
              </button>
              <button 
                onClick={() => {
                  setActiveTab('chat');
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-purple-950/60 text-xs font-bold uppercase text-slate-350 hover:text-white rounded-xl transition-all"
                id="promo-talk-support-btn"
              >
                Falar c/ Suporte de Vendas
              </button>
            </div>
          </div>

          {/* Interactive cellphone mockup vector details */}
          <div className="w-52 h-44 bg-gradient-to-b from-purple-600/5 to-cyan-500/5 rounded-2xl border border-purple-950/40 p-4 relative shrink-0 flex flex-col justify-between" id="visual-phone-mock">
            <div className="text-center font-bold text-[10px] text-purple-400 uppercase tracking-widest bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20">
              GMZ MOBILE ACTIVE
            </div>
            
            <div className="space-y-1 text-[10px] text-slate-400" id="quick-indicators-mobile">
              <div className="flex justify-between border-b border-purple-950/40 pb-1">
                <span>Visualizador 3D:</span>
                <span className="text-emerald-400 font-bold font-mono">ONLINE</span>
              </div>
              <div className="flex justify-between border-b border-purple-950/40 pb-1">
                <span>Lote Estimado:</span>
                <span className="text-white font-bold font-mono">{quoteQuantity} Unids</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto Lote:</span>
                <span className="text-purple-300 font-bold font-mono">Até 20%</span>
              </div>
            </div>

            <div className="w-full text-center py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[9px] tracking-wider uppercase rounded-lg cursor-pointer transition-all" onClick={() => handleCopyToClipboard("https://gmzperformance.com/catalogo", "Link do catálogo")}>
              Compartilhar Catálogo
            </div>
          </div>
        </div>
      </section>

      {/* --- MASTER THEMED BOTTOM FOOTER --- */}
      <footer className="border-t border-purple-950/20 bg-[#020204] py-8 px-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left max-w-[1500px] w-full mx-auto" id="applet-footer">
        <div id="footer-logo">
          <p className="font-bold text-white uppercase tracking-wider">GMZ Performance S.A.</p>
          <p className="text-[10px] text-slate-650 mt-1">Sua farda. Seu time. Sua glória. © 2026. Todos os direitos reservados.</p>
        </div>

        <div className="flex flex-wrap gap-5 justify-center text-[10px] uppercase font-bold tracking-wider text-slate-500" id="footer-links-row">
          <span className="hover:text-purple-400 transition-colors pointer-events-none">Sublimação Dry-Max</span>
          <span className="hover:text-purple-400 transition-colors pointer-events-none">Garantia Costura Dupla</span>
          <span className="hover:text-purple-400 transition-colors pointer-events-none">Prazo de Confecção Garantido</span>
          <span className="hover:text-purple-450 transition-colors pointer-events-none text-xs flex items-center gap-1">
            <Heart className="w-3 px-0 text-red-500" /> Feito no Brasil
          </span>
        </div>
      </footer>

    </div>
  );
}
