-- Create audit_logs table
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid,
  user_email text,
  action text not null,
  target_table text,
  target_id text,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
alter table audit_logs enable row level security;

-- Policy for tenant isolation (users can only read audit logs of their own tenant)
create policy "Users can view audit logs of their own tenant" on audit_logs
  for select
  using (
    tenant_id = (select tenant_id from profiles where profiles.id = auth.uid()) 
    OR 
    (auth.jwt() ->> 'email') = 'admin@estamparia.com'
  );

-- Policy for inserts (authenticated users can insert audit logs)
create policy "Authenticated users can insert audit logs" on audit_logs
  for insert
  with check (auth.role() = 'authenticated');
