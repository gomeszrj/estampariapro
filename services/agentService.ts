
import { GoogleGenAI } from "@google/genai";
import { getConfig, CONFIG_KEYS } from "../utils/config";
import { Order, Client, Fabric, Product } from "../types";

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
    async think(message: string, context: AgentContext, productCatalog: Product[]): Promise<{ reply: string, updatedContext: AgentContext, action?: 'CREATE_ORDER' }> {
        if (!this.ai) return { reply: "Erro: Cérebro offline (API Key).", updatedContext: context };

        const productsList = productCatalog.map(p => `${p.name} (R$ ${p.basePrice})`).join(", ");

        const systemPrompt = `
      Você é o CloudBot, o vendedor de elite da Estamparia Gomes.
      Sua missão: Atender o cliente, entender o pedido, negociar e fechar a venda de forma autônoma.
      
      # CONTEXTO ATUAL
      Cliente: ${context.clientName || 'Desconhecido'}
      Intenção: ${context.detectedIntent || 'Indefinida'}
      Itens no Rascunho: ${JSON.stringify(context.draftOrderItems)}
      
      # CATÁLOGO DISPONÍVEL
      ${productsList}
      
      # SUAS DIRETRIZES (PERSONALIDADE)
      - Você é HUMANO, amigável mas profissional. Nada de "Sou uma IA".
      - Adapte-se: Se o cliente for curto, seja curto. Se for detalhista, explique bem.
      - Foco no Fechamento: Não enrole. Guie o cliente para fechar o pedido.
      
      # INSTRUÇÕES DE RACIOCÍNIO
      1. Analise a última mensagem.
      2. Atualize o contexto (Nome, Itens, Data de Entrega).
      3. Se o cliente confirmou o pedido, dispare a ação 'CREATE_ORDER'.
      4. Gere a resposta verbal para o cliente.
      
      Retorne APENAS um JSON no formato:
      {
        "reply": "Texto da resposta para o WhatsApp",
        "updatedContext": { ...campos atualizados... },
        "action": "NONE" | "CREATE_ORDER" | "CHECK_STOCK"
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
