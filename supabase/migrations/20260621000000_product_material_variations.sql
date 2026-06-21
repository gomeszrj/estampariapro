-- =====================================================
-- Migration: Product Material Variations
-- Data: 21/06/2026
-- Descrição: Adiciona suporte a variações de material
-- customizáveis por produto (tecido, cor, espessura, etc.)
-- =====================================================

-- Adicionar coluna material_variations como JSONB com padrão de array vazio
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS material_variations JSONB DEFAULT '[]'::jsonb;

-- Índice GIN para consultas dentro do JSONB (opcional, para busca futura)
CREATE INDEX IF NOT EXISTS idx_products_material_variations
  ON products USING GIN (material_variations);

-- Comentário explicativo
COMMENT ON COLUMN products.material_variations IS
  'Array de categorias de materiais customizáveis por produto. 
   Estrutura: [{ id, name, required, options: [{ id, label, costDelta }] }]
   Exemplo: [{ "id": "...", "name": "Tecido", "required": true, "options": [{ "id": "...", "label": "Dry Fit Premium", "costDelta": 0 }] }]';
