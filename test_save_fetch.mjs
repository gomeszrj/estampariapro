import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const urlB64 = process.env.VITE_APP_S_URL;
const keyB64 = process.env.VITE_APP_S_KEY;

const url = Buffer.from(urlB64, 'base64').toString('utf-8');
const key = Buffer.from(keyB64, 'base64').toString('utf-8');

async function run() {
  console.log("Fetching clients...");
  let res = await fetch(`${url}/rest/v1/clients?limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  let clients = await res.json();
  const clientId = clients[0]?.id;

  console.log("Testing order save REST API...");
  
  const fakeOrder = {
    order_number: '9999',
    client_name: 'Test Client',
    client_id: clientId,
    status: 'NOVO',
    total_value: 100
  };
  
  res = await fetch(`${url}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify([fakeOrder])
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Result:", text);
}

run();
