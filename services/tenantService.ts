import { supabase } from './supabase';

export const tenantService = {
  async getAllTenants() {
    const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getAllProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
  },
  async createTenant(tenantData: any) {
    const { data, error } = await supabase.from('tenants').insert([tenantData]).select().single();
    if (error) throw error;
    return data;
  },
  async updateTenant(id: string, updates: any) {
    const { error } = await supabase.from('tenants').update(updates).eq('id', id);
    if (error) throw error;
  }
};
