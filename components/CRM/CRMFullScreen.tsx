import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Loader2, CheckCircle2, Clock, Paperclip, Search, Menu, Filter, Power } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { supabase } from '../../services/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { chatService, ChatSession } from '../../services/chatService';
import { OrderMessage } from '../../types';
import { whatsappService } from '../../services/whatsappService';
import { notify } from '../ui/toast';

interface CRMFullScreenProps {
    onLogout: () => void;
}

export const CRMFullScreen: React.FC<CRMFullScreenProps> = ({ onLogout }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'waiting' | 'answered' | 'all'>('waiting');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load and polling for sessions
    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 15000); // 15s poll
        return () => clearInterval(interval);
    }, []);

    // Global listener for new messages
    useEffect(() => {
        const channel = supabase
            .channel('fullscreen_chat_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'order_messages' },
                (payload) => {
                    const newMsg = payload.new as any;
                    
                    setSessions(prev => {
                        const exists = prev.find(s => s.id === newMsg.chat_id);
                        if (exists) {
                            return prev.map(s => s.id === newMsg.chat_id ? {
                                ...s,
                                last_message: newMsg.content,
                                last_message_at: newMsg.created_at,
                                unread_count: newMsg.sender_type === 'contact' && activeSessionId !== newMsg.chat_id ? (s.unread_count + 1) : s.unread_count
                            } : s).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
                        } else {
                            loadSessions();
                            return prev;
                        }
                    });

                    if (activeSessionId === newMsg.chat_id) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeSessionId]);

    useEffect(() => {
        if (activeSessionId) {
            loadMessages(activeSessionId);
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, unread_count: 0 } : s));
        }
    }, [activeSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeSessionId]);

    const loadSessions = async () => {
        try {
            const data = await chatService.getChatSessions();
            setSessions(data);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (chatId: string) => {
        setLoadingMessages(true);
        try {
            const msgs = await chatService.getMessages(chatId);
            setMessages(msgs);
        } catch (error) {
            console.error('Error loading chat messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const activeSession = sessions.find(s => s.id === activeSessionId);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeSessionId || !activeSession) return;

        setIsSending(true);
        try {
            if (activeSession.whatsapp_id) {
                // remove @s.whatsapp.net to send
                const phone = activeSession.whatsapp_id.split('@')[0];
                await whatsappService.sendMessage(phone, newMessage.trim());
            }

            const msg = await chatService.sendMessage(activeSessionId, 'store', newMessage.trim());
            
            setMessages([...messages, msg]);
            setNewMessage('');
            
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, last_message: msg.message, last_message_at: msg.created_at, unread_count: 0 };
                }
                return s;
            }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

        } catch (error) {
            console.error('Error sending message:', error);
            notify.error('Erro ao enviar mensagem');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSessionId || !activeSession) return;
        
        setUploadingMedia(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                if (activeSession.whatsapp_id) {
                    const phone = activeSession.whatsapp_id.split('@')[0];
                    await whatsappService.sendMedia(phone, base64, file.type, file.name);
                }
                const publicUrl = await orderService.uploadFile(file, `chat-media/${activeSessionId}`);
                const messageText = `[MEDIA]${publicUrl}`;
                const msg = await chatService.sendMessage(activeSessionId, 'store', messageText);
                setMessages(prev => [...prev, msg]);
                setUploadingMedia(false);
            };
        } catch (err) {
            console.error(err);
            notify.error('Erro ao enviar arquivo.');
            setUploadingMedia(false);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.client_name.toLowerCase().includes(searchQuery.toLowerCase()) || (session.active_order_number && session.active_order_number.includes(searchQuery));
        if (!matchesSearch) return false;
        
        const isClientLast = session.unread_count > 0; // Simple heuristic for answered vs waiting
        
        if (activeTab === 'waiting') return isClientLast;
        if (activeTab === 'answered') return !isClientLast;
        return true;
    });

    return (
        <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-10 bg-[#0f172a] overflow-hidden border-t border-slate-800">
            {/* LEFT SIDEBAR - CHAT LIST */}
            <div className="w-full md:w-[400px] border-r border-slate-800/60 flex flex-col bg-[#0b1120] shrink-0">
                {/* Header */}
                <div className="p-4 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="font-black text-slate-100 uppercase tracking-widest text-sm">Mega CRM</h2>
                    </div>
                    <button onClick={onLogout} title="Desconectar Aparelho" className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Power className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 bg-[#0b1120]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar cliente ou pedido..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Funnel Tabs */}
                <div className="flex px-3 pb-2 gap-2">
                    <button
                        onClick={() => setActiveTab('waiting')}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'waiting' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
                    >
                        Aguardando
                    </button>
                    <button
                        onClick={() => setActiveTab('answered')}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'answered' ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
                    >
                        Resp.
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'all' ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
                    >
                        Todos
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-800/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <p className="text-slate-500 text-sm">Nenhuma conversa encontrada neste funil.</p>
                        </div>
                    ) : (
                        filteredSessions.map(session => (
                            <div 
                                key={session.id}
                                onClick={() => setActiveSessionId(session.id)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-slate-800/40 flex items-start gap-4 ${activeSessionId === session.id ? 'bg-slate-800/60 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 relative">
                                    <User className="w-6 h-6 text-slate-400" />
                                    {session.active_order_id && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-[#0b1120] flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-white">#</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-bold text-slate-200 truncate pr-2">{session.client_name}</h3>
                                        <span className="text-[10px] text-slate-500 shrink-0">
                                            {format(new Date(session.last_message_at), "HH:mm")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${session.tag === 'Atendimento' ? 'bg-indigo-500/20 text-indigo-400' : session.tag === 'Arte' ? 'bg-fuchsia-500/20 text-fuchsia-400' : session.tag === 'Orçamento' ? 'bg-orange-500/20 text-orange-400' : session.tag === 'Dúvidas' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
                                            {session.tag}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${session.unread_count > 0 ? 'text-slate-300 font-bold' : 'text-slate-500'}`}>
                                        {session.unread_count === 0 && <CheckCircle2 className="w-3 h-3 inline mr-1 text-slate-600" />}
                                        {session.last_message.startsWith('[MEDIA]') ? '📷 Imagem' : session.last_message}
                                    </p>
                                </div>
                                {session.unread_count > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 mt-1">
                                        <span className="text-[10px] font-bold text-white">{session.unread_count}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT MAIN CHAT AREA */}
            <div className={`flex-1 flex-col bg-[#0f172a] ${!activeSessionId ? 'hidden md:flex' : 'flex absolute inset-0 z-10 md:static'}`}>
                {activeSessionId && activeSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveSessionId(null)} className="md:hidden p-2 text-slate-400 hover:text-white">
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                        {activeSession.client_name}
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${activeSession.tag === 'Atendimento' ? 'bg-indigo-500/20 text-indigo-400' : activeSession.tag === 'Arte' ? 'bg-fuchsia-500/20 text-fuchsia-400' : activeSession.tag === 'Orçamento' ? 'bg-orange-500/20 text-orange-400' : activeSession.tag === 'Dúvidas' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
                                            {activeSession.tag}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-500">{activeSession.whatsapp_id.split('@')[0]}</p>
                                </div>
                            </div>
                            
                            {/* ACTIVE ORDER CARD IN HEADER */}
                            {activeSession.active_order_id && (
                                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Pedido Ativo #{activeSession.active_order_number}</span>
                                    <span className="text-xs font-medium text-slate-300">{activeSession.active_order_status}</span>
                                </div>
                            )}
                        </div>

                        {/* Messages Area - WhatsApp Pattern Background */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 relative" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#0f172a' }}>
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => {
                                        const isStore = msg.sender === 'store';
                                        const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                                        const isMedia = msg.message.startsWith('[MEDIA]');
                                        const mediaUrl = isMedia ? msg.message.replace('[MEDIA]', '') : '';

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDate && (
                                                    <div className="flex justify-center my-6">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#0b1120] px-4 py-1.5 rounded-full border border-slate-800/60 shadow-sm">
                                                            {format(new Date(msg.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isStore ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] md:max-w-[65%] rounded-2xl p-3 shadow-md text-[15px] leading-relaxed
                                                        ${isStore
                                                            ? 'bg-emerald-800/90 text-emerald-50 rounded-tr-sm'
                                                            : 'bg-[#1e293b] text-slate-200 rounded-tl-sm border border-slate-700/50'
                                                        }`}
                                                    >
                                                        {isMedia ? (
                                                            <div className="rounded-xl overflow-hidden mb-1 bg-black/20">
                                                                <img src={mediaUrl} alt="Anexo" className="max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(mediaUrl, '_blank')} />
                                                            </div>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                                        )}
                                                        <p className={`text-[10px] font-bold mt-1 text-right flex items-center justify-end gap-1 ${isStore ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                                                            {format(new Date(msg.created_at), "HH:mm")}
                                                            {isStore && <CheckCircle2 className="w-3 h-3" />}
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
                        <div className="p-4 bg-slate-900/80 border-t border-slate-800/60 shrink-0">
                            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileAttach}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingMedia}
                                    className="w-12 h-12 shrink-0 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full flex items-center justify-center transition-colors"
                                    title="Anexar Arquivo"
                                >
                                    {uploadingMedia ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                                </button>

                                <input
                                    type="text"
                                    placeholder="Digite uma mensagem para o cliente..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    className="flex-1 bg-slate-800 border-none rounded-full py-4 px-6 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[15px] shadow-inner"
                                />
                                
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending || uploadingMedia}
                                    className="w-12 h-12 shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors shadow-lg shadow-emerald-600/20"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700/50 shadow-2xl">
                            <MessageSquare className="w-10 h-10 text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-300 mb-2">Mega CRM Estamparia</h2>
                        <p className="text-slate-500 max-w-sm">
                            Selecione uma conversa ao lado para visualizar o histórico ou enviar mensagens diretamente pelo sistema.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
