import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-estampariapro-2026';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  let decodedToken: any;
  try {
    decodedToken = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }

  const clientId = decodedToken.id;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`*, items:order_items(*)`)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ orders });
  } catch (error: any) {
    console.error('Fetch Orders Error:', error);
    return res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
}
