import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Loader2, Maximize2, Minimize2, CheckCircle2, Clock, Paperclip, Image as ImageIcon } from 'lucide-react';
import { chatService, ChatSession } from '../../services/chatService';
import { whatsappService } from '../../services/whatsappService';
import { supabase } from '../../services/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderMessage } from '../../types';
import { notify } from '../ui/toast';

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const [messages, setMessages] = useState<OrderMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Funnel Tabs
    const [activeTab, setActiveTab] = useState<'waiting' | 'answered' | 'all'>('waiting');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load and polling for sessions
    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 15000); // 15s poll
        return () => clearInterval(interval);
    }, []);

    // Global listener for new messages via Supabase Realtime (on ANY chat)
    useEffect(() => {
        const channel = supabase
            .channel('global_chat_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as any;
                    
                    // Update sessions list globally
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
                            // If it's a completely new chat, just reload sessions to get client info
                            loadSessions();
                            return prev;
                        }
                    });

                    // If we are looking at this specific chat, append message
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

    // Load messages when active session changes
    useEffect(() => {
        if (activeSessionId) {
            loadMessages(activeSessionId);
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, unread_count: 0 } : s));
        }
    }, [activeSessionId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, activeSessionId]);

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeSessionId || !activeSession) return;

        setIsSending(true);
        try {
            // 1. Send via Evolution API first
            if (activeSession.whatsapp_id) {
                const phone = activeSession.whatsapp_id.split('@')[0];
                await whatsappService.sendMessage(phone, newMessage.trim());
            }

            // 2. Save to our database
            const msg = await chatService.sendMessage(activeSessionId, 'store', newMessage.trim());
            
            // 3. Update UI
            setMessages([...messages, msg]);
            setNewMessage('');
            
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        last_message: msg.message,
                        last_message_at: msg.created_at,
                        unread_count: 0
                    };
                }
                return s;
            }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

        } catch (error) {
            console.error('Error sending message:', error);
            notify.error('Erro ao enviar mensagem.');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSessionId || !activeSession) return;
        
        setUploadingMedia(true);
        try {
            // Get tenant_id for storage isolation
            const { data: { user } } = await supabase.auth.getUser();
            let tenantPrefix = 'default';
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
                if (profile?.tenant_id) tenantPrefix = profile.tenant_id;
            }

            // 1. Convert to Base64 for WhatsApp sending
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                
                // 2. Send via Evolution API
                if (activeSession.whatsapp_id) {
                    const phone = activeSession.whatsapp_id.split('@')[0];
                    await whatsappService.sendMedia(phone, base64, file.type, file.name);
                }

                // 3. Upload to Supabase Storage with tenant isolation
                const storagePath = `${tenantPrefix}/chat-media/${activeSessionId}/${file.name}`;
                const publicUrl = await supabase.storage.from('orders').upload(storagePath, file, {upsert: true}).then(d => supabase.storage.from('orders').getPublicUrl(storagePath).data.publicUrl);
                
                // 4. Save to DB with a special markdown/tag format so we know it's media
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
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const filteredSessions = sessions.filter(session => {
        const isClientLast = session.unread_count > 0;
        if (activeTab === 'waiting') return isClientLast;
        if (activeTab === 'answered') return !isClientLast;
        return true; // 'all'
    });

    const activeSession = sessions.find(s => s.id === activeSessionId);
    
    // Total unread/waiting count for the bubble
    const waitingCount = sessions.filter(s => s.unread_count > 0).length;

    return (
        <div className={`fixed z-[100] transition-all duration-300 ease-in-out flex flex-col ${
            !isOpen 
                ? 'bottom-6 right-6 w-16 h-16' 
                : isMaximized 
                    ? 'inset-4 w-auto h-auto' 
                    : 'bottom-6 right-6 w-[800px] h-[600px] max-w-[calc(100vw-3rem)]'
        }`}>
            {/* FLOATING BUTTON (Minimized State) */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform relative group"
                >
                    <MessageSquare className="w-7 h-7" />
                    {waitingCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#020617] shadow-lg animate-pulse">
                            {waitingCount}
                        </div>
                    )}
                </button>
            )}

            {/* OPEN CRM WIDGET */}
            {isOpen && (
                <div className="flex-1 bg-[#020617] border border-slate-700/60 rounded-2xl shadow-2xl flex overflow-hidden ring-1 ring-white/10 relative">
                    
                    {/* WIDGET SIDEBAR (Chat List) */}
                    <div className={`${activeSessionId && !isMaximized ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col bg-[#0f172a] border-r border-slate-800/60`}>
                        {/* Header & Controls */}
                        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center bg-slate-900/50">
                            <h3 className="font-black text-slate-100 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-400" />
                                CRM <span className="text-xs text-slate-500 font-medium ml-1">WhatsApp</span>
                            </h3>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors hidden md:block">
                                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* CRM Funnel Tabs */}
                        <div className="p-3 bg-slate-900/30 border-b border-slate-800/60">
                            <div className="flex bg-slate-950/50 rounded-lg p-1 gap-1 border border-slate-800/30">
                                <button
                                    onClick={() => setActiveTab('waiting')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 text-[9px] font-black py-2 rounded-md transition-all uppercase tracking-widest ${activeTab === 'waiting' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <Clock className="w-3 h-3" /> Aguarda
                                    {waitingCount > 0 && <span className="ml-1 bg-white/20 px-1.5 rounded-full text-white">{waitingCount}</span>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('answered')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 text-[9px] font-black py-2 rounded-md transition-all uppercase tracking-widest ${activeTab === 'answered' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <CheckCircle2 className="w-3 h-3" /> Resp.
                                </button>
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 text-[9px] font-black py-2 rounded-md transition-all uppercase tracking-widest ${activeTab === 'all' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Todos
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                            ) : filteredSessions.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-xs font-medium">Nenhuma conversa na fila.</div>
                            ) : (
                                filteredSessions.map(session => (
                                    <button
                                        key={session.id}
                                        onClick={() => setActiveSessionId(session.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-all flex gap-3
                                            ${activeSessionId === session.id
                                                ? 'bg-indigo-600/10 border border-indigo-500/30'
                                                : 'hover:bg-slate-800/50 border border-transparent'
                                            }`}
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                                                <User className="w-5 h-5 text-slate-400" />
                                            </div>
                                            {session.unread_count > 0 && (
                                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-[#0f172a]"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="text-sm font-bold text-slate-200 truncate pr-2">{session.client_name}</h4>
                                                <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
                                                    {format(new Date(session.last_message_at), "HH:mm")}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate ${session.unread_count > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                                                {session.last_message}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* WIDGET MAIN CHAT AREA */}
                    <div className={`${!activeSessionId && !isMaximized ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#020617]`}>
                        {activeSessionId && activeSession ? (
                            <>
                                {/* Chat Header */}
                                <div className="h-16 border-b border-slate-800/60 flex items-center gap-3 px-4 bg-slate-900/30 shrink-0">
                                    <button 
                                        onClick={() => setActiveSessionId(null)} 
                                        className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/50"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-100">{activeSession.client_name}</h3>
                                        {activeSession.active_order_number && (
                                            <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-black">
                                                Pedido #{activeSession.active_order_number}
                                            </p>
                                        )}
                                    </div>
                                    {/* Mobile Minimize */}
                                    <div className="ml-auto md:hidden">
                                        <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-rose-400">
                                            <Minimize2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[#0b1120]">
                                    {loadingMessages ? (
                                        <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
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
                                                            <div className="flex justify-center my-4">
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                                                                    {format(new Date(msg.created_at), "dd 'de' MMM", { locale: ptBR })}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`flex ${isStore ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-sm
                                                                ${isStore
                                                                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-900/20'
                                                                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                                                                }`}
                                                            >
                                                                {isMedia ? (
                                                                    <div className="rounded-xl overflow-hidden mb-1 border border-white/10">
                                                                        <img src={mediaUrl} alt="Anexo" className="max-w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(mediaUrl, '_blank')} />
                                                                    </div>
                                                                ) : (
                                                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                                                )}
                                                                <p className="text-[9px] font-bold mt-1 text-right opacity-60">
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

                                {/* Input */}
                                <div className="p-3 bg-slate-900/50 border-t border-slate-800/60 shrink-0">
                                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
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
                                            className="w-12 h-12 shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl flex items-center justify-center transition-colors border border-slate-700"
                                            title="Anexar Arquivo"
                                        >
                                            {uploadingMedia ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                        </button>

                                        <input
                                            type="text"
                                            placeholder="Digite uma mensagem..."
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            className="flex-1 bg-[#020617] border border-slate-700 rounded-xl py-3 pl-4 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm shadow-inner"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || isSending || uploadingMedia}
                                            className="w-12 h-12 shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-600/20"
                                        >
                                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#0b1120]">
                                <MessageSquare className="w-12 h-12 opacity-10 mb-4" />
                                <h3 className="text-sm font-bold text-slate-400">Nenhum chat selecionado</h3>
                                <p className="text-xs mt-1">Selecione uma conversa para atender.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
