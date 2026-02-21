import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Search, Loader2 } from 'lucide-react';
import { orderService } from '../services/orderService';
import { supabase } from '../services/supabase';
import { OrderMessage } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatSession {
    orderId: string;
    clientName: string;
    orderNumber: string;
    status: string;
    lastMessage: string;
    lastMessageAt: string;
    lastSender: string;
    unread: number;
}

const Chats: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 15000); // Poll every 15s to update list
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeSessionId) {
            loadMessages(activeSessionId);

            // Realtime Subscription
            const channel = supabase
                .channel(`chat_messages_${activeSessionId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${activeSessionId}` },
                    (payload) => {
                        const newMsg = payload.new as OrderMessage;
                        setMessages(prev => {
                            // Prevent duplicates if we just sent it
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });

                        // Update sidebar automatically
                        setSessions(prev => prev.map(s => {
                            if (s.orderId === activeSessionId) {
                                return {
                                    ...s,
                                    lastMessage: newMsg.message,
                                    lastMessageAt: newMsg.created_at,
                                    lastSender: newMsg.sender
                                };
                            }
                            return s;
                        }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [activeSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadSessions = async () => {
        try {
            const data = await orderService.getChatSessions();
            setSessions(data);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (orderId: string) => {
        setLoadingMessages(true);
        try {
            const msgs = await orderService.getMessages(orderId);
            setMessages(msgs);
        } catch (error) {
            console.error('Error loading chat messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeSessionId) return;

        setIsSending(true);
        try {
            const msg = await orderService.sendMessage(activeSessionId, 'store', newMessage.trim());
            setMessages([...messages, msg]);
            setNewMessage('');

            // Optimitically update session list
            setSessions(prev => prev.map(s => {
                if (s.orderId === activeSessionId) {
                    return {
                        ...s,
                        lastMessage: msg.message,
                        lastMessageAt: msg.created_at,
                        lastSender: 'store'
                    };
                }
                return s;
            }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem');
        } finally {
            setIsSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const filteredSessions = sessions.filter(session =>
        session.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.orderNumber?.includes(searchTerm)
    );

    const activeSession = sessions.find(s => s.orderId === activeSessionId);

    return (
        <div className="flex h-[calc(100vh-80px)] bg-[#020617] animate-in slide-in-from-left-4 duration-500">

            {/* Sidebar - Chat List */}
            <div className="w-80 md:w-96 border-r border-slate-800/50 flex flex-col bg-[#0f172a]/50">
                <div className="p-4 border-b border-slate-800/50">
                    <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        Central de Atendimento
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar cliente ou pedido..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">
                            <MessageSquare className="w-8 h-8 opacity-20 mx-auto mb-2" />
                            Nenhuma conversa encontrada
                        </div>
                    ) : (
                        filteredSessions.map(session => (
                            <button
                                key={session.orderId}
                                onClick={() => setActiveSessionId(session.orderId)}
                                className={`w-full text-left p-3 rounded-xl transition-all flex gap-3
                  ${activeSessionId === session.orderId
                                        ? 'bg-indigo-600/10 border border-indigo-500/30'
                                        : 'hover:bg-slate-800/50 border border-transparent'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="text-sm font-bold text-slate-200 truncate pr-2">{session.clientName}</h4>
                                        <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                                            {format(new Date(session.lastMessageAt), "HH:mm")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2 text-xs">
                                        <p className={`truncate ${activeSessionId === session.orderId ? 'text-indigo-400' : 'text-slate-500'}`}>
                                            {session.lastSender === 'store' ? 'Você: ' : ''}{session.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#0f172a]">
                {activeSessionId && activeSession ? (
                    <>
                        {/* Chat View Header */}
                        <div className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-[#1e293b]/30 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-100">{activeSession.clientName}</h3>
                                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">
                                        Pedido #{activeSession.orderNumber}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => {
                                        const isStore = msg.sender === 'store';
                                        const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDate && (
                                                    <div className="flex justify-center my-4">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full">
                                                            {format(new Date(msg.created_at), "dd 'de' MMMM", { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isStore ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm
                            ${isStore
                                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                            : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className="text-[9px] font-bold mt-2 text-right opacity-70">
                                                            {format(new Date(msg.created_at), "HH:mm")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#1e293b]/30 border-t border-slate-800/50 shrink-0">
                            <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                                <input
                                    type="text"
                                    placeholder="Mensagem..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-xl py-3.5 pl-4 pr-14 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-indigo-600/20"
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400">Nenhum chat selecionado</h3>
                        <p className="text-sm">Selecione uma conversa na lista lateral para iniciar o atendimento.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Chats;
