import { supabase } from './supabase';
import { getConfig, CONFIG_KEYS } from '../utils/config';

// Uses getConfig so it respects localStorage overrides (same pattern as supabase.ts)
const SUPABASE_URL = getConfig(CONFIG_KEYS.SUPABASE_URL);

export const tenantService = {
  async getTenantById(id: string) {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
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
    // NOTE: No .select().single() here — RLS on tenants uses get_tenant_id() which would
    // block the MasterAdmin from reading back a different tenant's row after update.
    const { error } = await supabase.from('tenants').update(updates).eq('id', id);
    if (error) throw error;
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
  },

  // ============================================
  // MERCADO PAGO INTEGRATION
  // ============================================

  /**
   * Calls the Supabase Edge Function to create a Mercado Pago preapproval
   * and get the checkout URL for the tenant to sign up.
   */
  async generateMercadoPagoLink(tenantId: string, plan: string, adminEmail: string, tenantName: string): Promise<{ checkoutUrl: string; preapprovalId: string }> {
    // Validate plan compatibility with Mercado Pago plans
    const validMpPlans = ['Starter', 'Pro Plus', 'Enterprise'];
    if (!validMpPlans.includes(plan)) {
      throw new Error(`O plano "${plan}" não tem integração com Mercado Pago. Mude o plano do tenant para Starter, Pro Plus ou Enterprise antes de gerar o link.`);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão expirada. Faça login novamente.');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-mp-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tenantId, plan, adminEmail, tenantName }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Manually trigger the auto-expire check (for testing or manual runs by master admin)
   */
  async runAutoExpireCheck(): Promise<{ expired: number; notified: number }> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/auto-expire-tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    if (!response.ok) throw new Error(`Auto-expire failed: HTTP ${response.status}`);
    return response.json();
  },

  // ============================================
  // RBAC — User Permissions
  // ============================================

  async getUserPermissions(profileId: string) {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('profile_id', profileId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsertUserPermissions(profileId: string, tenantId: string, permissions: Record<string, boolean>) {
    const { data, error } = await supabase
      .from('user_permissions')
      .upsert({ profile_id: profileId, tenant_id: tenantId, ...permissions }, { onConflict: 'profile_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMyPermissions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ============================================
  // SaaS Plans
  // ============================================

  async getAllSaasPlans() {
    const { data, error } = await supabase
      .from('saas_plans')
      .select('*')
      .order('price', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createSaasPlan(planData: any) {
    const { data, error } = await supabase
      .from('saas_plans')
      .insert(planData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSaasPlan(id: string, planData: any) {
    const { data, error } = await supabase
      .from('saas_plans')
      .update(planData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSaasPlan(id: string) {
    const { error } = await supabase
      .from('saas_plans')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
