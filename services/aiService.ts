import { supabase } from './supabase';

export interface ParsedOrderItem {
  teamName?: string; // Added team name
  product?: string;
  fabric?: string;
  grade?: 'Masculino' | 'Feminino' | 'Infantil';
  size?: string;
  quantity?: number;
  layoutNumber?: number; // Added layout number
  names?: string[];
}

export async function parseOrderText(text: string, availableProducts: { id: string, name: string }[] = []): Promise<ParsedOrderItem[]> {
  if (!text.trim()) return [];

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { text, availableProducts }
      });

      if (error) {
        throw new Error(error.message || "Erro na chamada da IA (Edge Function falhou)");
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      if (!Array.isArray(data)) {
        throw new Error("A API não retornou um array JSON válido.");
      }

      return data as ParsedOrderItem[];

    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw new Error(`Falha ao processar o pedido após ${maxRetries} tentativas. Último erro: ${lastError?.message}`);
}

export async function generateProductDescription(productName: string, category: string): Promise<string> {
  // Chamada provisória se precisarmos disso no futuro.
  // Pode ser migrada para o ai-gateway passando um `action: 'generate_description'`
  throw new Error("Função generateProductDescription foi desativada na migração para o Backend. Se precisar dela, avise o desenvolvedor para adicionar ao ai-gateway.");
}
