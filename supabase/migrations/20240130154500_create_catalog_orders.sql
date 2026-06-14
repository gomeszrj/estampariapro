-- Create catalog_orders table
create table if not exists catalog_orders (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  client_name text,
  client_phone text,
  items jsonb, -- Stores array of { productId, size, quantity, notes }
  total_estimated numeric,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS to be safe, but allow public inserts for the catalog
alter table catalog_orders enable row level security;

-- Allow anonymous users (public catalog) to INSERT their orders
create policy "Enable insert for all users" on catalog_orders for insert with check (true);

-- Allow admins (authenticated) to VIEW all orders
create policy "Enable read access for authenticated users" on catalog_orders for select using (auth.role() = 'authenticated');

-- Allow admins to UPDATE (approve/reject)
create policy "Enable update access for authenticated users" on catalog_orders for update using (auth.role() = 'authenticated');
