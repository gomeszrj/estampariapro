
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, BrainCircuit, RefreshCw, Save, MessageSquare } from 'lucide-react';
import { agentService, ChatMessage, AgentContext } from '../services/agentService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Product } from '../types';

interface CloudBotProps {
    onCreateOrder?: (data: { clientName: string; items: any[]; briefing: string }) => void;
}

export const CloudBot: React.FC<CloudBotProps> = ({ onCreateOrder }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: 'Olá! Sou o CloudBot. Como posso ajudar nas vendas hoje?', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [context, setContext] = useState<AgentContext>({ draftOrderItems: [] });
    const [products, setProducts] = useState<Product[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        productService.getAll().then(setProducts);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            // The Brain Works
            const result = await agentService.think(input, context, products);

            // Update Context (The "Brain" Display)
            setContext(result.updatedContext);

            // Reply
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.reply,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);

            if (result.action === 'CREATE_ORDER') {
                const briefing = await agentService.generateBriefing([...messages, userMsg, botMsg]);

                onCreateOrder && onCreateOrder({
                    clientName: result.updatedContext.clientName || '',
                    items: result.updatedContext.draftOrderItems || [],
                    briefing: briefing
                });
            } else if (result.action === 'CHECK_ORDER_STATUS') {
                // Execute Metadata Action
                await handleAction(result.action, result.actionMetadata, result.updatedContext);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleAction = async (action: string, metadata: any, currentContext: AgentContext) => {
        if (action === 'CHECK_ORDER_STATUS' && metadata?.orderNumber) {
            const order = await orderService.getByOrderNumber(metadata.orderNumber);
            let info = '';
            if (order) {
                info = `Pedido #${order.orderNumber} encontrado. Status: ${order.status}. Total: R$ ${order.totalValue.toFixed(2)}. Cliente: ${order.clientName}.`;
            } else {
                info = `Pedido #${metadata.orderNumber} não encontrado.`;
            }

            // Re-think with new info
            const newContext = { ...currentContext, orderStatusInfo: info };
            setContext(newContext);

            // Recursive call or just immediate follow-up?
            // Simplest: Add a system note to history and call think again?
            // Better: Call think with updated context and a standard "result found" prompt invisible to user?
            // Actually agentService.think takes (message, context).
            // We can pass a hidden system prompt as message or just re-call

            const result2 = await agentService.think("SYSTEM_INFO: " + info, newContext, products);

            const botMsg2: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: result2.reply,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg2]);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500">
            {/* LEFT: CHAT INTERFACE */}
            <div className="flex-1 bg-[#0f172a] rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
                <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-100 uppercase tracking-wide">CloudBot</h3>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-900/20'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800/50 p-4 rounded-2xl rounded-bl-none border border-slate-700/50 flex gap-1">
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Converse com o agente..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-4 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                        />
                        <button
                            onClick={handleSend}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: BRAIN VISUALIZATION */}
            <div className="w-[400px] bg-[#0f172a] rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <BrainCircuit className="w-6 h-6 text-purple-400" />
                    <h3 className="font-black text-slate-100 uppercase tracking-widest text-sm">Cérebro do Agente</h3>
                </div>

                {/* QR Code / Status Section */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-16 h-16 bg-white p-1 rounded-lg">
                        {/* Placeholder QR */}
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ExampleConnection" alt="QR Code" className="w-full h-full opacity-50" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-200 uppercase text-xs mb-1">WhatsApp Conectado</h4>
                        <p className="text-[10px] text-slate-500 leading-tight">Digitalize o QR Code para conectar uma nova sessão.</p>
                    </div>
                </div>

                {/* Context Cards */}
                <div className="space-y-4">
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl group hover:border-purple-500/50 transition-colors">
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1 block">Cliente Detectado</label>
                        <div className="text-slate-200 font-bold flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-400" />
                            {context.clientName || 'Aguardando identificação...'}
                        </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl group hover:border-purple-500/50 transition-colors">
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1 block">Intenção</label>
                        <div className="text-slate-200 font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            {context.detectedIntent || 'Analisando conversa...'}
                        </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl group hover:border-purple-500/50 transition-colors flex-1 min-h-[200px]">
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-3 block">Rascunho do Pedido</label>
                        {context.draftOrderItems && context.draftOrderItems.length > 0 ? (
                            <ul className="space-y-2">
                                {context.draftOrderItems.map((item: any, idx: number) => (
                                    <li key={idx} className="text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                                        <span>{item.quantity}x {item.product || 'Item'}</span>
                                        <span className="text-slate-500">{item.size}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-slate-600 text-xs italic text-center mt-10">Nenhum item identificado ainda.</div>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <button className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 transition-all active:scale-95 group">
                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Forçar Geração de Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};
