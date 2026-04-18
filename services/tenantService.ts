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
    return data;
  },
  async createTenantAdmin(email: string, password: string, tenantId: string, fullName: string) {
    const { data, error } = await supabase.rpc('create_tenant_user', {
      p_email: email,
      p_password: password,
      p_tenant_id: tenantId,
      p_full_name: fullName
    });
    if (error) throw error;
    return data;
  },
  async resetUserPassword(userId: string, newPassword: string) {
    const { error } = await supabase.rpc('reset_user_password', {
      p_user_id: userId,
      p_new_password: newPassword
    });
    if (error) throw error;
  }
};
