-- Adiciona suporte para adicionais de personalização (Add-ons) nos produtos e pedidos

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;
