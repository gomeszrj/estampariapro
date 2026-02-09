
import { GoogleGenAI, Type } from "@google/genai";
import { getConfig, CONFIG_KEYS } from "../utils/config";

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

// function signature
export async function parseOrderText(text: string, availableProducts: { id: string, name: string }[] = []): Promise<ParsedOrderItem[]> {
  if (!text.trim()) return [];

  // Check for API Key validity before call - Get latest key!
  const apiKey = getConfig(CONFIG_KEYS.GEMINI_API_KEY);
  if (!apiKey) {
    throw new Error("API Key do Google Gemini não encontrada. Configure-a clicando no seu avatar.");
  }

  // Initialize client with the FRESH key
  const ai = new GoogleGenAI({ apiKey });

  const productListString = availableProducts.map(p => p.name).join(", ");

  // GEMINI ATTEMPT
  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', // Upgraded model for better reasoning
        contents: `You are an expert Order Processing AI for a Print Shop, adhering to a STRICT CONSTITUTION.
        Your goal is to perform a REAL and EXTREME validation of the following order list.
        
        Order Text: "${text}"

        Available Products (System Registry): [${productListString}]
        
        # 1️⃣ PRINCÍPIO ABSOLUTO (NÃO NEGOCIÁVEL)
        - NUNCA remova nomes.
        - NUNCA unifique pessoas.
        - NUNCA corrija grafia sem autorização.
        - NUNCA altere tamanhos informados.
        - NUNCA altere quantidades.
        - NUNCA "assuma" dados que não foram informados.
        - Se houver ambiguidade, mantenha o dado original.

        # 2️⃣ PADRÃO VISUAL & ESTRUTURA
        - Extract 'teamName' if present (e.g. "Equipe X", Title at top).
        - Extract 'layoutNumber' (e.g. "Layout 502") -> Critical for grouping.
        - Match 'product' to Available Products.
        
        # 3️⃣ REGRAS DE INTERPRETAÇÃO
        - Repetir nomes de acordo com a quantidade (Ex: "2x João" -> João, João).
        - Tratar "Tamanho X" sem nome como "Sem Nome - X".
        - Separar: Masculino, Feminino, Infantil.
        - Identificar: Idades e Tamanhos Especiais (ESP, G2, etc.).

        Output a JSON array where each object has: { teamName, layoutNumber, product, fabric, grade, size, quantity, names }.

        CRITICALLY: return ALL items found. Do not summarize.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                teamName: { type: Type.STRING },
                layoutNumber: { type: Type.NUMBER },
                product: { type: Type.STRING },
                fabric: { type: Type.STRING },
                grade: { type: Type.STRING, enum: ['Masculino', 'Feminino', 'Infantil'] },
                size: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                names: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["layoutNumber", "product", "grade", "size", "quantity"]
            }
          }
        }
      });

      let cleanText = response.text || '[]';
      cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);

    } catch (e: any) {
      console.warn(`Gemini Attempt ${attempt + 1} failed:`, e);
      lastError = e;

      // Check for Rate Limit (429) or Service Unavailable (503)
      if (e.message?.includes('429') || e.message?.includes('503') || e.status === 429) {
        // Wait before retrying (exponential backoff: 2s, 4s, 8s)
        const delay = 2000 * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Break immediately for other errors (Auth, BadRequest, etc.)
      break;
    }
  }

  // OPENAI FALLBACK
  console.log("Gemini failed. Attempting OpenAI Fallback...");
  const openaiKey = getConfig(CONFIG_KEYS.OPENAI_API_KEY);

  if (openaiKey) {
    try {
      // Import dynamically to avoid load-time errors if package missing
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective fallback
        messages: [
          {
            role: "system",
            content: `You are an expert Order Processing AI for a Print Shop.
            ADHERE TO A STRICT CONSTITUTION.

            Available Products: [${productListString}]
            
            # 1️⃣ PRINCÍPIO ABSOLUTO
            - NUNCA remova nomes or unifique pessoas.
            - NUNCA altere tamanhos ou quantidades.
            - NUNCA “assuma” dados.

            # 2️⃣ OUTPUT FORMAT
            Return a JSON Object with a single key "items".
            Array of: { teamName, layoutNumber, product, fabric, grade (Masculino/Feminino/Infantil), size, quantity, names: string[] }.
            
            # 3️⃣ INTERPRETATION
            - Extract 'teamName' if possible.
            - Extract 'layoutNumber' (e.g. "Layout 502").
            - Match 'product' to Available Products.
            - Normalize Grade and Size.
            
            Do not include markdown formatting. Return raw JSON.`
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      return parsed.items || (Array.isArray(parsed) ? parsed : []);

    } catch (openAiError) {
      console.error("OpenAI Fallback failed:", openAiError);
      // Fall through to throw original error
    }
  } else {
    console.warn("OpenAI API Key not configured for fallback.");
  }

  throw lastError || new Error("Falha em todos os serviços de IA.");
}

export async function generateProductDescription(productName: string, category: string): Promise<string> {
  const apiKey = getConfig(CONFIG_KEYS.GEMINI_API_KEY);
  if (!apiKey) throw new Error("API Key do Google Gemini não encontrada.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Estou cadastrando um produto na minha Estamparia.
            Produto: ${productName}
            Categoria: ${category}
            
            Crie uma descrição comercial curta, atraente e vendedora para este produto.
            Destaque qualidade, conforto e personalização.
            Máximo de 3 linhas. Tom profissional e moderno.
            
            Retorne APENAS o texto da descrição.`,
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro ao gerar descrição:", error);
    return "Erro ao gerar descrição automática.";
  }
}
