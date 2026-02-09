import { supabase } from './supabase';
import { InventoryItem } from '../types';

export const inventoryService = {
    async getAll() {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data?.map(mapFromDB) as InventoryItem[];
    },

    async create(item: Omit<InventoryItem, 'id'>) {
        const dbItem = mapToDB(item);
        const { data, error } = await supabase
            .from('inventory_items')
            .insert([dbItem])
            .select()
            .single();

        if (error) throw error;
        return mapFromDB(data);
    },

    async update(id: string, updates: Partial<InventoryItem>) {
        const dbUpdates = mapToDB(updates);
        const { data, error } = await supabase
            .from('inventory_items')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapFromDB(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateQuantity(id: string, newQuantity: number) {
        const { data, error } = await supabase
            .from('inventory_items')
            .update({ quantity: newQuantity })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapFromDB(data);
    }
};

const mapFromDB = (dbItem: any): InventoryItem => ({
    id: dbItem.id,
    name: dbItem.name,
    category: dbItem.category,
    quantity: dbItem.quantity,
    unit: dbItem.unit,
    minLevel: dbItem.min_level
});

const mapToDB = (item: Partial<InventoryItem>) => {
    const dbItem: any = { ...item };
    if (item.minLevel !== undefined) {
        dbItem.min_level = item.minLevel;
        delete dbItem.minLevel;
    }
    return dbItem;
};
