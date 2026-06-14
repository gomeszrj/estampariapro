-- ============================================================
-- SCRIPT: RLS COMPLETO — Isolamento por tenant_id
-- Cada tenant vê APENAS seus próprios dados
-- Master Admin (tenant_id = '00000000-0000-0000-0000-000000000001')
-- tem acesso apenas ao painel SaaS, não a dados de outros tenants
--
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================================

-- ============================================================
-- FUNÇÃO AUXILIAR: get_my_tenant_id()
-- Retorna o tenant_id do usuário logado com cache via settings
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- FUNÇÃO AUXILIAR: is_master_admin()
-- Retorna true se o usuário logado for o Master Admin
-- ============================================================
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND tenant_id = '00000000-0000-0000-0000-000000000001'
      AND role IN ('master', 'admin', 'ADMIN MASTER')
  )
  OR (auth.jwt() ->> 'email') IN ('admin@estamparia.com', 'master@estamparia.com');
$$;

-- ============================================================
-- TABELA: orders
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "tenant_isolation_orders_select" ON orders;
DROP POLICY IF EXISTS "tenant_isolation_orders_insert" ON orders;
DROP POLICY IF EXISTS "tenant_isolation_orders_update" ON orders;
DROP POLICY IF EXISTS "tenant_isolation_orders_delete" ON orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON orders;

-- SELECT: apenas pedidos do próprio tenant
CREATE POLICY "tenant_isolation_orders_select" ON orders
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
  );

-- INSERT: só pode inserir com seu próprio tenant_id
CREATE POLICY "tenant_isolation_orders_insert" ON orders
  FOR INSERT WITH CHECK (
    tenant_id = get_my_tenant_id()
  );

-- UPDATE: apenas seus próprios pedidos
CREATE POLICY "tenant_isolation_orders_update" ON orders
  FOR UPDATE USING (
    tenant_id = get_my_tenant_id()
  );

-- DELETE: apenas seus próprios pedidos
CREATE POLICY "tenant_isolation_orders_delete" ON orders
  FOR DELETE USING (
    tenant_id = get_my_tenant_id()
  );

-- ============================================================
-- TABELA: clients
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_clients_select" ON clients;
DROP POLICY IF EXISTS "tenant_isolation_clients_insert" ON clients;
DROP POLICY IF EXISTS "tenant_isolation_clients_update" ON clients;
DROP POLICY IF EXISTS "tenant_isolation_clients_delete" ON clients;

CREATE POLICY "tenant_isolation_clients_select" ON clients
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_clients_insert" ON clients
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_clients_update" ON clients
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_clients_delete" ON clients
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- TABELA: products
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_products_select" ON products;
DROP POLICY IF EXISTS "tenant_isolation_products_select_public" ON products;
DROP POLICY IF EXISTS "tenant_isolation_products_insert" ON products;
DROP POLICY IF EXISTS "tenant_isolation_products_update" ON products;
DROP POLICY IF EXISTS "tenant_isolation_products_delete" ON products;

-- SELECT autenticado: apenas do próprio tenant
CREATE POLICY "tenant_isolation_products_select" ON products
  FOR SELECT USING (
    -- Usuário autenticado vê apenas seus produtos
    (auth.role() = 'authenticated' AND tenant_id = get_my_tenant_id())
    OR
    -- Público anônimo vê produtos publicados de qualquer tenant (catálogo público)
    (auth.role() = 'anon' AND published = true AND status = 'active')
  );

CREATE POLICY "tenant_isolation_products_insert" ON products
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_products_update" ON products
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_products_delete" ON products
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- TABELA: order_items
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_order_items_select" ON order_items;
DROP POLICY IF EXISTS "tenant_isolation_order_items_insert" ON order_items;
DROP POLICY IF EXISTS "tenant_isolation_order_items_update" ON order_items;
DROP POLICY IF EXISTS "tenant_isolation_order_items_delete" ON order_items;

-- Herda isolamento via JOIN com orders
CREATE POLICY "tenant_isolation_order_items_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

CREATE POLICY "tenant_isolation_order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

CREATE POLICY "tenant_isolation_order_items_update" ON order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

CREATE POLICY "tenant_isolation_order_items_delete" ON order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

-- ============================================================
-- TABELA: inventory_items
-- ============================================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_inventory_select" ON inventory_items;
DROP POLICY IF EXISTS "tenant_isolation_inventory_insert" ON inventory_items;
DROP POLICY IF EXISTS "tenant_isolation_inventory_update" ON inventory_items;
DROP POLICY IF EXISTS "tenant_isolation_inventory_delete" ON inventory_items;

CREATE POLICY "tenant_isolation_inventory_select" ON inventory_items
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_inventory_insert" ON inventory_items
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_inventory_update" ON inventory_items
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_inventory_delete" ON inventory_items
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- TABELA: transactions (financeiro)
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_transactions_select" ON transactions;
DROP POLICY IF EXISTS "tenant_isolation_transactions_insert" ON transactions;
DROP POLICY IF EXISTS "tenant_isolation_transactions_update" ON transactions;
DROP POLICY IF EXISTS "tenant_isolation_transactions_delete" ON transactions;

CREATE POLICY "tenant_isolation_transactions_select" ON transactions
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_transactions_insert" ON transactions
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_transactions_update" ON transactions
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_transactions_delete" ON transactions
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- TABELA: team_members
-- ============================================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_team_select" ON team_members;
DROP POLICY IF EXISTS "tenant_isolation_team_insert" ON team_members;
DROP POLICY IF EXISTS "tenant_isolation_team_update" ON team_members;
DROP POLICY IF EXISTS "tenant_isolation_team_delete" ON team_members;

CREATE POLICY "tenant_isolation_team_select" ON team_members
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_team_insert" ON team_members
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_team_update" ON team_members
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_team_delete" ON team_members
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- TABELA: art_queue
-- ============================================================
ALTER TABLE art_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_art_queue_select" ON art_queue;
DROP POLICY IF EXISTS "tenant_isolation_art_queue_insert" ON art_queue;
DROP POLICY IF EXISTS "tenant_isolation_art_queue_update" ON art_queue;
DROP POLICY IF EXISTS "tenant_isolation_art_queue_delete" ON art_queue;

CREATE POLICY "tenant_isolation_art_queue_select" ON art_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = art_queue.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

CREATE POLICY "tenant_isolation_art_queue_insert" ON art_queue
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = art_queue.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

CREATE POLICY "tenant_isolation_art_queue_update" ON art_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = art_queue.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

-- ============================================================
-- TABELA: order_messages (chat)
-- ============================================================
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_order_messages_select" ON order_messages;
DROP POLICY IF EXISTS "tenant_isolation_order_messages_insert" ON order_messages;

CREATE POLICY "tenant_isolation_order_messages_select" ON order_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_messages.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

CREATE POLICY "tenant_isolation_order_messages_insert" ON order_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_messages.order_id
        AND orders.tenant_id = get_my_tenant_id()
    )
  );

-- ============================================================
-- TABELA: suppliers
-- ============================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "tenant_isolation_suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "tenant_isolation_suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "tenant_isolation_suppliers_delete" ON suppliers;

CREATE POLICY "tenant_isolation_suppliers_select" ON suppliers
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_suppliers_update" ON suppliers
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_suppliers_delete" ON suppliers
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- TABELA: settings
-- ============================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_settings_select" ON settings;
DROP POLICY IF EXISTS "tenant_isolation_settings_insert" ON settings;
DROP POLICY IF EXISTS "tenant_isolation_settings_update" ON settings;
DROP POLICY IF EXISTS "tenant_isolation_settings_delete" ON settings;

CREATE POLICY "tenant_isolation_settings_select" ON settings
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_settings_insert" ON settings
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_settings_update" ON settings
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- TABELA: tenants — apenas o Master Admin vê todos
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_tenants_select" ON tenants;
DROP POLICY IF EXISTS "tenant_isolation_tenants_master_all" ON tenants;

-- Master Admin: vê e edita todos os tenants
CREATE POLICY "tenant_isolation_tenants_master_all" ON tenants
  FOR ALL USING (is_master_admin());

-- Tenant normal: vê apenas o próprio registro
CREATE POLICY "tenant_isolation_tenants_select" ON tenants
  FOR SELECT USING (id = get_my_tenant_id());

-- ============================================================
-- TABELA: profiles — cada usuário vê apenas o próprio perfil
-- (Master Admin vê todos para gerenciar)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_profiles_select" ON profiles;
DROP POLICY IF EXISTS "tenant_isolation_profiles_master_select" ON profiles;
DROP POLICY IF EXISTS "tenant_isolation_profiles_update" ON profiles;

-- Master Admin: vê todos os profiles
CREATE POLICY "tenant_isolation_profiles_master_select" ON profiles
  FOR SELECT USING (is_master_admin());

-- Tenant normal: vê apenas profiles do mesmo tenant
CREATE POLICY "tenant_isolation_profiles_select" ON profiles
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    OR id = auth.uid()
  );

-- Qualquer usuário pode atualizar apenas o próprio profile
CREATE POLICY "tenant_isolation_profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- VERIFICAÇÃO FINAL
-- Confirmar que as policies foram criadas
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'tenant_isolation%'
ORDER BY tablename, policyname;
