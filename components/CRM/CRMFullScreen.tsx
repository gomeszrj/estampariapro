import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Send, User, Loader2, CheckCircle2, Clock, Paperclip, Search, Menu, Filter, Power,
    ChevronRight, Edit3, Save, Phone, Tag, ShieldAlert, Award, FileText, Check, Copy, Flame, 
    ThermometerSnowflake, Activity, ExternalLink, Plus, Trash2, Zap, Sparkles, Video, Calendar,
    Bell, MoreHorizontal, Mic, MicOff, VideoOff, Layout, ArrowRight, X, Briefcase, File, Target, Info
} from 'lucide-react';
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
    // Core state and view manager
    const [activeTab, setActiveTab] = useState<'workspace' | 'chat'>('chat');
    
    // WhatsApp Sync States
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
    const [chatSubTab, setChatSubTab] = useState<'waiting' | 'answered' | 'all'>('waiting');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // CRM Interactive States
    const [leadTemperature, setLeadTemperature] = useState<'frio' | 'morno' | 'quente' | null>(null);
    const [internalNotes, setInternalNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isUpdatingTag, setIsUpdatingTag] = useState(false);

    // Premium UI Interactive States
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [leadFilter, setLeadFilter] = useState<'all' | 'hot' | 'great' | 'medium' | 'low'>('all');
    const [taskFilter, setTaskFilter] = useState<'all' | 'hot' | 'due' | 'overdue' | 'completed'>('all');
    const [workspaceSearch, setWorkspaceSearch] = useState('');
    
    // Floating Call Widget State
    const [callConnected, setCallConnected] = useState(true);
    const [micMuted, setMicMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    
    const [localTasks, setLocalTasks] = useState<{ id: string; text: string; completed: boolean; createdAt: string }[]>([]);
    const [newTaskText, setNewTaskText] = useState('');

    const quickReplies = [
        { label: '👋 Boas-vindas', text: 'Olá! Seja muito bem-vindo à EstampariaPro. Como posso ajudar com os seus produtos personalizados hoje?' },
        { label: '💰 Orçamento', text: 'Olá! O seu orçamento está sendo elaborado pela nossa equipe e logo te enviaremos todos os valores e opções de tecido!' },
        { label: '🎨 Arte Aprovada', text: 'Ótimo! A sua arte foi aprovada e enviada para o nosso setor de produção. Em breve seu pedido estará pronto!' },
        { label: '🚀 Produção', text: 'Seu pedido já entrou na esteira de produção! Estamos estampando com todo o carinho e qualidade EstampariaPro.' },
        { label: '📦 Pronto', text: 'Excelente notícia! Seu pedido está pronto para ser retirado ou despachado. Aguardamos sua confirmação!' },
    ];

    // Removed mock tasks and mock leads

    // Load and poll sessions
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

    // Load active conversation details & CRM states
    useEffect(() => {
        if (activeSessionId) {
            loadMessages(activeSessionId);
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, unread_count: 0 } : s));

            // Load Lead classification from localStorage
            const savedTemp = localStorage.getItem(`crm_temp_${activeSessionId}`);
            setLeadTemperature(savedTemp as any || null);

            const savedNotes = localStorage.getItem(`crm_notes_${activeSessionId}`) || '';
            setInternalNotes(savedNotes);

            // Load local tasks
            const savedTasks = localStorage.getItem(`crm_tasks_${activeSessionId}`);
            if (savedTasks) {
                try {
                    setLocalTasks(JSON.parse(savedTasks));
                } catch (e) {
                    setLocalTasks([]);
                }
            } else {
                setLocalTasks([]);
            }
        }
    }, [activeSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeSessionId]);

    const loadSessions = async () => {
        try {
            const data = await chatService.getChatSessions();
            setSessions(data);
            if (!activeSessionId && data.length > 0) {
                setActiveSessionId(data[0].id);
            }
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
                notify.success('Arquivo enviado com sucesso!');
            };
        } catch (err) {
            console.error(err);
            notify.error('Erro ao enviar arquivo.');
            setUploadingMedia(false);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // CRM Interactive Actions
    const handleSetLeadTemp = (temp: 'frio' | 'morno' | 'quente') => {
        if (!activeSessionId) return;
        localStorage.setItem(`crm_temp_${activeSessionId}`, temp);
        setLeadTemperature(temp);
        notify.success(`Lead classificado como ${temp.toUpperCase()}`);
    };

    const handleSaveNotes = () => {
        if (!activeSessionId) return;
        setIsSavingNotes(true);
        localStorage.setItem(`crm_notes_${activeSessionId}`, internalNotes);
        setTimeout(() => {
            setIsSavingNotes(false);
            notify.success('Notas salvas com sucesso!');
        }, 400);
    };

    // Operator Task Action Handlers
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim() || !activeSessionId) return;
        const newTask = {
            id: Math.random().toString(36).substring(2, 9),
            text: newTaskText.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        const updatedTasks = [...localTasks, newTask];
        setLocalTasks(updatedTasks);
        localStorage.setItem(`crm_tasks_${activeSessionId}`, JSON.stringify(updatedTasks));
        setNewTaskText('');
        notify.success('Tarefa adicionada!');
    };

    const handleToggleTask = (taskId: string) => {
        if (!activeSessionId) return;
        const updatedTasks = localTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        setLocalTasks(updatedTasks);
        localStorage.setItem(`crm_tasks_${activeSessionId}`, JSON.stringify(updatedTasks));
    };

    const handleDeleteTask = (taskId: string) => {
        if (!activeSessionId) return;
        const updatedTasks = localTasks.filter(t => t.id !== taskId);
        setLocalTasks(updatedTasks);
        localStorage.setItem(`crm_tasks_${activeSessionId}`, JSON.stringify(updatedTasks));
        notify.success('Tarefa excluída');
    };

    const handleUpdateTag = async (newTag: string) => {
        if (!activeSessionId) return;
        setIsUpdatingTag(true);
        try {
            const { error } = await supabase
                .from('chats')
                .update({ tag: newTag })
                .eq('id', activeSessionId);

            if (error) throw error;

            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, tag: newTag } : s));
            notify.success(`Fase do fluxo alterada para: ${newTag}`);
        } catch (err) {
            console.error(err);
            notify.error('Erro ao atualizar tag no servidor');
        } finally {
            setIsUpdatingTag(false);
        }
    };

    const handleOpenWhatsAppChat = (sessionId: string) => {
        setActiveSessionId(sessionId);
        setActiveTab('chat');
        notify.success('Chat de atendimento carregado.');
    };

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.client_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (session.active_order_number && session.active_order_number.includes(searchQuery));
        if (!matchesSearch) return false;
        
        const isClientLast = session.unread_count > 0;
        
        if (chatSubTab === 'waiting') return isClientLast;
        if (chatSubTab === 'answered') return !isClientLast;
        return true;
    });

    // Map real database sessions to display
    const displayLeadsList = [
        ...sessions.map(s => ({
            id: s.id,
            client_name: s.client_name,
            subtitle: s.active_order_number ? `Pedido Ativo #${s.active_order_number}` : 'Interessado em Estamparia',
            source: 'WhatsApp',
            rating: s.unread_count > 0 ? 5 : 3,
            temp: localStorage.getItem(`crm_temp_${s.id}`) || 'morno',
            tag: s.tag || 'Novo',
            unread_count: s.unread_count,
            initials: s.client_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
            avatarBg: s.unread_count > 0 ? 'bg-gradient-to-tr from-emerald-500 to-indigo-500' : 'bg-slate-800',
            isReal: true,
            imageUrl: undefined as string | undefined
        }))
    ].filter(lead => {
        // Search Filter
        if (workspaceSearch && !lead.client_name.toLowerCase().includes(workspaceSearch.toLowerCase())) return false;
        
        // Temperature Filter
        if (leadFilter === 'all') return true;
        if (leadFilter === 'hot') return lead.temp === 'quente';
        if (leadFilter === 'great') return lead.rating >= 4;
        if (leadFilter === 'medium') return lead.temp === 'morno';
        if (leadFilter === 'low') return lead.temp === 'frio';
        return true;
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const getGlowClass = (temp: string | null, isActive: boolean) => {
        if (!temp) return isActive ? 'border-[#FF7A59] shadow-lg shadow-orange-500/10' : 'border-[#1e293b]';
        if (temp === 'frio') return 'border-blue-500/80 ring-2 ring-blue-500/10 shadow-lg shadow-blue-500/10';
        if (temp === 'morno') return 'border-amber-500/80 ring-2 ring-amber-500/10 shadow-lg shadow-amber-500/10';
        if (temp === 'quente') return 'border-rose-500 ring-4 ring-rose-500/20 shadow-xl shadow-rose-500/20 animate-pulse';
        return '';
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] -m-4 md:-m-10 bg-[#0b1221] font-sans text-slate-200 overflow-hidden select-none">
            
            {/* TOP BAR: HUB TAB SELECTOR AND PREMIUM NAVIGATION */}
            <div className="bg-[#0b1221]/90 border-b border-[#1e293b] p-4 px-6 md:px-8 flex flex-col md:flex-row gap-4 items-center justify-between z-20 shrink-0">
                
                {/* Removed Tab Selector */}
                <div className="flex bg-[#0f172a] border border-[#1e293b] p-1.5 rounded-2xl gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-500 bg-gradient-to-r from-[#FF7A59] to-orange-600 text-white shadow-lg shadow-orange-500/30`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        💬 Mega CRM (Atendimento)
                    </button>
                </div>

                {/* Connection Status & Profile */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-3.5 py-2 rounded-xl">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                        Evolution API Ativa
                    </div>
                    
                    <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
                    
                    <button 
                        onClick={onLogout} 
                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-300 border border-[#1e293b] hover:border-rose-500/20"
                        title="Desconectar Operação"
                    >
                        <Power className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* TAB CONTAINER CONTENT */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'chat' && (
                    <div className="h-full flex">
                        
                        {/* COLUMN 1: SESSIONS & SEARCH */}
                        <div className="w-full md:w-[350px] lg:w-[380px] border-r border-[#1e293b] flex flex-col bg-[#0b1221] shrink-0">
                            {/* Header */}
                            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#111625]/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF7A59] to-orange-600 rounded-full flex items-center justify-center border border-orange-500/30 shadow-lg shadow-orange-500/10">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-100 tracking-wider text-sm uppercase">Fila de Mensagens</h2>
                                        <p className="text-[10px] text-emerald-400 font-bold tracking-widest flex items-center gap-1.5 uppercase mt-0.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                            Ativo
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="p-4 bg-[#0b1221]">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente ou pedido..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#111625] border border-[#1e293b] text-slate-200 text-sm rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-[#FF7A59] transition-all duration-300 placeholder:text-slate-500 font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Funnel Tabs */}
                            <div className="flex px-4 pb-3 gap-2">
                                <button
                                    onClick={() => setChatSubTab('waiting')}
                                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                        chatSubTab === 'waiting' 
                                            ? 'bg-gradient-to-r from-[#FF7A59] to-orange-600 text-white shadow-lg shadow-orange-500/10' 
                                            : 'bg-[#111625]/60 text-slate-500 hover:text-slate-300 hover:bg-[#111625] border border-transparent'
                                    }`}
                                >
                                    Aguardando
                                </button>
                                <button
                                    onClick={() => setChatSubTab('answered')}
                                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                        chatSubTab === 'answered' 
                                            ? 'bg-slate-800 text-slate-200 shadow-md border border-slate-700/50' 
                                            : 'bg-[#111625]/60 text-slate-500 hover:text-slate-300 hover:bg-[#111625]'
                                    }`}
                                >
                                    Resp.
                                </button>
                                <button
                                    onClick={() => setChatSubTab('all')}
                                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                        chatSubTab === 'all' 
                                            ? 'bg-slate-800 text-slate-200 shadow-md border border-slate-700/50' 
                                            : 'bg-[#111625]/60 text-slate-500 hover:text-slate-300 hover:bg-[#111625]'
                                    }`}
                                >
                                    Todos
                                </button>
                            </div>

                            {/* Sessions List */}
                            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 scrollbar-thin scrollbar-thumb-slate-800">
                                {loading ? (
                                    <div className="flex items-center justify-center h-48">
                                        <Loader2 className="w-7 h-7 animate-spin text-[#FF7A59]" />
                                    </div>
                                ) : filteredSessions.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Nenhuma conversa neste funil</p>
                                    </div>
                                ) : (
                                    filteredSessions.map(session => {
                                        const initials = getInitials(session.client_name);
                                        const isActive = activeSessionId === session.id;

                                        // Local lead temp color dot fallback
                                        const savedTemp = localStorage.getItem(`crm_temp_${session.id}`);

                                        return (
                                            <div 
                                                key={session.id}
                                                onClick={() => setActiveSessionId(session.id)}
                                                className={`p-4 cursor-pointer transition-all duration-300 flex items-start gap-4 border-l-4 ${
                                                    isActive 
                                                        ? 'bg-[#131926]/90 border-[#FF7A59]' 
                                                        : 'border-transparent hover:bg-[#131926]/30'
                                                }`}
                                            >
                                                {/* Avatar with Glow & presence dot */}
                                                <div className="relative shrink-0">
                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black border transition-all duration-300 ${
                                                        isActive 
                                                            ? 'bg-gradient-to-tr from-[#FF7A59] to-orange-600 text-white' 
                                                            : 'bg-[#111625] text-slate-400'
                                                    } ${getGlowClass(savedTemp as any, isActive)}`}>
                                                        {initials}
                                                    </div>
                                                    {/* Status Dot */}
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0F19] flex items-center justify-center ${
                                                        savedTemp === 'quente' ? 'bg-rose-500' : savedTemp === 'morno' ? 'bg-amber-500' : 'bg-slate-600'
                                                    }`} title={savedTemp ? `Lead ${savedTemp.toUpperCase()}` : 'Lead não classificado'} />
                                                </div>

                                                {/* Summary */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`text-sm font-bold truncate pr-2 ${isActive ? 'text-[#FF7A59]' : 'text-slate-200'}`}>
                                                            {session.client_name}
                                                        </h3>
                                                        <span className="text-[10px] text-slate-500 font-bold shrink-0">
                                                            {format(new Date(session.last_message_at), "HH:mm")}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                            session.tag === 'Novo Contato' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' :
                                                            session.tag === 'Negociando' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' :
                                                            session.tag === 'Arte em Aprovação' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/10' :
                                                            session.tag === 'Aguardando Pagamento' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' :
                                                            session.tag === 'Em Produção' ? 'bg-[#FF7A59]/20 text-[#FF7A59] border border-[#FF7A59]/10' :
                                                            session.tag === 'Finalizado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                                                            'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            {session.tag || 'Novo Contato'}
                                                        </span>
                                                        {session.active_order_number && (
                                                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                                                                #{session.active_order_number}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className={`text-xs truncate ${session.unread_count > 0 ? 'text-slate-200 font-black' : 'text-slate-400'}`}>
                                                        {session.unread_count === 0 && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-slate-600" />}
                                                        {session.last_message.startsWith('[MEDIA]') ? '📷 Imagem' : session.last_message}
                                                    </p>
                                                </div>

                                                {session.unread_count > 0 && (
                                                    <div className="w-5 h-5 rounded-full bg-[#FF7A59] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 mt-1 animate-pulse">
                                                        <span className="text-[10px] font-black text-white">{session.unread_count}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* COLUMN 2: CENTRAL DIALOG AREA */}
                        <div className={`flex-1 flex flex-col bg-[#0A0D16] ${!activeSessionId ? 'hidden md:flex' : 'flex absolute inset-0 z-10 md:static'}`}>
                            {activeSessionId && activeSession ? (
                                <>
                                    {/* Conversation Header */}
                                    <div className="p-4 bg-[#111625] border-b border-[#1e293b] flex items-center justify-between shrink-0 shadow-sm z-10">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setActiveSessionId(null)} className="md:hidden p-2.5 text-slate-400 hover:text-white bg-slate-800/40 rounded-lg">
                                                <Menu className="w-5 h-5" />
                                            </button>
                                            <div className="w-10 h-10 rounded-full bg-[#0b1221] flex items-center justify-center border border-[#1e293b]">
                                                <User className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm md:text-base">
                                                    {activeSession.client_name}
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                        activeSession.tag === 'Novo Contato' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' :
                                                        activeSession.tag === 'Negociando' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' :
                                                        activeSession.tag === 'Arte em Aprovação' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/10' :
                                                        activeSession.tag === 'Aguardando Pagamento' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' :
                                                        activeSession.tag === 'Em Produção' ? 'bg-[#FF7A59]/20 text-[#FF7A59] border border-[#FF7A59]/10' :
                                                        activeSession.tag === 'Finalizado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                                                        'bg-slate-800 text-slate-400'
                                                    }`}>
                                                        {activeSession.tag || 'Novo Contato'}
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-slate-500 font-semibold">{activeSession.whatsapp_id.split('@')[0]}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Active Order Tag */}
                                        {activeSession.active_order_id && (
                                            <div className="bg-[#131926] border border-[#1e293b] rounded-2xl px-4 py-2 flex flex-col items-end">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#FF7A59] flex items-center gap-1">
                                                    <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                                    Pedido Ativo #{activeSession.active_order_number}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-400 mt-0.5">{activeSession.active_order_status}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Stream */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 relative" style={{ backgroundImage: 'radial-gradient(#1e293b 1.2px, transparent 1.2px)', backgroundSize: '24px 24px', backgroundColor: '#070a12' }}>
                                        {loadingMessages ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#FF7A59]" />
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
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#111625] px-4 py-1.5 rounded-full border border-[#1e293b] shadow-md">
                                                                        {format(new Date(msg.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className={`flex ${isStore ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[85%] md:max-w-[65%] rounded-2xl p-3.5 shadow-lg text-[14px] leading-relaxed transition-all duration-300
                                                                    ${isStore
                                                                        ? 'bg-gradient-to-br from-emerald-800/90 to-emerald-950/90 text-emerald-50 rounded-tr-none border border-emerald-700/20'
                                                                        : 'bg-[#131926] text-slate-200 rounded-tl-none border border-[#1e293b]'
                                                                    }`}
                                                                >
                                                                    {isMedia ? (
                                                                        <div className="rounded-xl overflow-hidden mb-1.5 bg-black/40 border border-[#1e293b]">
                                                                            <img src={mediaUrl} alt="Anexo" className="max-w-full max-h-64 object-contain cursor-pointer hover:scale-[1.01] transition-transform duration-300" onClick={() => window.open(mediaUrl, '_blank')} />
                                                                        </div>
                                                                    ) : (
                                                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                                                    )}
                                                                    <div className="flex items-center justify-end gap-1.5 mt-1">
                                                                        <span className={`text-[9px] font-bold ${isStore ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                                                                            {format(new Date(msg.created_at), "HH:mm")}
                                                                        </span>
                                                                        {isStore && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                                                    </div>
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
                                    <div className="p-4 bg-[#111625] border-t border-[#1e293b] shrink-0">
                                        
                                        {/* Quick Replies Panel */}
                                        <div className="max-w-4xl mx-auto mb-3">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-[#FF7A59] hover:text-orange-400 flex items-center gap-1.5 transition-colors duration-300"
                                                >
                                                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                                    {showQuickReplies ? 'Ocultar Respostas Rápidas' : 'Respostas Rápidas'}
                                                </button>
                                            </div>
                                            
                                            {showQuickReplies && (
                                                <div className="flex flex-wrap gap-2 p-3 bg-[#0A0D16] border border-[#1e293b] rounded-2xl animate-in slide-in-from-bottom-2 duration-300 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                                                    {quickReplies.map((qr, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewMessage(prev => prev ? `${prev} ${qr.text}` : qr.text);
                                                                setShowQuickReplies(false);
                                                                notify.success('Template inserido!');
                                                            }}
                                                            className="text-xs font-semibold bg-[#111625] hover:bg-[#1c243c] border border-[#1e293b] hover:border-orange-500/20 px-3 py-1.5 rounded-xl text-slate-300 hover:text-[#FF7A59] transition-all duration-300 flex items-center gap-1"
                                                        >
                                                            {qr.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

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
                                                className="w-12 h-12 shrink-0 text-slate-400 hover:text-[#FF7A59] hover:bg-[#131926] rounded-xl flex items-center justify-center transition-all duration-300 border border-[#1e293b] hover:border-orange-500/20"
                                                title="Anexar Arquivo"
                                            >
                                                {uploadingMedia ? <Loader2 className="w-5 h-5 animate-spin text-[#FF7A59]" /> : <Paperclip className="w-5 h-5" />}
                                            </button>

                                            <input
                                                type="text"
                                                placeholder="Digite uma mensagem para o cliente..."
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                className="flex-1 bg-[#0A0D16] border border-[#1e293b] rounded-xl py-3.5 px-5 text-slate-200 focus:outline-none focus:border-[#FF7A59] transition-all duration-300 text-sm placeholder:text-slate-500 font-semibold"
                                            />
                                            
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || isSending || uploadingMedia}
                                                className="w-12 h-12 shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-emerald-950/20 disabled:pointer-events-none"
                                            >
                                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#0A0D16]">
                                    <div className="w-24 h-24 bg-gradient-to-tr from-[#111625] to-[#131926] rounded-3xl flex items-center justify-center mb-6 border border-[#1e293b] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[#FF7A59]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <MessageSquare className="w-9 h-9 text-slate-600 group-hover:text-[#FF7A59] transition-colors duration-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-200 mb-2 uppercase tracking-widest">Mega CRM Estamparia</h2>
                                    <p className="text-slate-500 text-xs font-semibold max-w-sm leading-relaxed">
                                        Selecione uma conversa ao lado para visualizar os detalhes do lead, notas internas, pedidos ativos e responder ao cliente.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* COLUMN 3: CLASSIC METADATA SIDEBAR */}
                        <div className={`w-full lg:w-[320px] xl:w-[350px] bg-[#0b1221] border-l border-[#1e293b] flex flex-col shrink-0 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 ${
                            !activeSessionId ? 'hidden' : 'hidden lg:flex'
                        }`}>
                            {activeSessionId && activeSession ? (
                                <>
                                    {/* CRM Header */}
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Perfil do CRM</span>
                                        <h3 className="font-extrabold text-slate-200 mt-0.5 text-sm uppercase">Informações do Contato</h3>
                                    </div>

                                    {/* Customer overview block */}
                                    <div className="bg-[#111625]/50 border border-[#1e293b] rounded-2xl p-4 flex flex-col items-center text-center">
                                        <div className={`w-14 h-14 bg-gradient-to-tr from-[#FF7A59] to-orange-600 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-xl shadow-orange-500/10 mb-3 border transition-all duration-300 ${
                                            leadTemperature === 'quente' ? 'border-rose-500 ring-4 ring-rose-500/20 shadow-rose-500/30 animate-pulse' :
                                            leadTemperature === 'morno' ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-amber-500/10' :
                                            leadTemperature === 'frio' ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-blue-500/10' :
                                            'border-orange-400/20'
                                        }`}>
                                            {getInitials(activeSession.client_name)}
                                        </div>
                                        <h4 className="font-bold text-slate-200 text-sm truncate max-w-full">{activeSession.client_name}</h4>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{activeSession.whatsapp_id.split('@')[0]}</p>

                                        <div className="flex items-center gap-1.5 mt-3 text-xs bg-slate-800/40 border border-[#1e293b] px-3 py-1.5 rounded-xl">
                                            <Phone className="w-3.5 h-3.5 text-indigo-400" />
                                            <a 
                                                href={`https://wa.me/${activeSession.whatsapp_id.split('@')[0]}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-slate-400 hover:text-indigo-400 transition-colors font-bold text-[11px]"
                                            >
                                                Abrir WhatsApp
                                            </a>
                                        </div>
                                    </div>

                                    {/* Lead temperature selector (HubSpot Style) */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1 font-extrabold">
                                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                                            Classificação de Lead
                                        </label>
                                        <div className="flex bg-[#111625] border border-[#1e293b] rounded-xl p-1 gap-1">
                                            <button
                                                onClick={() => handleSetLeadTemp('frio')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                                                    leadTemperature === 'frio' 
                                                        ? 'bg-blue-600 text-white shadow-md' 
                                                        : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                Frio
                                            </button>
                                            <button
                                                onClick={() => handleSetLeadTemp('morno')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                                                    leadTemperature === 'morno' 
                                                        ? 'bg-amber-500 text-white shadow-md' 
                                                        : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                Morno
                                            </button>
                                            <button
                                                onClick={() => handleSetLeadTemp('quente')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                                                    leadTemperature === 'quente' 
                                                        ? 'bg-rose-500 text-white shadow-md' 
                                                        : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                Quente
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tag Classifier dropdown connected directly to Supabase */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-extrabold">
                                            <Tag className="w-3.5 h-3.5 text-[#FF7A59]" />
                                            Fase no Fluxo (Tag)
                                        </label>
                                        <div className="relative">
                                            {isUpdatingTag && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF7A59]" />
                                                </div>
                                            )}
                                            <select
                                                value={activeSession.tag || 'Novo Contato'}
                                                disabled={isUpdatingTag}
                                                onChange={(e) => handleUpdateTag(e.target.value)}
                                                className="w-full bg-[#111625] border border-[#1e293b] text-slate-300 text-xs font-bold uppercase tracking-wider py-2.5 px-3.5 rounded-xl focus:outline-none focus:border-[#FF7A59] cursor-pointer appearance-none font-semibold"
                                            >
                                                <option value="Novo Contato">Novo Contato</option>
                                                <option value="Negociando">Negociando</option>
                                                <option value="Arte em Aprovação">Arte em Aprovação</option>
                                                <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                                                <option value="Em Produção">Em Produção</option>
                                                <option value="Finalizado">Finalizado</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Active Order Stepper Tracking Card */}
                                    {activeSession.active_order_id && (
                                        <div className="bg-[#111625]/30 border border-[#1e293b] rounded-2xl p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pedido Ativo</span>
                                                    <h4 className="font-bold text-slate-200 text-xs mt-0.5">#{activeSession.active_order_number}</h4>
                                                </div>
                                                <span className="text-[9px] font-black uppercase bg-[#FF7A59]/10 text-[#FF7A59] border border-[#FF7A59]/20 px-2 py-0.5 rounded-md">
                                                    {activeSession.active_order_status}
                                                </span>
                                            </div>

                                            {/* Dynamic graphic Stepper */}
                                            <div className="space-y-3 pt-1">
                                                {(() => {
                                                    const getOrderStep = (status?: string) => {
                                                        if (!status) return 0;
                                                        const s = status.toLowerCase();
                                                        if (s.includes('budget') || s.includes('orcamento')) return 1;
                                                        if (s.includes('art') || s.includes('arte')) return 2;
                                                        if (s.includes('prod') || s.includes('fabricacao')) return 3;
                                                        if (s.includes('delivery') || s.includes('acabamento') || s.includes('entrega')) return 4;
                                                        if (s.includes('finished') || s.includes('finalizado') || s.includes('entregue')) return 5;
                                                        return 2; // Default fallback step
                                                    };
                                                    
                                                    const currentStep = getOrderStep(activeSession.active_order_status);
                                                    const steps = [
                                                        { label: 'Orçamento', step: 1 },
                                                        { label: 'Arte', step: 2 },
                                                        { label: 'Produção', step: 3 },
                                                        { label: 'Entrega', step: 4 },
                                                        { label: 'Finalizado', step: 5 }
                                                    ];

                                                    return (
                                                        <div className="relative pl-4 border-l border-[#1e293b] space-y-4">
                                                            {steps.map((st) => {
                                                                const isCompleted = currentStep >= st.step;
                                                                const isCurrent = currentStep === st.step;

                                                                return (
                                                                    <div key={st.step} className="relative flex items-center gap-3">
                                                                        {/* Step indicator dot */}
                                                                        <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                                                                            isCurrent 
                                                                                ? 'bg-[#FF7A59] border-orange-400 scale-125 shadow-lg shadow-orange-500/20' 
                                                                                : isCompleted 
                                                                                    ? 'bg-emerald-500 border-emerald-400' 
                                                                                    : 'bg-[#0f172a] border-[#1e293b]'
                                                                        }`} />
                                                                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${
                                                                            isCurrent ? 'text-[#FF7A59]' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                                                                        }`}>
                                                                            {st.label}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Milestone Timeline Card (Dynamic Client-Side) */}
                                    <div className="bg-[#111625]/30 border border-[#1e293b] rounded-2xl p-4 space-y-4">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Marcos do Contato</span>
                                            <h4 className="font-bold text-slate-200 text-xs mt-0.5">Timeline de Evolução</h4>
                                        </div>
                                        
                                        <div className="relative pl-4 border-l border-[#1e293b] space-y-4 pt-1">
                                            {/* Milestone 1: Atendimento Iniciado */}
                                            <div className="relative flex items-start gap-3">
                                                <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full border bg-emerald-500 border-emerald-400" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">Atendimento Iniciado</p>
                                                    <p className="text-[9px] text-slate-500 font-bold mt-0.5">Sessão criada no sistema</p>
                                                </div>
                                            </div>
                                            
                                            {/* Milestone 2: Primeira Mensagem */}
                                            <div className="relative flex items-start gap-3">
                                                <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                                                    messages.length > 0 
                                                        ? 'bg-emerald-500 border-emerald-400' 
                                                        : 'bg-[#111625] border-[#1e293b]'
                                                }`} />
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-wider ${messages.length > 0 ? 'text-slate-300' : 'text-slate-600'}`}>Primeira Mensagem</p>
                                                    <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                                                        {messages.length > 0 ? 'Conversa em andamento' : 'Aguardando envio'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Milestone 3: Classificação */}
                                            <div className="relative flex items-start gap-3">
                                                <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                                                    leadTemperature 
                                                        ? 'bg-emerald-500 border-emerald-400' 
                                                        : 'bg-[#111625] border-[#1e293b]'
                                                }`} />
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-wider ${leadTemperature ? 'text-slate-300' : 'text-slate-600'}`}>Lead Classificado</p>
                                                    <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                                                        {leadTemperature ? `Definido como ${leadTemperature.toUpperCase()}` : 'Sem temperatura definida'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Milestone 4: Notas de Operação */}
                                            <div className="relative flex items-start gap-3">
                                                <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                                                    internalNotes.trim() 
                                                        ? 'bg-emerald-500 border-emerald-400' 
                                                        : 'bg-[#111625] border-[#1e293b]'
                                                }`} />
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-wider ${internalNotes.trim() ? 'text-slate-300' : 'text-slate-600'}`}>Notas Registradas</p>
                                                    <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                                                        {internalNotes.trim() ? 'Detalhes salvos para produção' : 'Sem observações ainda'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operator Tasks Widget (localStorage linked) */}
                                    <div className="bg-[#111625]/40 border border-[#1e293b] rounded-2xl p-4 space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-extrabold">
                                            <Plus className="w-3.5 h-3.5 text-indigo-400" />
                                            Tarefas do Atendente
                                        </label>
                                        
                                        {/* Task Form */}
                                        <form onSubmit={handleAddTask} className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nova tarefa..."
                                                value={newTaskText}
                                                onChange={(e) => setNewTaskText(e.target.value)}
                                                className="flex-1 bg-[#0A0D16] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A59] transition-all duration-300 font-semibold"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newTaskText.trim()}
                                                className="p-2 bg-[#FF7A59] hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all duration-300"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </form>

                                        {/* Task List */}
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {localTasks.length === 0 ? (
                                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider text-center py-2">Sem tarefas pendentes</p>
                                            ) : (
                                                localTasks.map(t => (
                                                    <div key={t.id} className="flex items-center justify-between bg-[#0A0D16]/50 border border-[#1e293b] p-2.5 rounded-xl transition-all duration-300 hover:border-[#1e293b]">
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={t.completed}
                                                                onChange={() => handleToggleTask(t.id)}
                                                                className="w-4 h-4 rounded border-[#1e293b] text-[#FF7A59] focus:ring-[#FF7A59] bg-[#0A0D16] cursor-pointer"
                                                            />
                                                            <span className={`text-xs font-semibold truncate ${
                                                                t.completed ? 'text-slate-600 line-through' : 'text-slate-300'
                                                            }`}>
                                                                {t.text}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTask(t.id)}
                                                            className="text-slate-600 hover:text-rose-500 p-1 rounded-lg transition-colors ml-1"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Internal Operator Notes Widget (localStorage linked) */}
                                    <div className="bg-[#111625]/40 border border-[#1e293b] rounded-2xl p-4 space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-extrabold">
                                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                            Notas de Operação
                                        </label>
                                        <textarea
                                            placeholder="Notas internas sobre este cliente (Ex: Preferências de estampa, prazos, etc)..."
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                            className="w-full bg-[#0A0D16] border border-[#1e293b] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-[#FF7A59] transition-all duration-300 min-h-[90px] resize-none placeholder:text-slate-600 leading-relaxed font-semibold"
                                        />
                                        <button
                                            onClick={handleSaveNotes}
                                            disabled={isSavingNotes}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all duration-300 border border-slate-700/50 hover:border-slate-500/30 flex items-center justify-center gap-1.5"
                                        >
                                            {isSavingNotes ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                            ) : (
                                                <>
                                                    <Save className="w-3.5 h-3.5" />
                                                    Salvar Notas
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 py-12">
                                    <Activity className="w-8 h-8 mb-2 opacity-30 animate-pulse" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Aguardando Seleção</p>
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};
