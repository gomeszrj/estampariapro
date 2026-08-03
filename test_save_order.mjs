import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const urlB64 = process.env.VITE_APP_S_URL;
const keyB64 = process.env.VITE_APP_S_KEY;

if (!urlB64 || !keyB64) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabaseUrl = Buffer.from(urlB64, 'base64').toString('utf-8');
const supabaseKey = Buffer.from(keyB64, 'base64').toString('utf-8');

// This uses the service_role key to bypass RLS, so it might not fail if the issue is RLS.
// BUT we will test it to see if it's a schema issue (missing column, etc).
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing order save (using service key)...");
  
  // We need a valid client_id from the DB to not fail FK constraints (if any)
  const { data: clients } = await supabase.from('clients').select('id').limit(1);
  const clientId = clients?.[0]?.id || null;

  const fakeOrder = {
    order_number: '9999',
    client_name: 'Test Client',
    client_id: clientId,
    status: 'NOVO',
    total_value: 100
  };
  
  const res = await supabase.from('orders').insert([fakeOrder]).select().single();
  console.log("Result of direct insert:", res);
  
  if (res.data) {
     // Clean up
     await supabase.from('orders').delete().eq('id', res.data.id);
  }
}

run();
