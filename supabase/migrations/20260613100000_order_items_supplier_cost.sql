-- ============================================================
-- MIGRATION: Múltiplos fornecedores por pedido
-- Adiciona supplier_id e unit_cost em order_items
-- Cada item do pedido pode ter um fornecedor diferente,
-- com snapshot do custo no momento do pedido.
-- ============================================================

-- PASSO 1: Adicionar colunas em order_items
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS unit_cost numeric(12, 2) DEFAULT 0;

-- PASSO 2: Verificação
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
  AND column_name IN ('supplier_id', 'unit_cost')
ORDER BY column_name;
