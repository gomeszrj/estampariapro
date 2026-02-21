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
        // Remove non-numeric characters for comparison
        const cleanIdentifier = loginIdentifier.replace(/\D/g, '');

        if (!cleanIdentifier || !password) return null;

        // Fetch clients matching the password
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('password', password);

        if (error) throw error;
        if (!data || data.length === 0) return null;

        // Find the client that matches either the document or the phone
        const matched = data.find(c => {
            const dbPhone = (c.whatsapp || '').replace(/\D/g, '');
            const dbDoc = (c.document || '').replace(/\D/g, '');

            const matchesPhone = dbPhone && cleanIdentifier.length >= 8 && dbPhone.endsWith(cleanIdentifier.slice(-8));
            const matchesDoc = dbDoc && dbDoc === cleanIdentifier;

            return matchesPhone || matchesDoc;
        });

        return matched as Client || null;
    }
};
