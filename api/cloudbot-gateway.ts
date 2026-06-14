import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Function: CloudBot Agent Gateway
 * 
 * This endpoint handles CloudBot AI interactions server-side,
 * keeping the Gemini API key secure (never exposed to the browser).
 * 
 * Expected POST body:
 * {
 *   action: 'think' | 'briefing',
 *   message?: string,       // for 'think'
 *   context?: object,       // for 'think'
 *   productCatalog?: array, // for 'think'
 *   chatHistory?: array     // for 'briefing'
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await supabase
        .from('tenant_credentials')
        .select('gemini_api_key')
        .not('gemini_api_key', 'is', null)
        .limit(1)
        .single();
        
      if (data && data.gemini_api_key) {
        apiKey = data.gemini_api_key;
      }
    }
  } catch (dbErr) {
    console.warn("Failed to fetch credentials from DB, falling back to ENV:", dbErr);
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no Banco de Dados nem no backend.' });
  }

  try {
    const { action, message, context, productCatalog, chatHistory } = req.body;

    const ai = new GoogleGenAI({ apiKey });

    if (action === 'think') {
      const productsList = (productCatalog || []).map((p: any) => `${p.name} (R$ ${p.basePrice})`).join(", ");

      const systemPrompt = `
      Você é o CloudBot, o ATENDENTE DO WHATSAPP da Estamparia Gomes.
      Sua missão: "Desenrolar" o atendimento. Resolver dúvidas, fechar vendas e informar status de pedidos com agilidade.

      # CONTEXTO ATUAL
      Cliente: ${context?.clientName || 'Desconhecido'}
      Intenção Detectada: ${context?.detectedIntent || 'Indefinida'}
      Itens no Rascunho: ${JSON.stringify(context?.draftOrderItems || [])}
      Info de Pedido (Status): ${context?.orderStatusInfo || 'Nenhuma consulta feita ainda.'}

      # CATÁLOGO DISPONÍVEL
      ${productsList}

      # GRADE DE TAMANHOS (MAPEAMENTO)
      - Infantil: 1, 2, 4, 6, 8, 10, 12, 14. 
      - Adulto: PP, P, M, G, GG, XG, XXG, ESP1, ESP2.
      **IMPORTANTE**: Se o cliente citar idade (ex: "tem 4 anos"), MAPEIE automaticamente para o tamanho infantil correspondente.

      # SUAS DIRETRIZES
      1. **Personalidade**: Você é prático, educado e resolve.
      2. **Vendas**: Se o cliente enviar uma lista, faça "Análise de Conferência" antes.
      3. **Status de Pedido**: Pergunte número ou telefone se não souber.

      Retorne APENAS um JSON:
      {
        "reply": "Texto da resposta",
        "updatedContext": { ...campos atualizados... },
        "action": "NONE" | "CREATE_ORDER" | "CHECK_ORDER_STATUS",
        "actionMetadata": { "orderNumber": "1234" }
      }
    `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `${systemPrompt}\n\nUser Message: "${message}"`,
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || '{}';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return res.status(200).json(JSON.parse(cleanJson));

    } else if (action === 'briefing') {
      const transcript = (chatHistory || []).map((m: any) => `${m.role?.toUpperCase()}: ${m.content}`).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `
          Analise esta conversa de venda e gere um BRIEFING TÉCNICO para a equipe de produção.
          
          CONVERSA:
          ${transcript}
          
          ## Perfil do Cliente
          (Como ele é? Exigente? Relaxado?)
          
          ## Pontos de Atenção
          (Prazos críticos, detalhes de cor, observações de entrega)
          
          ## Resumo do Pedido
          (O que foi fechado em linguagem clara)
        `
      });

      return res.status(200).json({ briefing: response.text || "Sem briefing gerado." });

    } else {
      return res.status(400).json({ error: 'Ação inválida. Use "think" ou "briefing".' });
    }

  } catch (error: any) {
    console.error("CloudBot Gateway Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
