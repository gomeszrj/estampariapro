import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-estampariapro-2026';

// Simple in-memory rate limiting (Note: In production with multiple instances, use Redis/KV)
const rateLimits = new Map<string, { count: number, resetAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate Limiting Logic
  const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const rateLimitWindow = 60 * 1000; // 1 minute
  const maxRequests = 5; // 5 attempts per minute

  let limit = rateLimits.get(ip);
  if (!limit || limit.resetAt < now) {
    limit = { count: 1, resetAt: now + rateLimitWindow };
  } else {
    limit.count++;
  }
  rateLimits.set(ip, limit);

  if (limit.count > maxRequests) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 1 minuto.' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  const { mode, phone, orderNumber, supportName } = req.body;

  if (!phone || phone.length < 8) {
    return res.status(400).json({ error: 'Número de telefone inválido.' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const phoneLast8 = cleanPhone.slice(-8);

  try {
    if (mode === 'support') {
      const safePhoneLast8 = phoneLast8.replace(/[%_\\]/g, '\\$&');
      
      let { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .ilike('whatsapp', `%${safePhoneLast8}%`)
        .limit(1);

      let client = clients && clients.length > 0 ? clients[0] : null;

      if (!client) {
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert([{ name: supportName, whatsapp: cleanPhone }])
          .select()
          .single();
        if (createError) throw createError;
        client = newClient;
      }

      let { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let order = orders && orders.length > 0 ? orders[0] : null;

      if (!order) {
        const { data: newOrder, error: orderCreateError } = await supabase
          .from('orders')
          .insert([{
            client_id: client.id,
            client_name: client.name || supportName,
            order_number: 'SUPORTE',
            status: 'solicitacao',
            origin: 'support',
            order_type: 'sale',
            total_value: 0,
            delivery_date: new Date().toISOString()
          }])
          .select()
          .single();
        if (orderCreateError) throw orderCreateError;
        order = newOrder;
      }

      const token = jwt.sign({ id: client.id, phone: client.whatsapp }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        session: { id: client.id, name: client.name, phone: client.whatsapp || cleanPhone },
        token,
        openSupportChat: order.id
      });
    }

    // Normal Login
    const cleanOrderNumber = orderNumber.replace(/#/g, '').trim();
    const numForSearch = parseInt(cleanOrderNumber, 10);
    const searchStr = isNaN(numForSearch) ? cleanOrderNumber : numForSearch.toString();
    const safeSearchStr = searchStr.replace(/[%_\\]/g, '\\$&');

    const { data: ordersData, error: orderError } = await supabase
      .from('orders')
      .select(`id, client_id, order_number, clients (id, name, whatsapp, document)`)
      .ilike('order_number', `%${safeSearchStr}%`)
      .limit(20);

    if (orderError || !ordersData || ordersData.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado. Verifique o número digitado.' });
    }

    const matchingOrder = ordersData.find(o => {
      const c = o.clients as any;
      if (!c) return false;
      const dbWhatsapp = (c.whatsapp || '').replace(/\D/g, '');
      return dbWhatsapp && dbWhatsapp.endsWith(phoneLast8);
    });

    if (matchingOrder) {
      const client = matchingOrder.clients as any;
      const token = jwt.sign({ id: client.id, phone: client.whatsapp }, JWT_SECRET, { expiresIn: '7d' });
      
      return res.status(200).json({
        session: { id: client.id, name: client.name, phone: client.whatsapp || cleanPhone },
        token
      });
    } else {
      return res.status(401).json({ error: 'O telefone informado não confere com nenhum pedido com este número.' });
    }
  } catch (error: any) {
    console.error('Auth Error:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}
