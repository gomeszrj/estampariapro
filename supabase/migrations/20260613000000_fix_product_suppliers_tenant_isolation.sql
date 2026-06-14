-- ============================================================
-- MIGRATION: Isolamento por tenant na tabela product_suppliers
-- PROBLEMA: product_suppliers não tinha tenant_id nem RLS,
--           permitindo que tenants vissem vínculos uns dos outros.
-- ============================================================

-- PASSO 1: Adicionar coluna tenant_id
ALTER TABLE product_suppliers
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- PASSO 2: Popular tenant_id nos registros existentes
-- Herda o tenant_id do produto relacionado (forma mais segura)
UPDATE product_suppliers ps
SET tenant_id = p.tenant_id
FROM products p
WHERE ps.product_id = p.id
  AND ps.tenant_id IS NULL;

-- PASSO 3: Trigger para injetar tenant_id automaticamente em novos INSERTs
-- (reutiliza a função inject_tenant_id() já existente)
DROP TRIGGER IF EXISTS set_tenant_id_product_suppliers ON product_suppliers;

CREATE TRIGGER set_tenant_id_product_suppliers
  BEFORE INSERT ON product_suppliers
  FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();

-- PASSO 4: Ativar RLS na tabela
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Remover policies antigas (caso existam de tentativas anteriores)
DROP POLICY IF EXISTS "tenant_isolation_product_suppliers_select" ON product_suppliers;
DROP POLICY IF EXISTS "tenant_isolation_product_suppliers_insert" ON product_suppliers;
DROP POLICY IF EXISTS "tenant_isolation_product_suppliers_update" ON product_suppliers;
DROP POLICY IF EXISTS "tenant_isolation_product_suppliers_delete" ON product_suppliers;

-- PASSO 6: Criar políticas de isolamento por tenant
CREATE POLICY "tenant_isolation_product_suppliers_select" ON product_suppliers
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_product_suppliers_insert" ON product_suppliers
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_product_suppliers_update" ON product_suppliers
  FOR UPDATE USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation_product_suppliers_delete" ON product_suppliers
  FOR DELETE USING (tenant_id = get_my_tenant_id());

-- ============================================================
-- VERIFICAÇÃO: registros ainda sem tenant_id após a migração
-- Se retornar 0, está tudo correto.
-- ============================================================
SELECT
  COUNT(*) AS product_suppliers_sem_tenant
FROM product_suppliers
WHERE tenant_id IS NULL;
