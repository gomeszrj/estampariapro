-- Add 'origin' column to track where the order came from (e.g., 'store', 'manual')
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'manual';

-- Add 'client_name' to orders for redundancy (in case client is deleted or for quick access)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Ensure 'client_team' exists (was mentioned in types but maybe not in DB)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_team TEXT;

-- Update RLS policies to allow public inserts (if not already handled by service role or anon key)
-- Note: Usually 'anon' key needs INSERT permission on 'orders' and 'order_items' for public store.
-- GRANT INSERT ON orders TO anon;
-- GRANT INSERT ON order_items TO anon;
-- GRANT INSERT ON clients TO anon;
