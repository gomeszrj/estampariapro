-- Adicionar coluna JSONB categories para guardar as múltiplas categorias do produto (incluindo tecidos)
ALTER TABLE products ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;
