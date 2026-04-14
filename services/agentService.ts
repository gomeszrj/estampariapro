
import { GoogleGenAI } from "@google/genai";
import { getConfig, CONFIG_KEYS } from "../utils/config";
import { Order, Client, Fabric, Product } from "../types";
import { orderService } from "./orderService";

// State Machine for the Conversation
export type AgentState =
    | 'IDLE'
    | 'GREETING'
    | 'QUALIFYING' // Asking for name, team, product
    | 'NEGOTIATING' // Discussing price/discount
    | 'DRAFTING' // Confirming items
    | 'CLOSING' // Sending payment link
    | 'SUPPORT'; // Answering tracking questions

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: any;
}

export interface AgentContext {
    clientName?: string;
    detectedIntent?: string; // 'buy', 'status', 'complaint'
    draftOrderItems: any[];
    currentGoal?: string; // 'get_size', 'get_payment'
    personality?: string; // 'Friendly', 'Professional', 'Objective'
    orderStatusInfo?: string; // injected info about an order
}

export class AgentService {
    private ai: GoogleGenAI;
    private history: ChatMessage[] = [];
    private context: AgentContext = { draftOrderItems: [] };

    constructor() {
        const apiKey = getConfig(CONFIG_KEYS.GEMINI_API_KEY);
        // Note: In production we should handle missing key gracefully
        this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    }

    // The "Brain" - Decides what to do next
    async think(message: string, context: AgentContext, productCatalog: Product[]): Promise<{ reply: string, updatedContext: AgentContext, action?: 'CREATE_ORDER' | 'CHECK_ORDER_STATUS', actionMetadata?: any }> {
        if (!this.ai) return { reply: "Erro: Cérebro offline (API Key).", updatedContext: context };

        const productsList = productCatalog.map(p => `${p.name} (R$ ${p.basePrice})`).join(", ");

        const systemPrompt = `
      Você é o CloudBot, o ATENDENTE DO WHATSAPP da Estamparia Gomes.
      Sua missão: "Desenrolar" o atendimento. Resolver dúvidas, fechar vendas e informar status de pedidos com agilidade.

      # CONTEXTO ATUAL
      Cliente: ${context.clientName || 'Desconhecido'}
      Intenção Detectada: ${context.detectedIntent || 'Indefinida'}
      Itens no Rascunho: ${JSON.stringify(context.draftOrderItems)}
      Info de Pedido (Status): ${context.orderStatusInfo || 'Nenhuma consulta feita ainda.'}

      # CATÁLOGO DISPONÍVEL
      ${productsList}

      # GRADE DE TAMANHOS (MAPEAMENTO)
      - Infantil: 1, 2, 4, 6, 8, 10, 12, 14. 
      - Adulto: PP, P, M, G, GG, XG, XXG, ESP1, ESP2.
      **IMPORTANTE**: Se o cliente citar idade (ex: "tem 4 anos"), MAPEIE automaticamente para o tamanho infantil correspondente (ex: tamanho 4). Se a idade não tiver tamanho exato (ex: 3 anos), sugira o próximo acima (tamanho 4).

      # SUAS DIRETRIZES
      1. **Personalidade**: Você é prático, educado e resolve. Fala como gente, não como robô.
      2. **Vendas e Listas**: 
         - SE o cliente enviar uma lista de itens (ex: 10 camisetas P, 5 M...), você DEVE fazer uma "Análise de Conferência" antes de qualquer coisa. 
         - Responda resumindo o que entendeu: "Legal! Entendi que você precisa de [Quantidade Total] peças, sendo [X] do tamanho [Y] e [A] do tamanho [B]. Está correto?"
         - APENAS após a confirmação do cliente, você deve retornar a ação "CREATE_ORDER".
      3. **Status de Pedido**: 
         - Se o cliente perguntar "cadê meu pedido?" ou "status", PERGUNTE o número do pedido ou CPF/Telefone se não souber.
         - Se você TIVER o número (ex: #1234), retorne a ação "CHECK_ORDER_STATUS".

      # INSTRUÇÕES DE RACIOCÍNIO
      1. Analise se há IDs de produtos ou nomes do catálogo na mensagem.
      2. Mapeie idades para tamanhos infantis da grade.
      3. Se detectar uma lista, entre em modo de "Conferência de Quantidades".

      Retorne APENAS um JSON no formato:
      {
        "reply": "Texto da resposta para o WhatsApp",
        "updatedContext": { ...campos atualizados... },
        "action": "NONE" | "CREATE_ORDER" | "CHECK_ORDER_STATUS",
        "actionMetadata": { "orderNumber": "1234" }
      }
    `;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `${systemPrompt}\n\nUser Message: "${message}"`,
                config: { responseMimeType: "application/json" }
            });

            const text = response.text || '{}';
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);

        } catch (e) {
            console.error("Brain freeze:", e);
            return { reply: "Desculpe, tive um lapso de memória. Pode repetir?", updatedContext: context };
        }
    }

    // Generates the Briefing for the internal team
    async generateBriefing(chatHistory: ChatMessage[]): Promise<string> {
        const transcript = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `
                Analise esta conversa de venda e gere um BRIEFING TÉCNICO para a equipe de produção.
                
                CONVERSA:
                ${transcript}
                
                # OUTPUT ESPERADO (Markdown):
                ## Perfil do Cliente
                (Como ele é? Exigente? Relaxado?)
                
                ## Pontos de Atenção
                (Prazos críticos, detalhes de cor, observações de entrega)
                
                ## Resumo do Pedido
                (O que foi fechado em linguagem clara)
            `
            });
            return response.text || "Sem briefing gerado.";
        } catch (e) {
            return "Erro ao gerar briefing.";
        }
    }
}

export const agentService = new AgentService();
