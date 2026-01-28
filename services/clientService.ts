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
    }
};
