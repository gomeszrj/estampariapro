import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, availableProducts } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    // Get key securely from backend environment variables (configured in Vercel settings)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY ou VITE_GEMINI_API_KEY não foi configurada nas variáveis de ambiente da Vercel.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const productListString = availableProducts ? availableProducts.map((p: any) => p.name).join(", ") : "";

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are an expert Order Processing AI for a Print Shop, adhering to a STRICT CONSTITUTION.
      Your goal is to perform a REAL and EXTREME validation of the following order list.
      
      Order Text: "${text}"

      Available Products (System Registry): [${productListString}]
      
      # 1️⃣ PRINCÍPIO ABSOLUTO (NÃO NEGOCIÁVEL)
      - NUNCA remova nomes.
      - NUNCA unifique pessoas.
      - NUNCA corrija grafia sem autorização.
      - NUNCA altere tamanhos informados.
      - Se "Fulano P" estiver na lista, deve constar na saída.
      - Se o texto citar "10 P e 10 M", mas listar os nomes, gere OS NOMES UM A UM.
      
      # 2️⃣ VALIDAÇÃO EXTREMA DE PRODUTOS
      - O produto SÓ É VÁLIDO se a intenção for clara ou bater com a lista registrada: [${productListString}].
      - Se o produto não for especificado para um item, infira baseado no contexto (ex: texto fala de "camisas", todos os nomes recebem "Camisa").
      - Se a lista mencionar layouts numerados ("Layout 1: Joao, Maria", "Layout 2: Pedro"), ATRIBUA o respectivo "layoutNumber" a cada pessoa.
      - Se a lista tiver times ("Time A:", "Time B:"), ATRIBUA o respectivo "teamName" a cada pessoa.
      
      # 3️⃣ EXTRAÇÃO CIRÚRGICA
      - Nomes extras como (Goleiro), (Capitão), apelidos, DEVEM ser capturados exatamente. Ex: "Marcos (Goleiro) - GG".
      
      Sua SAÍDA DEVE SER ESTRITAMENTE JSON. Nenhum texto extra, sem bloco de código markdown.
      O JSON deve ser um array de objetos contendo:
      teamName (string, optional)
      product (string, obrigatorio)
      fabric (string, optional)
      grade (string, "Masculino", "Feminino" ou "Infantil")
      size (string, obrigatorio)
      quantity (number, obrigatorio, geralmente 1 se houver nome)
      layoutNumber (number, optional)
      names (array de strings, colocar nome aqui. Se a linha tem 1 nome, length=1)`,
      config: {
        temperature: 0.1,
        topK: 10,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              teamName: { type: Type.STRING, description: "Nome do time, se aplicável" },
              product: { type: Type.STRING, description: "O produto exato inferido do contexto" },
              fabric: { type: Type.STRING, description: "Tipo de tecido" },
              grade: { type: Type.STRING, enum: ["Masculino", "Feminino", "Infantil"] },
              size: { type: Type.STRING, description: "Tamanho da peça" },
              quantity: { type: Type.INTEGER, description: "Quantidade" },
              layoutNumber: { type: Type.INTEGER, description: "Número do layout da estampa, se aplicável" },
              names: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de nomes para este item. Array de 1 elemento se for apenas um nome." }
            },
            required: ["product", "size", "quantity"]
          }
        }
      }
    });

    const rawJson = response.text || "[]";
    const parsed = JSON.parse(rawJson);

    return res.status(200).json(parsed);

  } catch (error: any) {
    console.error("AI Gateway Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
