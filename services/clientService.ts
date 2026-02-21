import { supabase } from './supabase';
import { Client } from '../types';

export const clientService = {
    async getAll() {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Client[];
    },

    async create(client: Omit<Client, 'id'>) {
        const { data, error } = await supabase
            .from('clients')
            .insert([client])
            .select()
            .single();

        if (error) throw error;
        return data as Client;
    },

    async update(id: string, updates: Partial<Client>) {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Client;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async deleteWithCascade(id: string) {
        // 1. Get all order IDs for this client
        const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('client_id', id);

        const orderIds = orders?.map(o => o.id) || [];

        if (orderIds.length > 0) {
            // 2. Delete Order Items first (if no cascade in DB)
            await supabase.from('order_items').delete().in('order_id', orderIds);

            // 3. Delete Orders
            await supabase.from('orders').delete().eq('client_id', id);
        }

        // 4. Delete Client
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getByPhoneAndPassword(loginIdentifier: string, password: string): Promise<Client | null> {
        if (!loginIdentifier || !password) return null;

        const isEmail = loginIdentifier.includes('@');
        const cleanIdentifier = loginIdentifier.replace(/\D/g, '');

        if (isEmail) {
            // Se for email, busca exato pelo e-mail e confere a senha
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .ilike('email', loginIdentifier.trim())
                .eq('password', password)
                .single();

            if (error || !data) return null;
            return data as Client;
        }

        // Se for número (Doc ou Zap), buscamos todos que tenham esse password
        // E filtramos no JS, pois o whatsapp pode estar formatado (11) 99999-9999
        // e o cleanIdentifier é apenas os números. Fazer LIKE no postgresql com regex é pesado/inviável via SDK padrão sem RPC.
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('password', password);

        if (error || !data || data.length === 0) return null;

        // Procura entre os usuários com essa senha, aquele que bate o documento ou últimas 8 casas d zap
        const matched = data.find(c => {
            const dbPhone = (c.whatsapp || '').replace(/\D/g, '');
            const dbDoc = (c.document || '').replace(/\D/g, '');

            const matchesPhone = dbPhone && cleanIdentifier.length >= 8 && dbPhone.endsWith(cleanIdentifier.slice(-8));
            const matchesDoc = dbDoc && dbDoc === cleanIdentifier;

            return matchesPhone || matchesDoc;
        });

        return (matched as Client) || null;
    }
};
