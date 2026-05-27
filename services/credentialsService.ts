import { supabase } from './supabase';

export interface TenantCredentials {
  id?: string;
  tenant_id?: string;
  whatsapp_api_key?: string;
  whatsapp_phone_id?: string;
  openai_api_key?: string;
  gemini_api_key?: string;
  mercadopago_access_token?: string;
  mercadopago_public_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
}

const getTenantId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  return data?.tenant_id || null;
};

export const credentialsService = {
  async getCredentials(): Promise<TenantCredentials | null> {
    const tenantId = await getTenantId();
    if (!tenantId) return null;
    
    const { data, error } = await supabase
      .from('tenant_credentials')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching credentials:', error);
    }
    
    return data || null;
  },

  async saveCredentials(credentials: Partial<TenantCredentials>): Promise<void> {
    const tenantId = await getTenantId();
    if (!tenantId) throw new Error('Tenant ID not found');
    
    const { error } = await supabase
      .from('tenant_credentials')
      .upsert({ 
        ...credentials, 
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id' });
      
    if (error) throw error;
  }
};
