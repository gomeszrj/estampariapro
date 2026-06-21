-- Migration to add selected_variations to order_items to support dynamic material selections

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS selected_variations JSONB;

COMMENT ON COLUMN order_items.selected_variations IS 'Armazena as variações de materiais selecionadas (JSONB) vindas do produto, por ex: {"Tecido": "Dry Fit Premium", "Cor": "Azul"}';
