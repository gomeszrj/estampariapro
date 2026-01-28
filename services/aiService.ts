
import { GoogleGenAI, Type } from "@google/genai";

// Always use the named parameter and process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedOrderItem {
  product?: string;
  fabric?: string;
  grade?: 'Masculino' | 'Feminino' | 'Infantil';
  size?: string;
  quantity?: number;
}

export async function parseOrderText(text: string): Promise<ParsedOrderItem[]> {
  if (!text.trim()) return [];

  // Directly use ai.models.generateContent with the model name and prompt.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following informal print shop order message into a structured JSON array of items.
    
    Order Message: "${text}"
    
    Rules:
    - Identify Product Name (e.g., T-shirt, Polo)
    - Identify Fabric (e.g., Dry Fit, UV+)
    - Identify Grade (Must be 'Masculino', 'Feminino', or 'Infantil')
    - Identify Size (e.g., P, M, G, 1, 2)
    - Identify Quantity
    
    If multiple sizes are mentioned for the same product, create separate items for each size.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            product: { type: Type.STRING },
            fabric: { type: Type.STRING },
            grade: { type: Type.STRING, enum: ['Masculino', 'Feminino', 'Infantil'] },
            size: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
          },
          required: ["product", "grade", "size", "quantity"]
        }
      }
    }
  });

  try {
    // Access the .text property directly as per Gemini API guidelines.
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return [];
  }
}
