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
  }
};
