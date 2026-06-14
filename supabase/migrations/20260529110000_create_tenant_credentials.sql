-- Create tenant_credentials table
CREATE TABLE IF NOT EXISTS public.tenant_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    whatsapp_api_key TEXT,
    whatsapp_phone_id TEXT,
    openai_api_key TEXT,
    gemini_api_key TEXT,
    mercadopago_access_token TEXT,
    mercadopago_public_key TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_pass TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT tenant_credentials_tenant_id_key UNIQUE (tenant_id)
);

-- Enable RLS
ALTER TABLE public.tenant_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own tenant credentials" ON public.tenant_credentials;
DROP POLICY IF EXISTS "Users can insert their own tenant credentials" ON public.tenant_credentials;
DROP POLICY IF EXISTS "Users can update their own tenant credentials" ON public.tenant_credentials;
DROP POLICY IF EXISTS "Users can delete their own tenant credentials" ON public.tenant_credentials;

-- Create Policies
CREATE POLICY "Users can view their own tenant credentials"
    ON public.tenant_credentials FOR SELECT
    USING (
        is_master_admin() OR 
        tenant_id = get_my_tenant_id()
    );

CREATE POLICY "Users can insert their own tenant credentials"
    ON public.tenant_credentials FOR INSERT
    WITH CHECK (
        is_master_admin() OR 
        tenant_id = get_my_tenant_id()
    );

CREATE POLICY "Users can update their own tenant credentials"
    ON public.tenant_credentials FOR UPDATE
    USING (
        is_master_admin() OR 
        tenant_id = get_my_tenant_id()
    );

CREATE POLICY "Users can delete their own tenant credentials"
    ON public.tenant_credentials FOR DELETE
    USING (
        is_master_admin() OR 
        tenant_id = get_my_tenant_id()
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenant_credentials_updated_at ON public.tenant_credentials;
CREATE TRIGGER update_tenant_credentials_updated_at
    BEFORE UPDATE ON public.tenant_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
