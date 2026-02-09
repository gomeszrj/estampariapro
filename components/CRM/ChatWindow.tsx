import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Send, Paperclip, MoreVertical, Smile } from 'lucide-react';
import { evolutionService } from '../../services/evolutionService';

interface Message {
    id: string;
    content: string;
    sender_type: 'user' | 'contact';
    created_at: string;
    message_type: string;
}

interface ChatWindowProps {
    chatId: string;
    clientName: string;
    whatsappId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, clientName, whatsappId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMessages();
        const subscription = supabase
            .channel(`chat:${chatId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
                scrollToBottom();
            })
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, [chatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setSending(true);

        // 1. Send via Evolution API
        try {
            await evolutionService.sendMessage(whatsappId, newMessage);

            // 2. Persist in Database (Optimistic UI or wait for webhook? Better insert directly to sync UI immediately)
            // Ideally backend receives webhook and inserts, but for UX we insert 'optimistic' or valid message.
            // Since we don't have the webhook set up perfectly yet, let's insert manually to show "Sent".

            const { error } = await supabase.from('messages').insert({
                chat_id: chatId,
                content: newMessage,
                sender_type: 'user',
                message_type: 'text'
            });

            if (error) throw error;

            // Update last message in Chat
            await supabase.from('chats').update({
                last_message: newMessage,
                last_message_at: new Date().toISOString()
            }).eq('id', chatId);

            setNewMessage('');
        } catch (e) {
            console.error("Error sending message:", e);
            alert("Erro ao enviar mensagem via WhatsApp. Verifique a conexão.");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0b1221] relative overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {clientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-slate-100 font-bold text-sm">{clientName}</h4>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{whatsappId}</p>
                    </div>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                    const isUser = msg.sender_type === 'user';
                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${isUser
                                    ? 'bg-indigo-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(79,70,229,0.2)]'
                                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                }`}>
                                {msg.content}
                                <div className={`text-[9px] font-bold mt-1 text-right opacity-60 ${isUser ? 'text-indigo-200' : 'text-slate-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex gap-2 items-end">
                    <button className="p-3 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua mensagem envies..."
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder:text-slate-600 resize-none h-6 max-h-32 py-1 scrollbar-hide"
                            rows={1}
                        />
                        <button className="ml-2 text-slate-600 hover:text-indigo-400">
                            <Smile className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
                        className="p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
