-- Migration: Decrement Inventory atomically
-- Evita Race Conditions quando múltiplos pedidos são finalizados juntos

CREATE OR REPLACE FUNCTION decrement_inventory(item_id UUID, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory_items
  SET quantity = GREATEST(0, quantity - amount),
      updated_at = NOW()
  WHERE id = item_id;
END;
$$;
