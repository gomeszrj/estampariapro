import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const sbUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const sbKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

fetch(`${sbUrl}/rest/v1/products?select=*&name=ilike.*manga*`, {
  headers: {
    'apikey': sbKey,
    'Authorization': `Bearer ${sbKey}`
  }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
