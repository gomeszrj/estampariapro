import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const fileQuery = req.query.f as string;
  
  if (!fileQuery) return res.status(400).send('Arquivo não especificado.');

  try {
    const decodedQuery = decodeURIComponent(fileQuery);
    const url = Buffer.from(decodedQuery, 'base64').toString('utf-8');
    
    // Prevents SSRF attacks (Server-Side Request Forgery) by strictly limiting domains
    if (!url.includes('supabase.co/storage/')) {
       return res.status(403).send('Acesso negado.');
    }

    const imageRes = await fetch(url);
    if (!imageRes.ok) {
       return res.status(imageRes.status).send('Erro ao buscar o arquivo no servidor remoto.');
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', imageRes.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(buffer);
  } catch(e) {
    console.error('Erro no proxy de arte:', e);
    return res.status(500).send('Link inválido ou expirado.');
  }
}
