-- Migration: Add theme_config to gmz_store_settings

ALTER TABLE public.gmz_store_settings
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;
