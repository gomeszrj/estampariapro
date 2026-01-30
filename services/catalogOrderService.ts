import { supabase } from './supabase';
import { CatalogOrder, CatalogOrderItem } from '../types';

export const catalogOrderService = {
    async getAll() {
        const { data, error } = await supabase
            .from('catalog_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(mapCatalogOrderFromDB);
    },

    async create(order: Omit<CatalogOrder, 'id' | 'createdAt' | 'status'>) {
        const dbOrder = {
            client_id: order.clientId,
            client_name: order.clientName,
            client_phone: order.clientPhone,
            items: order.items, // JSONB
            total_estimated: order.totalEstimated,
            status: 'pending' // Default
        };

        const { data, error } = await supabase
            .from('catalog_orders')
            .insert([dbOrder])
            .select()
            .single();

        if (error) throw error;
        return mapCatalogOrderFromDB(data);
    },

    async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
        const { error } = await supabase
            .from('catalog_orders')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    async getByClientId(clientId: string) {
        const { data, error } = await supabase
            .from('catalog_orders')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(mapCatalogOrderFromDB);
    }
};

const mapCatalogOrderFromDB = (dbItem: any): CatalogOrder => ({
    id: dbItem.id,
    clientId: dbItem.client_id,
    clientName: dbItem.client_name,
    clientPhone: dbItem.client_phone,
    createdAt: dbItem.created_at,
    status: dbItem.status,
    items: dbItem.items as CatalogOrderItem[],
    totalEstimated: dbItem.total_estimated
});
