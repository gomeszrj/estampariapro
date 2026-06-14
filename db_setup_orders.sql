CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  has_artwork BOOLEAN DEFAULT false,
  artwork_url TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de pedidos da loja" ON public.store_orders 
FOR SELECT TO authenticated USING (tenant_id = auth.uid());

CREATE POLICY "Permitir inserção de pedidos publicos" ON public.store_orders 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Insert into storage.buckets if needed (depends on if 'store_artworks' exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store_artworks', 'store_artworks', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'store_artworks' );

CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'store_artworks' );
