-- Add stock column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;
