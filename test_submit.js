import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Buffer.from('aHR0cHM6Ly9tZHBzcmJtZnphb3N1dmhhbXZicy5zdXBhYmFzZS5jbw==', 'base64').toString('utf8');
const supabaseKey = Buffer.from('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW0xa2NITnlZbTExZW1GdmMzVjJhR0Z0ZG1Keklpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTmprek5Ua3hOamdzSW1WNGNDSTZNakE0TkRrek5URTJPSDAuRmllUWtXR1VaLWlSeDZYSHFrOHZOYWE5Tm5OdVB0a1NGbjZmN1c1dk9fVQ==', 'base64').toString('utf8');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmit() {
  const tenantId = 'a6854fb8-f5e9-4162-9857-eadfe6b9d130';
  
  const orderData = {
    customer_name: 'Renan Test',
    customer_phone: '21920116800',
    customer_email: 'RUA ORNALDNO NUNES 17',
    items: [{ id: 'test', quantity: 1, price: 10 }],
    total_price: 10,
    status: 'orcamento',
    source: 'loja_publica',
    has_artwork: true,
    artwork_url: 'https://example.com/test.cdr'
  };

  console.log('Sending order...');
  const { data, error } = await supabase
    .from('gmz_store_orders')
    .insert({
      tenant_id: tenantId,
      ...orderData
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Success:', data);
  }
}

testSubmit();
