import { supabase } from './supabase';
import { OrderMessage } from '../types';

export interface ChatSession {
    id: string; // Chat ID
    whatsapp_id: string;
    client_id?: string;
    client_name: string;
    tag?: string; // Novo, Atendimento, Arte, Orçamento, Dúvidas
    status: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    active_order_id?: string;
    active_order_number?: string;
    active_order_status?: string;
}

export const chatService = {
    async getChatSessions(): Promise<ChatSession[]> {
        const { data: chats, error } = await supabase
            .from('chats')
            .select(`
                id,
                whatsapp_id,
                client_id,
                client_name,
                tag,
                status,
                last_message,
                last_message_at,
                unread_count,
                orders!chats_order_id_fkey (
                    id,
                    order_number,
                    status
                )
            `)
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        return (chats || []).map((chat: any) => ({
            id: chat.id,
            whatsapp_id: chat.whatsapp_id,
            client_id: chat.client_id,
            client_name: chat.client_name || 'Cliente Desconhecido',
            tag: chat.tag || 'Novo',
            status: chat.status,
            last_message: chat.last_message || '',
            last_message_at: chat.last_message_at || new Date().toISOString(),
            unread_count: chat.unread_count || 0,
            active_order_id: chat.orders?.id,
            active_order_number: chat.orders?.order_number,
            active_order_status: chat.orders?.status
        }));
    },

    async getMessages(chatId: string): Promise<OrderMessage[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Map to OrderMessage format for UI compatibility
        return (data || []).map(msg => ({
            id: msg.id,
            order_id: msg.chat_id, // We reuse order_id as chat_id in UI
            sender: (msg.sender_type === 'store' ? 'store' : 'client') as 'store' | 'client',
            message: msg.content,
            created_at: msg.created_at
        }));
    },

    async sendMessage(chatId: string, sender: 'client' | 'store', message: string): Promise<OrderMessage> {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ 
                chat_id: chatId, 
                sender_type: sender, 
                content: message,
                message_type: message.startsWith('[MEDIA]') ? 'image' : 'text'
            }])
            .select()
            .single();

        if (error) throw error;

        // Update chat's last message
        await supabase.from('chats').update({
            last_message: message,
            last_message_at: new Date().toISOString(),
            unread_count: sender === 'client' ? undefined : 0 // If store replies, zero unread
        }).eq('id', chatId);

        return {
            id: data.id,
            order_id: data.chat_id,
            sender: (data.sender_type === 'store' ? 'store' : 'client') as 'store' | 'client',
            message: data.content,
            created_at: data.created_at
        };
    }
};
