-- ============================================================
-- MIGRATION: Adicionar total_cost na tabela orders
-- Permite persistir o custo total calculado por fornecedor,
-- que é a base para o cálculo de lucro real nos cards de pedido.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_cost numeric(12, 2) DEFAULT 0;

COMMENT ON COLUMN public.orders.total_cost IS
  'Custo total do pedido calculado com base nos custos por fornecedor de cada item.
   Usado para calcular o lucro real: total_value - total_cost.';
