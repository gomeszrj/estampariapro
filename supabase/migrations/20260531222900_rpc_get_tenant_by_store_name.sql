-- Create a secure RPC to fetch tenant_id by store_name or company name without RLS issues
CREATE OR REPLACE FUNCTION get_tenant_by_store_name(p_store_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    -- Try gmz_store_settings first with partial match
    SELECT tenant_id INTO v_tenant_id
    FROM gmz_store_settings
    WHERE store_name ILIKE '%' || p_store_name || '%'
    LIMIT 1;

    IF v_tenant_id IS NOT NULL THEN
        RETURN v_tenant_id;
    END IF;

    -- Try settings as fallback
    SELECT tenant_id INTO v_tenant_id
    FROM settings
    WHERE name ILIKE '%' || p_store_name || '%'
    LIMIT 1;

    RETURN v_tenant_id;
END;
$$;
