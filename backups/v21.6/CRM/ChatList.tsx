import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Search } from 'lucide-react';
import { Client } from '../../types';

interface Chat {
    id: string;
    client_id: string;
    whatsapp_id: string;
    unread_count: number;
    last_message: string;
    last_message_at: string;
    clients?: { name: string; avatar_url?: string };
}

interface ChatListProps {
    onSelectChat: (chat: Chat) => void;
    selectedChatId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchChats();

        // Realtime Subscription for Chat List
        const subscription = supabase
            .channel('chats_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
                fetchChats();
            })
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, []);

    const fetchChats = async () => {
        const { data } = await supabase
            .from('chats')
            .select('*, clients(name)')
            .order('last_message_at', { ascending: false });

        if (data) setChats(data);
    };

    const filteredChats = chats.filter(c =>
        (c.clients?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        c.whatsapp_id.includes(searchTerm)
    );

    return (
        <div className="flex flex-col h-full border-r border-slate-800 bg-slate-950/50 w-80">
            <div className="p-4 border-b border-slate-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar conversa..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredChats.map(chat => (
                    <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat)}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-slate-900/50 ${selectedChatId === chat.id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                    >
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-slate-200 text-sm truncate max-w-[140px]">
                                {chat.clients?.name || chat.whatsapp_id}
                            </span>
                            <span className="text-[10px] text-slate-600">
                                {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500 truncate max-w-[180px] font-medium">
                                {chat.last_message || 'Nova conversa iniciada'}
                            </p>
                            {chat.unread_count > 0 && (
                                <span className="bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {chat.unread_count}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {filteredChats.length === 0 && (
                    <div className="p-8 text-center text-slate-600 text-xs">
                        Nenhuma conversa encontrada.
                    </div>
                )}
            </div>
        </div>
    );
};
