import { supabase } from './supabase';
import { Supplier } from '../types';

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
    
    return data || [];
  },

  async create(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }

    return data;
  },

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  async getSupplierProducts(supplierId: string) {
    const { data, error } = await supabase
      .from('product_suppliers')
      .select(`
        id, supplier_id, product_id, cost_price, is_default,
        products ( id, name, sku )
      `)
      .eq('supplier_id', supplierId);
    
    if (error) {
      console.error('Error fetching supplier products:', error);
      return [];
    }
    return data || [];
  },

  async saveSupplierProduct(supplierProduct: any) {
    const { data, error } = await supabase
      .from('product_suppliers')
      .upsert(supplierProduct, { onConflict: 'supplier_id, product_id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving supplier product:', error);
      throw error;
    }
    return data;
  },

  async deleteSupplierProduct(id: string) {
    const { error } = await supabase
      .from('product_suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

