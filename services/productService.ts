import { supabase } from './supabase';
import { Product } from '../types';
import { GRADES } from '../constants';

// ─────────────────────────────────────────────────────────────────────────────
// Helper local: retorna tenant_id do usuário logado (com cache por sessão)
// ─────────────────────────────────────────────────────────────────────────────
let _cachedTenantId: string | null = null;

async function getMyTenantId(): Promise<string> {
  if (_cachedTenantId) return _cachedTenantId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const { data, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  if (error || !data?.tenant_id) throw new Error('tenant_id não encontrado');
  _cachedTenantId = data.tenant_id as string;
  return _cachedTenantId;
}

supabase.auth.onAuthStateChange(() => { _cachedTenantId = null; });

export const productService = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data?.map(mapProductFromDB) as Product[];
    },

    async getPublicProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('id, sku, name, category, status, image_url, back_image_url, base_price, description, allowed_grades, measurements, published, created_at')
            .eq('published', true)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data?.map(mapProductFromDB) as Product[];
    },

    async create(product: Omit<Product, 'id'>) {
        let dbProduct = mapProductToDB(product);
        let res = await supabase.from('products').insert([dbProduct]).select().single();
        
        // AUTO-HEALING & POLYFILL: Se faltar coluna, injeta ela dentro do JSONB 'allowed_grades' que já existe
        let retries = 0;
        while (res.error && retries < 5) {
            const errMsg = res.error.message;
            const match = errMsg.match(/Could not find the '(.*?)' column/);
            
            if (match && match[1]) {
                const col = match[1];
                console.warn(`⚠️ Auto-Fix: Salvando '${col}' no Polyfill...`);
                
                if (!dbProduct.allowed_grades) dbProduct.allowed_grades = {};
                if (!dbProduct.allowed_grades.__extensions) dbProduct.allowed_grades.__extensions = {};
                dbProduct.allowed_grades.__extensions[col] = dbProduct[col];
                
                delete dbProduct[col];
                res = await supabase.from('products').insert([dbProduct]).select().single();
                retries++;
            } else if (errMsg.includes('does not exist')) {
                if (!dbProduct.allowed_grades) dbProduct.allowed_grades = {};
                if (!dbProduct.allowed_grades.__extensions) dbProduct.allowed_grades.__extensions = {};
                dbProduct.allowed_grades.__extensions['addons'] = dbProduct.addons;
                dbProduct.allowed_grades.__extensions['categories'] = dbProduct.categories;
                dbProduct.allowed_grades.__extensions['material_variations'] = dbProduct.material_variations;
                
                delete dbProduct.addons;
                delete dbProduct.categories;
                delete dbProduct.material_variations;
                res = await supabase.from('products').insert([dbProduct]).select().single();
                break;
            } else {
                break; 
            }
        }

        if (res.error) throw res.error;
        return mapProductFromDB(res.data);
    },

    async update(id: string, updates: Partial<Product>) {
        let dbUpdates = mapProductToDB(updates as Product);
        let res = await supabase.from('products').update(dbUpdates).eq('id', id).select().single();
        
        let retries = 0;
        while (res.error && retries < 5) {
            const errMsg = res.error.message;
            const match = errMsg.match(/Could not find the '(.*?)' column/);
            
            if (match && match[1]) {
                const col = match[1];
                console.warn(`⚠️ Auto-Fix Update: Salvando '${col}' no Polyfill...`);
                
                // Fetch current allowed_grades to preserve existing extensions
                const { data: currentProduct } = await supabase.from('products').select('allowed_grades').eq('id', id).single();
                let grades = currentProduct?.allowed_grades || {};
                if (!grades.__extensions) grades.__extensions = {};
                grades.__extensions[col] = dbUpdates[col];
                dbUpdates.allowed_grades = grades;
                
                delete dbUpdates[col];
                res = await supabase.from('products').update(dbUpdates).eq('id', id).select().single();
                retries++;
            } else if (errMsg.includes('does not exist')) {
                const { data: currentProduct } = await supabase.from('products').select('allowed_grades').eq('id', id).single();
                let grades = currentProduct?.allowed_grades || {};
                if (!grades.__extensions) grades.__extensions = {};
                
                if (dbUpdates.addons !== undefined) grades.__extensions['addons'] = dbUpdates.addons;
                if (dbUpdates.categories !== undefined) grades.__extensions['categories'] = dbUpdates.categories;
                if (dbUpdates.material_variations !== undefined) grades.__extensions['material_variations'] = dbUpdates.material_variations;
                dbUpdates.allowed_grades = grades;

                delete dbUpdates.addons;
                delete dbUpdates.categories;
                delete dbUpdates.material_variations;
                res = await supabase.from('products').update(dbUpdates).eq('id', id).select().single();
                break;
            } else {
                break;
            }
        }

        if (res.error) throw res.error;
        return mapProductFromDB(res.data);
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

    async updateProductStock(id: string, quantityChange: number) {
        // Obter o produto atual primeiro
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const newStock = (product.stock || 0) + quantityChange;

        const { data, error } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapProductFromDB(data);
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
    },

    // ── Suppliers (product_suppliers) — todas filtradas por tenant ────────────
    async getProductSuppliers(productId: string) {
        const tenantId = await getMyTenantId();
        const { data, error } = await supabase
            .from('product_suppliers')
            .select(`
                *,
                supplier:suppliers (*)
            `)
            .eq('product_id', productId)
            .eq('tenant_id', tenantId);    // filtro explícito de tenant

        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            supplier_id: item.supplier_id,
            supplier: item.supplier,
            cost_price: item.cost_price,
            is_default: item.is_default
        }));
    },

    async addProductSupplier(supplierData: { product_id: string; supplier_id: string; cost_price: number; is_default: boolean }) {
        const tenantId = await getMyTenantId();

        if (supplierData.is_default) {
            // Reset others to false — restrito ao mesmo tenant
            await supabase
                .from('product_suppliers')
                .update({ is_default: false })
                .eq('product_id', supplierData.product_id)
                .eq('tenant_id', tenantId);
        }

        const { data, error } = await supabase
            .from('product_suppliers')
            .insert([{ ...supplierData, tenant_id: tenantId }])  // inclui tenant_id
            .select(`*, supplier:suppliers (*)`)
            .single();

        if (error) throw error;
        return {
            id: data.id,
            product_id: data.product_id,
            supplier_id: data.supplier_id,
            supplier: data.supplier,
            cost_price: data.cost_price,
            is_default: data.is_default
        };
    },

    async updateProductSupplier(id: string, updates: { cost_price?: number; is_default?: boolean }, productId: string) {
        const tenantId = await getMyTenantId();

        if (updates.is_default) {
            // Reset others — restrito ao mesmo tenant
            await supabase
                .from('product_suppliers')
                .update({ is_default: false })
                .eq('product_id', productId)
                .eq('tenant_id', tenantId);
        }

        const { data, error } = await supabase
            .from('product_suppliers')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', tenantId)     // garante que só edita do próprio tenant
            .select(`*, supplier:suppliers (*)`)
            .single();

        if (error) throw error;
        return {
            id: data.id,
            product_id: data.product_id,
            supplier_id: data.supplier_id,
            supplier: data.supplier,
            cost_price: data.cost_price,
            is_default: data.is_default
        };
    },

    async removeProductSupplier(id: string) {
        const tenantId = await getMyTenantId();
        const { error } = await supabase
            .from('product_suppliers')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);    // garante que só deleta do próprio tenant
        if (error) throw error;
    }
};

// Helpers to map between DB (snake_case) and App (camelCase)
const mapProductFromDB = (dbItem: any): Product => {
    const exts = dbItem.allowed_grades?.__extensions || {};
    
    // Clean up extensions from allowed_grades so it doesn't pollute the actual UI
    const cleanedAllowedGrades = dbItem.allowed_grades ? { ...dbItem.allowed_grades } : undefined;
    if (cleanedAllowedGrades && cleanedAllowedGrades.__extensions) {
        delete cleanedAllowedGrades.__extensions;
    }

    return {
        id: dbItem.id,
        sku: dbItem.sku,
        name: dbItem.name,
        category: dbItem.category,
        categories: dbItem.categories || exts.categories || (dbItem.category ? [dbItem.category] : []),
        status: dbItem.status,
        imageUrl: dbItem.image_url,
        backImageUrl: dbItem.back_image_url || exts.back_image_url,
        basePrice: dbItem.base_price,
        costPrice: dbItem.cost_price || 0,
        description: dbItem.description,
        allowedGrades: cleanedAllowedGrades,
        measurements: dbItem.measurements,
        published: dbItem.published,
        stock: dbItem.stock || 0,
        materialVariations: dbItem.material_variations || exts.material_variations || [],
        addons: dbItem.addons || exts.addons || [],
    };
};

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
    if (appItem.materialVariations !== undefined) {
        dbItem.material_variations = appItem.materialVariations;
        delete dbItem.materialVariations;
    }
    if (appItem.category !== undefined) {
        dbItem.category = appItem.category;
    }
    if (appItem.categories !== undefined) {
        dbItem.categories = appItem.categories;
        // fallback para query
        if (appItem.categories.length > 0) {
            dbItem.category = appItem.categories[0];
        } else {
            dbItem.category = '';
        }
        delete dbItem.categories; // remove camelCase to prevent conflict
        dbItem.categories = appItem.categories; // re-add for JSONB if snake_case wasn't needed, but it matches 'categories'
    }
    if (appItem.addons !== undefined) {
        dbItem.addons = appItem.addons;
    }
    if (appItem.stock !== undefined) {
        dbItem.stock = appItem.stock;
    }
    // delete other camelCase props if they were copied
    return dbItem;
};
