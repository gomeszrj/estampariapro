import { supabase } from './supabase';
import { Supplier } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: retorna o tenant_id do usuário logado no momento.
// Cache em módulo evita múltiplas chamadas ao banco por sessão.
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

  if (error || !data?.tenant_id) {
    throw new Error('tenant_id não encontrado para o usuário logado');
  }

  _cachedTenantId = data.tenant_id as string;
  return _cachedTenantId;
}

// Limpa o cache ao trocar de sessão (ex.: logout/login de outro usuário)
supabase.auth.onAuthStateChange(() => {
  _cachedTenantId = null;
});

// ─────────────────────────────────────────────────────────────────────────────
// supplierService — todas as operações filtram explicitamente por tenant_id,
// adicionando uma camada de segurança além do RLS do banco.
// ─────────────────────────────────────────────────────────────────────────────
export const supplierService = {

  // ── SUPPLIERS ──────────────────────────────────────────────────────────────

  async getAll(): Promise<Supplier[]> {
    const tenantId = await getMyTenantId();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)           // filtro explícito — não depende só do RLS
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
    return data || [];
  },

  async create(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const tenantId = await getMyTenantId();
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...supplier, tenant_id: tenantId }])   // inclui tenant_id explicitamente
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const tenantId = await getMyTenantId();
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)           // garante que só edita seu próprio registro
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const tenantId = await getMyTenantId();
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);          // garante que só deleta seu próprio registro

    if (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  // ── PRODUCT_SUPPLIERS (tabela de custo por produto) ────────────────────────

  async getSupplierProducts(supplierId: string) {
    const tenantId = await getMyTenantId();
    const { data, error } = await supabase
      .from('product_suppliers')
      .select(`
        id, supplier_id, product_id, cost_price, is_default,
        products ( id, name, sku )
      `)
      .eq('supplier_id', supplierId)
      .eq('tenant_id', tenantId);          // filtro explícito de tenant

    if (error) {
      console.error('Error fetching supplier products:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Retorna o custo de um produto específico num fornecedor específico.
   * Usado para auto-preencher o custo unitário ao selecionar fornecedor por item.
   */
  async getCostForProduct(supplierId: string, productId: string): Promise<number | null> {
    if (!supplierId || !productId) return null;
    const tenantId = await getMyTenantId();
    const { data, error } = await supabase
      .from('product_suppliers')
      .select('cost_price')
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .eq('tenant_id', tenantId)           // filtro explícito de tenant
      .maybeSingle();

    if (error || !data) return null;
    return Number(data.cost_price);
  },

  /**
   * Carrega todos os custos de product_suppliers para um conjunto de fornecedores.
   * Retorna um Map com chave `${supplierId}__${productId}` → cost_price.
   * Permite lookup O(1) na UI sem múltiplas chamadas ao banco.
   */
  async getSupplierProductsMap(supplierIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!supplierIds || supplierIds.length === 0) return map;

    const tenantId = await getMyTenantId();
    const { data, error } = await supabase
      .from('product_suppliers')
      .select('supplier_id, product_id, cost_price')
      .in('supplier_id', supplierIds)
      .eq('tenant_id', tenantId);          // filtro explícito de tenant

    if (error) {
      console.error('Error fetching supplier products map:', error);
      return map;
    }

    for (const row of data || []) {
      map.set(`${row.supplier_id}__${row.product_id}`, Number(row.cost_price));
    }
    return map;
  },

  async saveSupplierProduct(supplierProduct: {
    supplier_id: string;
    product_id: string;
    cost_price: number;
    is_default?: boolean;
  }) {
    const tenantId = await getMyTenantId();

    // Inclui tenant_id no payload — garante correto isolamento no upsert
    const payload = { ...supplierProduct, tenant_id: tenantId };

    const { data, error } = await supabase
      .from('product_suppliers')
      .upsert(payload, { onConflict: 'supplier_id, product_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving supplier product:', error);
      throw error;
    }
    return data;
  },

  async deleteSupplierProduct(id: string) {
    const tenantId = await getMyTenantId();
    const { error } = await supabase
      .from('product_suppliers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);          // garante que só deleta custo do próprio tenant

    if (error) throw error;
  }
};
