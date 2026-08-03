-- ============================================================
-- FIX: Adicionar colunas faltantes na tabela orders
-- Motivo: O serviço de pedidos tenta salvar 'supplier_id' e 
-- 'supplier_paid_amount' na tabela orders, mas eles não existem,
-- causando erro na criação de novos pedidos.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_paid_amount numeric(12, 2) DEFAULT 0;

-- (Opcional) Confirmar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('supplier_id', 'supplier_paid_amount');
