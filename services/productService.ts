import { supabase } from './supabase';
import { Product } from '../types';
import { GRADES } from '../constants';

export const productService = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        // Map snake_case to camelCase if needed, but for now assuming types match or we adjust types
        // Supabase returns snake_case columns by default. Our types are camelCase.
        // We should map them.
        return data?.map(mapProductFromDB) as Product[];
    },

    async create(product: Omit<Product, 'id'>) {
        const dbProduct = mapProductToDB(product);
        const { data, error } = await supabase
            .from('products')
            .insert([dbProduct])
            .select()
            .single();

        if (error) throw error;
        return mapProductFromDB(data);
    },

    async update(id: string, updates: Partial<Product>) {
        const dbUpdates = mapProductToDB(updates as Product); // Partial mapping helper needed ideally
        const { data, error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapProductFromDB(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async toggleStatus(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        return this.update(id, { status: newStatus as any });
    },

    // Recipes
    async getRecipe(productId: string) {
        const { data, error } = await supabase
            .from('product_recipes')
            .select(`
                *,
                inventory_items (name, unit)
            `)
            .eq('product_id', productId);

        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            inventoryItemId: item.inventory_item_id,
            inventoryItemName: item.inventory_items?.name,
            quantityRequired: item.quantity_required,
            unit: item.inventory_items?.unit
        }));
    },

    async addRecipeItem(productId: string, inventoryItemId: string, quantity: number) {
        const { data, error } = await supabase
            .from('product_recipes')
            .insert([{
                product_id: productId,
                inventory_item_id: inventoryItemId,
                quantity_required: quantity
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async removeRecipeItem(recipeId: string) {
        const { error } = await supabase
            .from('product_recipes')
            .delete()
            .eq('id', recipeId);
        if (error) throw error;
    }
};

// Helpers to map between DB (snake_case) and App (camelCase)
const mapProductFromDB = (dbItem: any): Product => ({
    id: dbItem.id,
    sku: dbItem.sku,
    name: dbItem.name,
    category: dbItem.category,
    status: dbItem.status,
    imageUrl: dbItem.image_url,
    backImageUrl: dbItem.back_image_url,
    basePrice: dbItem.base_price,
    costPrice: dbItem.cost_price || 0,
    description: dbItem.description,
    allowedGrades: dbItem.allowed_grades,
    measurements: dbItem.measurements
});

const mapProductToDB = (appItem: Partial<Product>) => {
    const dbItem: any = { ...appItem };

    // Map camelCase to snake_case for DB
    if (appItem.imageUrl !== undefined) {
        dbItem.image_url = appItem.imageUrl;
        delete dbItem.imageUrl;
    }
    if (appItem.backImageUrl !== undefined) {
        dbItem.back_image_url = appItem.backImageUrl;
        delete dbItem.backImageUrl;
    }
    if (appItem.basePrice !== undefined) {
        dbItem.base_price = appItem.basePrice;
        delete dbItem.basePrice;
    }
    if (appItem.costPrice !== undefined) {
        dbItem.cost_price = appItem.costPrice;
        delete dbItem.costPrice;
    }
    if (appItem.allowedGrades !== undefined) {
        dbItem.allowed_grades = appItem.allowedGrades;
        delete dbItem.allowedGrades;
    }
    // delete other camelCase props if they were copied
    return dbItem;
};
