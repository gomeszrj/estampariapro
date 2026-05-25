import { supabase } from "./supabase";
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
    private history: ChatMessage[] = [];
    private context: AgentContext = { draftOrderItems: [] };

    constructor() {
        // AI initialization is handled securely by the backend (Edge Function).
    }

    // The "Brain" - Decides what to do next
    async think(message: string, context: AgentContext, productCatalog: Product[]): Promise<{ reply: string, updatedContext: AgentContext, action?: 'CREATE_ORDER' | 'CHECK_ORDER_STATUS', actionMetadata?: any }> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-gateway', {
                body: { action: 'think', message, context, productCatalog }
            });

            if (error) {
                console.error("Gateway error:", error);
                throw error;
            }

            return data;
        } catch (e) {
            console.error("Brain freeze:", e);
            return { reply: "Desculpe, tive um problema de conexão com a central. Pode repetir?", updatedContext: context };
        }
    }

    // Generates the Briefing for the internal team
    async generateBriefing(chatHistory: ChatMessage[]): Promise<string> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-gateway', {
                body: { action: 'briefing', chatHistory }
            });

            if (error) {
                console.error("Gateway error:", error);
                throw error;
            }

            return data.briefing || "Sem briefing gerado.";
        } catch (e) {
            console.error("Error generating briefing:", e);
            return "Erro ao gerar briefing. Verifique a conexão com a central.";
        }
    }
}

export const agentService = new AgentService();
