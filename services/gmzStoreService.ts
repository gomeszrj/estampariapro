import { supabase } from './supabase';

export interface GmzProduct {
  id: string;
  tenant_id?: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  badge?: string;
  features: string[];
  image_url?: string;
  image_url_back?: string;
  color_hex: string;
  sizes: string[];
  active: boolean;
  featured: boolean;
  stock_qty: number;
  sort_order: number;
  created_at?: string;
}

export interface GmzBanner {
  id: string;
  tenant_id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  cta_text: string;
  cta_url?: string;
  image_url?: string;
  bg_color: string;
  accent_color: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface GmzOrder {
  id: string;
  tenant_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  items: any[];
  total_price: number;
  status: 'novo' | 'orcamento' | 'aprovado' | 'producao' | 'entregue' | 'cancelado';
  notes?: string;
  custom_names?: string;
  source: string;
  created_at: string;
  updated_at?: string;
}

export interface GmzStoreSettings {
  id?: string;
  tenant_id?: string;
  store_name: string;
  store_subtitle: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  primary_color: string;
  accent_color: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  show_360_viewer: boolean;
  show_reviews: boolean;
  installments: number;
}

const getTenantId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  return data?.tenant_id || null;
};

export const gmzStoreService = {
  /* ─── PRODUCTS ─── */
  async getProducts(): Promise<GmzProduct[]> {
    const { data, error } = await supabase
      .from('gmz_store_products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createProduct(product: Omit<GmzProduct, 'id' | 'created_at'>): Promise<GmzProduct> {
    const tenantId = await getTenantId();
    const { data, error } = await supabase
      .from('gmz_store_products')
      .insert({ ...product, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<GmzProduct>): Promise<GmzProduct> {
    const { data, error } = await supabase
      .from('gmz_store_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('gmz_store_products').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadStoreImage(file: File, folder: 'products' | 'banners' = 'products'): Promise<string> {
    try {
      const ext = file.name.split('.').pop();
      const path = `gmz-${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.warn('Supabase storage failed, falling back to Base64:', err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },

  /* ─── BANNERS ─── */
  async getBanners(): Promise<GmzBanner[]> {
    const { data, error } = await supabase
      .from('gmz_store_banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createBanner(banner: Omit<GmzBanner, 'id' | 'created_at'>): Promise<GmzBanner> {
    const tenantId = await getTenantId();
    const { data, error } = await supabase
      .from('gmz_store_banners')
      .insert({ ...banner, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateBanner(id: string, updates: Partial<GmzBanner>): Promise<GmzBanner> {
    const { data, error } = await supabase
      .from('gmz_store_banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase.from('gmz_store_banners').delete().eq('id', id);
    if (error) throw error;
  },

  /* ─── ORDERS ─── */
  async getOrders(): Promise<GmzOrder[]> {
    const { data, error } = await supabase
      .from('gmz_store_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateOrderStatus(id: string, status: GmzOrder['status'], notes?: string): Promise<void> {
    const { error } = await supabase
      .from('gmz_store_orders')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async createOrder(order: Omit<GmzOrder, 'id' | 'created_at'>): Promise<GmzOrder> {
    const tenantId = await getTenantId();
    const { data, error } = await supabase
      .from('gmz_store_orders')
      .insert({ ...order, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /* ─── SETTINGS ─── */
  async getSettings(): Promise<GmzStoreSettings | null> {
    const tenantId = await getTenantId();
    if (!tenantId) return null;
    const { data } = await supabase
      .from('gmz_store_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    return data;
  },

  async saveSettings(settings: Partial<GmzStoreSettings>): Promise<void> {
    const tenantId = await getTenantId();
    if (!tenantId) return;
    await supabase.from('gmz_store_settings').upsert({
      ...settings,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id' });
  },

  /* ─── ANALYTICS ─── */
  async getAnalytics() {
    const { data: orders } = await supabase
      .from('gmz_store_orders')
      .select('total_price, status, created_at, items');

    const total = orders?.reduce((s, o) => s + Number(o.total_price), 0) || 0;
    const byStatus = {
      novo: orders?.filter(o => o.status === 'novo').length || 0,
      orcamento: orders?.filter(o => o.status === 'orcamento').length || 0,
      aprovado: orders?.filter(o => o.status === 'aprovado').length || 0,
      producao: orders?.filter(o => o.status === 'producao').length || 0,
      entregue: orders?.filter(o => o.status === 'entregue').length || 0,
      cancelado: orders?.filter(o => o.status === 'cancelado').length || 0,
    };

    // Revenue by day (last 30)
    const days: Record<string, number> = {};
    orders?.forEach(o => {
      const day = o.created_at?.split('T')[0];
      if (day) days[day] = (days[day] || 0) + Number(o.total_price);
    });

    return { total, byStatus, totalOrders: orders?.length || 0, revenueByDay: days };
  },

  /* ─── PUBLIC STORE METHODS (No Auth Required) ─── */
  async getPublicSettings(tenantId?: string): Promise<GmzStoreSettings | null> {
    let query = supabase.from('gmz_store_settings').select('*');
    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }
    // Limit to 1 in case there are multiple and no tenant passed
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
        console.error("Error fetching public settings", error);
        return null;
    }
    return data;
  },

  async getPublicBanners(tenantId?: string): Promise<GmzBanner[]> {
    let query = supabase.from('gmz_store_banners').select('*').eq('active', true).order('sort_order', { ascending: true });
    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query;
    if (error) {
        console.error("Error fetching public banners", error);
        return [];
    }
    return data || [];
  },

  async getPublicProducts(tenantId?: string): Promise<GmzProduct[]> {
    let query = supabase.from('gmz_store_products').select('*').eq('active', true).order('sort_order', { ascending: true });
    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query;
    if (error) {
        console.error("Error fetching public products", error);
        return [];
    }
    return data || [];
  }
};
