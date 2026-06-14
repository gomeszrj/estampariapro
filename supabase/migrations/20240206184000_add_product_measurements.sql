-- Add 'measurements' column as JSONB
ALTER TABLE products ADD COLUMN IF NOT EXISTS measurements JSONB;

-- Add 'published' column as BOOLEAN with default true
ALTER TABLE products ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT TRUE;

-- Update existing records to have published = true if null
UPDATE products SET published = TRUE WHERE published IS NULL;
