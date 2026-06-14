-- ============================================================
-- SCRIPT: ADICIONAR tenant_id NAS TABELAS PRINCIPAIS
-- + TRIGGER para injetar automaticamente o tenant_id do usuário
--   em qualquer INSERT, sem precisar alterar o frontend
--
-- EXECUTAR ANTES do script de RLS (rls_tenant_isolation.sql)
-- ============================================================

-- ============================================================
-- PASSO 1: Adicionar coluna tenant_id nas tabelas que não têm
-- (usa IF NOT EXISTS para não quebrar se já existir)
-- ============================================================

ALTER TABLE orders        ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE clients       ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE products      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE transactions  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE team_members  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE suppliers     ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE art_queue     ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE order_messages ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE settings      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE product_recipes ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- ============================================================
-- PASSO 2: Função para obter tenant_id do usuário atual
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
-- PASSO 3: TRIGGER para injetar tenant_id automaticamente
-- Qualquer INSERT sem tenant_id recebe o tenant do usuário logado
-- ============================================================
CREATE OR REPLACE FUNCTION inject_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Se já tem tenant_id no insert, respeita
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Busca tenant_id do usuário logado
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem tenant_id associado. Impossível inserir dados.';
  END IF;

  NEW.tenant_id := v_tenant_id;
  RETURN NEW;
END;
$$;

-- Aplicar trigger em cada tabela
DROP TRIGGER IF EXISTS set_tenant_id_orders        ON orders;
DROP TRIGGER IF EXISTS set_tenant_id_clients       ON clients;
DROP TRIGGER IF EXISTS set_tenant_id_products      ON products;
DROP TRIGGER IF EXISTS set_tenant_id_inventory     ON inventory_items;
DROP TRIGGER IF EXISTS set_tenant_id_transactions  ON transactions;
DROP TRIGGER IF EXISTS set_tenant_id_team_members  ON team_members;
DROP TRIGGER IF EXISTS set_tenant_id_suppliers     ON suppliers;
DROP TRIGGER IF EXISTS set_tenant_id_art_queue     ON art_queue;
DROP TRIGGER IF EXISTS set_tenant_id_settings      ON settings;

CREATE TRIGGER set_tenant_id_orders        BEFORE INSERT ON orders        FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_clients       BEFORE INSERT ON clients       FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_products      BEFORE INSERT ON products      FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_inventory     BEFORE INSERT ON inventory_items FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_transactions  BEFORE INSERT ON transactions  FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_team_members  BEFORE INSERT ON team_members  FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_suppliers     BEFORE INSERT ON suppliers     FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_art_queue     BEFORE INSERT ON art_queue     FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();
CREATE TRIGGER set_tenant_id_settings      BEFORE INSERT ON settings      FOR EACH ROW EXECUTE FUNCTION inject_tenant_id();

-- ============================================================
-- PASSO 4: Atualizar dados existentes sem tenant_id
-- ATENÇÃO: rode isso APENAS se souber de qual tenant são os dados.
-- Se o banco tem apenas 1 tenant com dados reais, substitua o UUID abaixo.
-- ============================================================
-- Exemplo:
-- UPDATE orders   SET tenant_id = '<SEU-TENANT-UUID>' WHERE tenant_id IS NULL;
-- UPDATE clients  SET tenant_id = '<SEU-TENANT-UUID>' WHERE tenant_id IS NULL;
-- UPDATE products SET tenant_id = '<SEU-TENANT-UUID>' WHERE tenant_id IS NULL;
-- etc.

-- ============================================================
-- PASSO 5: VERIFICAÇÃO — listar registros sem tenant_id
-- Execute para ver se há dados órfãos antes de ativar o RLS
-- ============================================================
SELECT 'orders'          AS tabela, COUNT(*) AS sem_tenant FROM orders          WHERE tenant_id IS NULL
UNION ALL
SELECT 'clients'         AS tabela, COUNT(*) AS sem_tenant FROM clients         WHERE tenant_id IS NULL
UNION ALL
SELECT 'products'        AS tabela, COUNT(*) AS sem_tenant FROM products        WHERE tenant_id IS NULL
UNION ALL
SELECT 'inventory_items' AS tabela, COUNT(*) AS sem_tenant FROM inventory_items WHERE tenant_id IS NULL
UNION ALL
SELECT 'transactions'    AS tabela, COUNT(*) AS sem_tenant FROM transactions    WHERE tenant_id IS NULL
UNION ALL
SELECT 'team_members'    AS tabela, COUNT(*) AS sem_tenant FROM team_members    WHERE tenant_id IS NULL
UNION ALL
SELECT 'suppliers'       AS tabela, COUNT(*) AS sem_tenant FROM suppliers       WHERE tenant_id IS NULL;
