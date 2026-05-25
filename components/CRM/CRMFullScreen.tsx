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
    const [activeTab, setActiveTab] = useState<'workspace' | 'chat'>('workspace');
    
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

    // Dummy High-Fidelity HubSpot Leads to merge with DB leads for absolute aesthetic wow-factor!
    const mockLeads = [
        {
            id: 'mock-1',
            client_name: 'Jane Doe',
            subtitle: 'Marketing director at Microsoft',
            source: 'Linkedin',
            rating: 5,
            temp: 'quente',
            tag: 'Orçamento',
            unread_count: 2,
            initials: 'JD',
            avatarBg: 'bg-gradient-to-tr from-rose-500 to-orange-500',
            imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
        },
        {
            id: 'mock-2',
            client_name: 'Darlene Robertson',
            subtitle: 'Financial manager at Ford',
            source: 'Facebook',
            rating: 4,
            temp: 'quente',
            tag: 'Atendimento',
            unread_count: 0,
            initials: 'DR',
            avatarBg: 'bg-gradient-to-tr from-purple-500 to-indigo-500',
            imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        },
        {
            id: 'mock-3',
            client_name: 'Wade Warren',
            subtitle: 'Operations manager at Spotify',
            source: 'Spotify',
            rating: 3,
            temp: 'morno',
            tag: 'Arte',
            unread_count: 0,
            initials: 'WW',
            avatarBg: 'bg-gradient-to-tr from-blue-500 to-emerald-500',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        },
        {
            id: 'mock-4',
            client_name: 'Janah Jude',
            subtitle: 'Web developer at Vercel',
            source: 'System',
            rating: 5,
            temp: 'quente',
            tag: 'Orçamento',
            unread_count: 0,
            initials: 'JJ',
            avatarBg: 'bg-gradient-to-tr from-amber-500 to-rose-500',
            imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
        }
    ];

    // Dummy High-Fidelity Tasks
    const mockTasks = [
        {
            id: 'task-1',
            title: 'Google Meet Call',
            description: 'Alinhamento de Estampas da Arte',
            clientName: 'Peter Thomas',
            clientRole: 'CEO at FashionHub',
            date: '18.03.2023',
            time: '2:00 pm',
            active: true,
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
        },
        {
            id: 'task-2',
            title: 'Send Proposal',
            description: 'Envio de orçamento de 500 camisetas prime',
            clientName: 'Alisha Hyacinth',
            clientRole: 'COO at TechCorp',
            date: '20.05.2026',
            time: '3:30 pm',
            active: false,
            amount: 'R$ 20.000',
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
        },
        {
            id: 'task-3',
            title: 'Google Meet Call',
            description: 'Apresentação de layouts de estamparia',
            clientName: 'Avery Nianis',
            clientRole: 'COO at SportsCenter',
            date: '21.05.2026',
            time: '4:00 pm',
            active: false,
            completed: false,
            imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        }
    ];

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

    // Merge real database sessions as Leads alongside beautiful high-fidelity Behance mocks
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
        })),
        ...mockLeads.map(m => ({ ...m, isReal: false }))
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
                
                {/* Visual Tab Selector - HubSpot Style */}
                <div className="flex bg-[#0f172a] border border-[#1e293b] p-1.5 rounded-2xl gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-500 ${
                            activeTab === 'workspace'
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                        }`}
                    >
                        <Layout className="w-4 h-4" />
                        💼 Workspace (CRM)
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-500 ${
                            activeTab === 'chat'
                                ? 'bg-gradient-to-r from-[#FF7A59] to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        💬 Central de Mensagens
                        {sessions.some(s => s.unread_count > 0) && (
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping ml-0.5"></span>
                        )}
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
                
                {/* 💼 TAB 1: WORKSPACE DESIGN (HUBSPOT BEHANCE PIXEL PERFECT REDESIGN) */}
                {activeTab === 'workspace' && (
                    <div className="h-full flex overflow-hidden">
                        
                        {/* LEFT SLIM VERTICAL NAVIGATION TOOLBAR */}
                        <div className="w-16 bg-[#0b1221] border-r border-[#1e293b] flex flex-col items-center py-6 justify-between shrink-0 hidden md:flex">
                            {/* HubSpot sprocket logo */}
                            <div className="flex items-center justify-center w-10 h-10 bg-[#0f172a] border border-[#1e293b] rounded-full text-[#FF7A59] shadow-md shadow-[#FF7A59]/10 group hover:scale-105 transition-transform duration-300 cursor-pointer" title="HubSpot Sprocket">
                                <svg viewBox="0 0 100 100" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50" cy="50" r="14" />
                                    <line x1="50" y1="50" x2="50" y2="18" stroke="currentColor" strokeWidth="8" />
                                    <circle cx="50" cy="18" r="10" />
                                    <line x1="50" y1="50" x2="78" y2="66" stroke="currentColor" strokeWidth="8" />
                                    <circle cx="78" cy="66" r="10" />
                                    <line x1="50" y1="50" x2="22" y2="66" stroke="currentColor" strokeWidth="8" />
                                    <circle cx="22" cy="66" r="10" />
                                </svg>
                            </div>
                            
                            {/* Circular Buttons */}
                            <div className="flex flex-col gap-5">
                                {/* Workspace Button */}
                                <button className="w-10 h-10 rounded-full bg-[#0f172a] hover:bg-slate-800 text-[#8B5CF6] border border-[#1e293b] flex items-center justify-center transition-all duration-300 shadow-md" title="Workspace (CRM)">
                                    <Layout className="w-4 h-4" />
                                </button>
                                {/* Funnel Button */}
                                <button className="w-10 h-10 rounded-full bg-[#1C1C26] hover:bg-[#0f172a] text-slate-400 hover:text-white border border-slate-900 flex items-center justify-center transition-all duration-300" title="Funil de Leads">
                                    <Filter className="w-4 h-4" />
                                </button>
                                {/* Chat Button */}
                                <button onClick={() => setActiveTab('chat')} className="w-10 h-10 rounded-full bg-[#1C1C26] hover:bg-[#0f172a] text-slate-400 hover:text-white border border-slate-900 flex items-center justify-center transition-all duration-300" title="Central de Mensagens">
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                {/* Calendar Button */}
                                <button className="w-10 h-10 rounded-full bg-[#1C1C26] hover:bg-[#0f172a] text-slate-400 hover:text-white border border-slate-900 flex items-center justify-center transition-all duration-300" title="Agenda / Cronograma">
                                    <Calendar className="w-4 h-4" />
                                </button>
                                {/* Target Button */}
                                <button className="w-10 h-10 rounded-full bg-[#1C1C26] hover:bg-[#0f172a] text-slate-400 hover:text-white border border-slate-900 flex items-center justify-center transition-all duration-300" title="Metas e Objetivos">
                                    <Target className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Operator profile/settings icon */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF7A59] to-orange-600 border border-orange-500/20 shadow-lg shadow-orange-500/10 flex items-center justify-center text-[10px] font-black text-white hover:scale-105 transition-transform duration-300 cursor-pointer" title="Minha Conta">
                                ADM
                            </div>
                        </div>

                        {/* LEFT AND MAIN SCROLL CONTAINER */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
                            
                            {/* A. PREMIUM HORIZONTAL SCHEDULE TRACKER ("Your Schedule") */}
                            <div className="max-w-6xl mx-auto">
                                <div className="bg-white/95 border border-white/20 rounded-full p-2.5 flex items-center justify-between shadow-2xl overflow-x-auto gap-4 scrollbar-none text-slate-800">
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="bg-[#1C1C26] text-white border border-slate-900 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                                            Seu Cronograma
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-4 py-2.5 rounded-full text-xs font-black text-slate-700 uppercase tracking-widest shrink-0">
                                            <Calendar className="w-4 h-4 text-[#FF7A59]" />
                                            20 de Maio
                                        </div>
                                    </div>
                                    
                                    {/* Timeline Horizontal blocks matching Behance */}
                                    <div className="flex items-center gap-3 flex-1 justify-center shrink-0">
                                        {/* Block 1: Finished meeting */}
                                        <div className="h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center px-4 gap-2.5 text-xs font-bold text-slate-500 shadow-sm">
                                            <span className="text-slate-400 font-extrabold">12:30 pm</span>
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                            <span className="text-slate-700 font-black">Layout Camisetas</span>
                                            <Check className="w-3.5 h-3.5 text-emerald-500 font-black" />
                                        </div>
                                        
                                        {/* Connector Arrow */}
                                        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

                                        {/* Active green timeline block (Lime-Green) */}
                                        <div className="h-10 bg-[#8B5CF6] text-white rounded-full flex items-center px-5 gap-3 text-xs font-black shadow-lg shadow-[#8B5CF6]/20 border border-[#7C3AED]">
                                            <span>2:00 pm</span>
                                            <div className="w-1.5 h-1.5 bg-[#1C1C26]/20 rounded-full"></div>
                                            <div className="flex -space-x-1.5">
                                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" alt="Peter Thomas" className="w-6 h-6 rounded-full border-2 border-[#8B5CF6] object-cover" />
                                                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80" alt="Jane Doe" className="w-6 h-6 rounded-full border-2 border-[#8B5CF6] object-cover" />
                                            </div>
                                            <span className="bg-[#1C1C26]/10 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">Meet Ativo</span>
                                        </div>

                                        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

                                        {/* Block 3: Upcoming meeting */}
                                        <div className="h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center px-4 gap-2.5 text-xs font-bold text-slate-500 shadow-sm">
                                            <span className="text-slate-400 font-extrabold">3:00 pm</span>
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                            <div className="flex -space-x-1">
                                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80" alt="Darlene Robertson" className="w-6 h-6 rounded-full border border-white object-cover" />
                                            </div>
                                            <span className="text-slate-700 font-black">Orçamento</span>
                                        </div>
                                    </div>

                                    {/* Notifications bell & Action in Timeline */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button className="w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-950 transition-colors duration-300">
                                            <Bell className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF7A59] to-orange-600 border border-orange-500/20 shadow-lg shadow-orange-500/20 flex items-center justify-center text-[10px] font-black text-white">
                                            ADM
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* B. HEADER WORKSPACE AND METRICS COUNTERS */}
                            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                                
                                {/* Target O Workspace logo */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-wider flex items-center gap-0.5 uppercase">
                                            W
                                            <span className="inline-flex items-center justify-center relative w-9 h-9 bg-[#1C1C26] border-[5px] border-[#1e293b] rounded-full shadow-inner mx-1">
                                                <span className="w-3 h-3 bg-[#8B5CF6] rounded-full animate-pulse shadow-[0_0_12px_#8B5CF6]"></span>
                                                <span className="absolute inset-0 border border-[#8B5CF6]/30 rounded-full animate-ping"></span>
                                            </span>
                                            RKSPACE
                                        </h2>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setActiveSessionId(null);
                                            setActiveTab('chat');
                                            notify.success('Crie novas conversas na aba de atendimento.');
                                        }}
                                        className="bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1e293b] hover:border-slate-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg"
                                    >
                                        <Plus className="w-4 h-4 text-[#8B5CF6]" />
                                        Nova Tarefa
                                    </button>
                                </div>

                                {/* Glowing Metrics Counters */}
                                <div className="flex items-center gap-4 md:gap-8 flex-wrap">
                                    {/* Deals Counter */}
                                    <div className="bg-[#0b1221]/40 border border-[#1e293b] rounded-2xl p-3 px-6 flex items-center gap-3.5 shadow-xl hover:border-[#8B5CF6]/30 transition-colors duration-350">
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                                                34
                                                <span className="text-[9px] font-black text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-1.5 py-0.5 rounded">
                                                    +2
                                                </span>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                                <Briefcase className="w-3 h-3 text-[#8B5CF6]" /> Negócios
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Won Counter */}
                                    <div className="bg-[#0b1221]/40 border border-[#1e293b] rounded-2xl p-3 px-6 flex items-center gap-3.5 shadow-xl hover:border-emerald-500/30 transition-colors duration-350">
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                                                20
                                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                                    +1
                                                </span>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ganhos
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lost Counter */}
                                    <div className="bg-[#0b1221]/40 border border-[#1e293b] rounded-2xl p-3 px-6 flex items-center gap-3.5 shadow-xl hover:border-rose-500/30 transition-colors duration-350">
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                                                3
                                                <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                                                    -1
                                                </span>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                                <X className="w-3 h-3 text-rose-500" /> Perdidos
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* C. TWO QUADROS GRID: NEW LEADS & DAYS TASKS */}
                            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
                                
                                {/* QUADRO 1: NEW LEADS */}
                                <div className="space-y-5 bg-[#0b1221] border border-[#1e293b] p-5 md:p-6 rounded-2xl shadow-xl">
                                    {/* Leads Header Row */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-black text-white uppercase tracking-wider">Novos Leads</h3>
                                            <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                                                {displayLeadsList.length} Leads
                                            </span>
                                        </div>

                                        {/* Search & Sort inside Leads */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar leads..."
                                                    value={workspaceSearch}
                                                    onChange={e => setWorkspaceSearch(e.target.value)}
                                                    className="bg-[#0b1221] border border-[#1e293b] text-slate-300 text-xs rounded-xl pl-8 pr-3 py-1.5 w-40 focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pílulas de filtro de Leads */}
                                    <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                        {[
                                            { key: 'all', label: 'Todos' },
                                            { key: 'hot', label: '🔥 Hot Client' },
                                            { key: 'great', label: 'Alto Interesse' },
                                            { key: 'medium', label: 'Médio Interesse' },
                                            { key: 'low', label: 'Baixo Interesse' }
                                        ].map(pil => (
                                            <button
                                                key={pil.key}
                                                onClick={() => setLeadFilter(pil.key as any)}
                                                className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                                                    leadFilter === pil.key
                                                        ? 'bg-[#8B5CF6] text-white font-black shadow-md'
                                                        : 'bg-[#0f172a]/60 text-slate-400 hover:text-slate-200 border border-[#1e293b] hover:border-slate-700'
                                                }`}
                                            >
                                                {pil.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Cards Grid with Asymmetrical Corner Styling */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-850">
                                        {displayLeadsList.length === 0 ? (
                                            <div className="col-span-2 text-center py-16 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                                Nenhum lead encontrado com estes filtros
                                            </div>
                                        ) : (
                                            displayLeadsList.map(lead => (
                                                <div
                                                    key={lead.id}
                                                    className="group bg-[#0f172a] border border-[#1e293b] p-5 rounded-xl hover:border-indigo-500/40 hover:bg-[#0f172a] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 flex flex-col justify-between relative overflow-hidden"
                                                >
                                                    {/* Glowing Background Glow on Hover */}
                                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-600/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                                    {/* Top row */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        {/* Avatar using high-quality unsplash link if available */}
                                                        <div className="relative">
                                                            {lead.imageUrl ? (
                                                                <img src={lead.imageUrl} alt={lead.client_name} className="w-11 h-11 rounded-full object-cover border border-slate-700 group-hover:scale-105 transition-transform duration-300" />
                                                            ) : (
                                                                <div className={`w-11 h-11 rounded-full ${lead.avatarBg || 'bg-slate-800'} flex items-center justify-center text-xs font-black text-white border border-slate-700 group-hover:scale-105 transition-transform duration-300`}>
                                                                    {lead.initials}
                                                                </div>
                                                            )}
                                                            {/* Source badge dot (WhatsApp style green status indicator) */}
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#0b1221] rounded-full flex items-center justify-center border border-[#1e293b] shadow-md">
                                                                <span className="text-[7.5px] text-[#8B5CF6] font-black">W</span>
                                                            </div>
                                                        </div>

                                                        {/* Edit Pencil and Quick Chat action */}
                                                        <div className="flex items-center gap-1.5 relative z-10">
                                                            {lead.isReal ? (
                                                                <button
                                                                    onClick={() => handleOpenWhatsAppChat(lead.id)}
                                                                    className="p-2 text-slate-500 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-xl transition-all duration-300 shadow-sm"
                                                                    title="Abrir no WhatsApp"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        notify.success('Lead simulado da HubSpot. Iniciando chat demonstrativo!');
                                                                        setActiveTab('chat');
                                                                    }}
                                                                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-300"
                                                                    title="Lead de Demonstração"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button className="p-2 text-slate-500 hover:text-white rounded-xl transition-all hover:bg-slate-800/40">
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Middle content */}
                                                    <div className="space-y-1 mb-4 flex-1">
                                                        <h4 className="font-extrabold text-white text-[15px] group-hover:text-indigo-300 transition-colors duration-300 truncate">
                                                            {lead.client_name}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 font-semibold leading-snug line-clamp-2">
                                                            {lead.subtitle}
                                                        </p>
                                                    </div>

                                                    {/* Bottom Row */}
                                                    <div className="border-t border-[#1e293b] pt-3.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[9px] uppercase tracking-widest text-slate-500">Origem:</span>
                                                            <span className="text-[#8B5CF6] bg-[#0f172a] px-2 py-0.5 rounded-md font-extrabold border border-[#1e293b]">
                                                                {lead.source}
                                                            </span>
                                                        </div>

                                                        {/* Heat Dots Rating from Behance */}
                                                        <div className="flex gap-1" title={`Classificação de Temperatura: ${lead.temp.toUpperCase()}`}>
                                                            {[...Array(5)].map((_, i) => {
                                                                const filled = i < lead.rating;
                                                                return (
                                                                    <span
                                                                        key={i}
                                                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                                                            filled
                                                                                ? lead.temp === 'quente'
                                                                                    ? 'bg-rose-500 shadow-md shadow-rose-500/40'
                                                                                    : 'bg-amber-400 shadow-md shadow-amber-400/40'
                                                                                : 'bg-slate-800'
                                                                        }`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* QUADRO 2: TAREFAS DO DIA (YOUR DAYS TASKS) */}
                                <div className="space-y-5 bg-[#0b1221] border border-[#1e293b] p-5 md:p-6 rounded-2xl shadow-xl">
                                    {/* Tasks Header Row */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-black text-white uppercase tracking-wider">Tarefas do Dia</h3>
                                            <span className="text-[10px] font-black bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 px-2 py-0.5 rounded-full uppercase">
                                                {mockTasks.length} Ativas
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-slate-500 hover:text-white rounded-xl transition-all">
                                                <Filter className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pílulas de filtro de Tarefas */}
                                    <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                        {[
                                            { key: 'all', label: 'Todas' },
                                            { key: 'hot', label: '🔥 Urgentes' },
                                            { key: 'due', label: 'Hoje' },
                                            { key: 'overdue', label: 'Atrasadas' },
                                            { key: 'completed', label: 'Concluídas' }
                                        ].map(pil => (
                                            <button
                                                key={pil.key}
                                                onClick={() => setTaskFilter(pil.key as any)}
                                                className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                                                    taskFilter === pil.key
                                                        ? 'bg-[#8B5CF6] text-white font-black shadow-md shadow-[#8B5CF6]/10'
                                                        : 'bg-[#0f172a]/60 text-slate-400 hover:text-slate-200 border border-[#1e293b] hover:border-slate-700'
                                                }`}
                                            >
                                                {pil.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Task List with custom symmetrical corner shape */}
                                    <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-850">
                                        {mockTasks.map(task => {
                                            const isLime = task.active;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`p-5 rounded-xl transition-all duration-500 hover:scale-[1.01] flex flex-col justify-between relative overflow-hidden ${
                                                        isLime
                                                            ? 'bg-[#8B5CF6] text-white shadow-xl shadow-[#8B5CF6]/15 border-none'
                                                            : 'bg-[#0f172a] border border-[#1e293b] text-slate-200 hover:bg-[#0f172a] hover:border-slate-700/80'
                                                    }`}
                                                >
                                                    {/* Top row */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2.5">
                                                            {/* User avatar circle from Unsplash if available */}
                                                            {task.imageUrl ? (
                                                                <img src={task.imageUrl} alt={task.clientName} className={`w-9 h-9 rounded-full object-cover border ${
                                                                    isLime ? 'border-slate-950/20' : 'border-slate-700'
                                                                }`} />
                                                            ) : (
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black border ${
                                                                    isLime
                                                                        ? 'bg-[#1C1C26] text-[#8B5CF6] border-slate-950/20'
                                                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                                                }`}>
                                                                    {task.clientName.split(' ').map(w => w[0]).join('')}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h5 className={`text-[11px] font-black uppercase tracking-wider ${isLime ? 'text-slate-955 font-black' : 'text-slate-200'}`}>
                                                                    {task.clientName}
                                                                </h5>
                                                                <p className={`text-[9.5px] font-semibold ${isLime ? 'text-slate-700' : 'text-slate-400'}`}>
                                                                    {task.clientRole}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 relative z-10">
                                                            <button className={`p-1.5 rounded-lg transition-all ${isLime ? 'hover:bg-[#1C1C26]/10' : 'hover:bg-slate-850'}`}>
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Middle content */}
                                                    <div className="space-y-1.5 mb-5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                isLime ? 'bg-[#1C1C26]/15 text-slate-900 border border-slate-950/10' : 'bg-[#0f172a] text-[#8B5CF6] border border-[#1e293b]'
                                                            }`}>
                                                                {task.title}
                                                            </span>
                                                            {task.amount && (
                                                                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                                    {task.amount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className={`font-black text-[15.5px] leading-tight ${isLime ? 'text-slate-950' : 'text-white'}`}>
                                                            {task.description}
                                                        </h4>
                                                    </div>

                                                    {/* Bottom Row */}
                                                    <div className={`border-t pt-3.5 flex items-center justify-between ${
                                                        isLime ? 'border-slate-950/10' : 'border-[#1e293b]'
                                                    }`}>
                                                        {/* Date & Google Meet Call Info */}
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-black flex items-center gap-1 ${
                                                                isLime ? 'text-slate-850' : 'text-slate-400'
                                                            }`}>
                                                                <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                                Google Meet Call
                                                            </span>
                                                            <span className={`text-[9px] font-bold ${isLime ? 'text-slate-800' : 'text-slate-500'}`}>
                                                                {task.date} @ {task.time}
                                                            </span>
                                                        </div>

                                                        {/* Action Buttons inside Card */}
                                                        <div className="flex items-center gap-1 relative z-10">
                                                            {isLime && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setCallConnected(true);
                                                                        notify.success('Simulando chamada de vídeo ativa na barra lateral direita!');
                                                                    }}
                                                                    className="w-7 h-7 bg-[#1C1C26] hover:bg-[#0f172a] text-[#8B5CF6] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105"
                                                                    title="Iniciar Google Meet"
                                                                >
                                                                    <Video className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT-HAND SIDEBAR: DYNAMIC CALL SIMULATOR & CLIENT SUMMARY (BEHANCE SPEC) */}
                        <div className="w-[320px] lg:w-[350px] bg-[#0b1221]/90 border-l border-[#1e293b] flex flex-col shrink-0 z-10 p-5 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-850">
                            
                            {/* A. GOOGLE MEET CALL SIMULATOR WIDGET (Smiling grey-haired man) */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-ping"></span>
                                    Atendimento Online
                                </span>
                                
                                <div className="bg-[#121824]/90 border border-[#1e293b] rounded-3xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between group h-64">
                                    {/* Video Stream Simulated Photo - Smiling grey-haired corporate executive headshot */}
                                    <div className="absolute inset-0 bg-cover bg-center filter brightness-[0.7] group-hover:brightness-[0.75] transition-all duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400')" }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 z-0"></div>

                                    {/* Top Call Info */}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="bg-[#1C1C26]/50 px-3 py-1 rounded-xl flex items-center gap-2 border border-[#1e293b]/30 text-[9px] font-black uppercase text-white tracking-widest">
                                            <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-ping"></div>
                                            Google Meet
                                        </div>
                                        
                                        <button className="w-8 h-8 bg-[#1C1C26]/50 rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-[#1e293b]/30 transition-all">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Bottom Call Action buttons matching Behance */}
                                    <div className="relative z-10 flex flex-col gap-3">
                                        <div>
                                            <h4 className="font-extrabold text-white text-sm">Peter Thomas</h4>
                                            <p className="text-[10px] text-slate-300 font-medium">CEO da TechCorp (Uniformes Executivos)</p>
                                        </div>

                                        <div className="flex items-center justify-center gap-3.5 bg-[#1C1C26]/40 py-2.5 px-4 rounded-full border border-[#1e293b] max-w-max mx-auto shadow-lg">
                                            {/* Mic button */}
                                            <button 
                                                onClick={() => setMicMuted(!micMuted)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    micMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}
                                            >
                                                {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                            </button>

                                            {/* Video Toggle */}
                                            <button 
                                                onClick={() => setVideoOff(!videoOff)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    videoOff ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}
                                            >
                                                {videoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                                            </button>

                                            {/* End call red button */}
                                            <button 
                                                onClick={() => {
                                                    setCallConnected(false);
                                                    notify.error('Chamada encerrada.');
                                                }}
                                                className="w-8 h-8 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all"
                                                title="Encerrar Call"
                                            >
                                                <Phone className="w-3.5 h-3.5 rotate-[135deg]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* B. CLIENT SUMMARY WIDGET (BEHANCE SHARP WHITE CUSTOM CARD) */}
                            <div className="space-y-3 flex-1 flex flex-col justify-end">
                                <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-2xl flex flex-col gap-5 border border-slate-200">
                                    {/* Summary Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
                                            <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">Sumário do Lead</h4>
                                        </div>
                                        <button className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all" title="Editar Informações">
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Documents Attachments Row */}
                                    <div className="space-y-2.5">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Faturas e Documentos</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Doc 1 */}
                                            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:border-indigo-500/40 hover:bg-indigo-50/20 transition-all cursor-pointer group flex flex-col gap-1.5" onClick={() => notify.success('Baixando Fatura Orçamento_#3382.pdf...')}>
                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-900 truncate">Orçamento_#3382.pdf</p>
                                                    <p className="text-[8px] font-bold text-slate-400">PDF - 1.2 MB</p>
                                                </div>
                                            </div>

                                            {/* Doc 2 */}
                                            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:border-indigo-500/40 hover:bg-indigo-50/20 transition-all cursor-pointer group flex flex-col gap-1.5" onClick={() => notify.success('Baixando Layout_Uniforme.png...')}>
                                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-900 truncate">Layout_Uniforme.png</p>
                                                    <p className="text-[8px] font-bold text-slate-400">PNG - 4.5 MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Goal Card Checklist */}
                                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metas de Produção</span>
                                        <div>
                                            <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                                <Target className="w-3.5 h-3.5 text-indigo-600" />
                                                Alinhamento de Layout
                                            </h5>
                                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                                                Aprovar arte final e grade de tamanhos (PP ao XG) até sexta-feira com Peter Thomas.
                                            </p>
                                        </div>

                                        {/* Dynamic interactive checkbox for fun */}
                                        <div className="border-t border-slate-200/60 pt-2.5 mt-1 flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id="sum-goal-chk" 
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white cursor-pointer"
                                                defaultChecked={false}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        notify.success('Meta marcada como alcançada! Bom trabalho.');
                                                    }
                                                }}
                                            />
                                            <label htmlFor="sum-goal-chk" className="text-[9px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none">
                                                Grade e Arte Aprovadas
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* 💬 TAB 2: CENTRAL DE MENSAGENS (ORIGINAL HIGH-END CHAT INTERFACE WITH FULL INTEGRATIONS) */}
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
                                                            session.tag === 'Atendimento' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' :
                                                            session.tag === 'Arte' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/10' :
                                                            session.tag === 'Orçamento' ? 'bg-[#FF7A59]/20 text-[#FF7A59] border border-[#FF7A59]/10' :
                                                            session.tag === 'Dúvidas' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' :
                                                            'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            {session.tag}
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
                                                        activeSession.tag === 'Atendimento' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' :
                                                        activeSession.tag === 'Arte' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/10' :
                                                        activeSession.tag === 'Orçamento' ? 'bg-[#FF7A59]/20 text-[#FF7A59] border border-[#FF7A59]/10' :
                                                        activeSession.tag === 'Dúvidas' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' :
                                                        'bg-slate-800 text-slate-400'
                                                    }`}>
                                                        {activeSession.tag}
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
                                                value={activeSession.tag || 'Novo'}
                                                disabled={isUpdatingTag}
                                                onChange={(e) => handleUpdateTag(e.target.value)}
                                                className="w-full bg-[#111625] border border-[#1e293b] text-slate-300 text-xs font-bold uppercase tracking-wider py-2.5 px-3.5 rounded-xl focus:outline-none focus:border-[#FF7A59] cursor-pointer appearance-none font-semibold"
                                            >
                                                <option value="Novo">Novo</option>
                                                <option value="Atendimento">Atendimento</option>
                                                <option value="Arte">Arte</option>
                                                <option value="Orçamento">Orçamento</option>
                                                <option value="Dúvidas">Dúvidas</option>
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
