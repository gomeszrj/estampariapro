import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Lazy init the Gemini client so it handles missing keys gracefully
let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in Settings -> Secrets in AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// 1. Products Database / Hardcoded Data for the application
const PRODUCTS = [
  {
    id: "regata-lakers",
    category: "NBA",
    title: "Regata NBA Lakers Roxa",
    subtitle: "Regata com sublimação premium e respirabilidade máxima.",
    description: "Estilo Lakers com corte profissional e tecido Dry-Max AeroMesh.",
    badges: ["Tec Premium", "Sublimação Total", "AeroMesh Pro"],
    details: "Acabamento reforçado nas costuras ombro-a-ombro, gola em V, tecido AeroMesh ultra respirável ideal para alta performance em quadra e no cotidiano.",
    price: 89.90,
  },
  {
    id: "regata-bulls",
    category: "NBA",
    title: "Regata NBA Bulls Vermelha",
    subtitle: "Regata Bulls Vermelha premium com tecido AeroMesh.",
    description: "Corte clássico de basquete premium, estampa de alto brilho.",
    badges: ["Tec Premium", "Bulls Classic", "Secagem Rápida"],
    details: "Uniformes oficiais da Chicago Bulls Concept, costura dupla e elastano para máximo conforto e durabilidade.",
    price: 89.90,
  },
  {
    id: "manga-longa-azul",
    category: "UV+50",
    title: "Manga Longa UV+50 Azul",
    subtitle: "Proteção solar extrema UV+50 com termorregulação.",
    description: "Manga longa azul de alta performance para treinos ao ar livre.",
    badges: ["Proteção Solar", "Termorregulação", "Flexabilidade"],
    details: "Malha com proteção UV+50 bloqueadora de raios solares nocivos, com toque frio e ótima dispersão de suor.",
    price: 129.90,
  },
  {
    id: "manga-longa-preta",
    category: "UV+50",
    title: "Manga Longa UV+50 Preta",
    subtitle: "Sleek manga longa com detalhe neon e proteção UV+50.",
    description: "Visual tático com detalhes em circuitos de energia limão.",
    badges: ["Proteção Solar", "Design Tático", "Toque Frio"],
    details: "Ideal para treinos intensos sob o sol ou proteção tática em esportes ao ar livre. Tecido tecnológico super resistente.",
    price: 129.90,
  },
  {
    id: "camiseta-roxa",
    category: "MANGA CURTA",
    title: "Camiseta Dry Fit Roxa",
    subtitle: "Modelagem slim fit com caimento esportivo italiano.",
    description: "Camiseta premium Dry Fit na cor roxa de alta performance.",
    badges: ["Dry Fit Pro", "Super Leve", "Anti-Odor"],
    details: "A camiseta esportiva definitiva. Combina poliéster inteligente com fios elastano de toque suave, antialérgico e secagem ultra veloz.",
    price: 69.90,
  },
  {
    id: "camiseta-branca",
    category: "MANGA CURTA",
    title: "Camiseta Dry Fit Branca",
    subtitle: "Peça essencial branca com recortes cinza táticos.",
    description: "Dry Fit branca clássica com caimento estruturado moderno.",
    badges: ["Dry Fit Pro", "Proteção Térmica", "Não Amassa"],
    details: "Confeccionada em Poliamida Dry Touch, com painéis laterais respiráveis em cinza escuro para melhor fluxo térmico corporal.",
    price: 69.90,
  },
  {
    id: "oversized-bear",
    category: "DTF",
    title: "Oversized DTF Bear",
    subtitle: "Streetwear de algodão premium com estampa de alta nitidez.",
    description: "Estilo urbano oversized moderno com ilustração Bear robusta.",
    badges: ["100% Algodão", "Estamparia DTF Touchless", "Modelagem Solta"],
    details: "Malha penteada premium fio 30.1, estampa aplicada com tecnologia DTF industrial que garante cores ultra vibrantes que nunca desbotam ou racham.",
    price: 99.90,
  }
];

// Endpoint to get all products
app.get('/api/products', (req, res) => {
  res.json(PRODUCTS);
});

// 2. AI Team Uniform Core Theme Generator (JSON schema)
app.post('/api/ai-design-generator', async (req, res) => {
  try {
    const { teamConcept, mainColor, sport } = req.body;
    if (!teamConcept) {
      res.status(400).json({ error: "O conceito da equipe é obrigatório." });
      return;
    }

    const ai = getGenAI();

    const systemInstruction = 
      "Você é o Diretor Criativo e Especialista em Design Esportivo da GMZ Performance. " +
      "Você cria conceitos fantásticos, modernos, ultra-desejáveis e agressivos de uniformes esportivos " +
      "personalizados que despertam paixão nos times. Escreva sempre em PORTUGUÊS com foco em marketing esportivo de luxo.";

    const prompt = `Crie uma proposta de design de uniforme para um time de ${sport || "Esportes Gerais"} com o conceito: "${teamConcept}" e a cor predominante sugerida: "${mainColor || "Preto e Roxo Neon"}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["teamName", "colorPalette", "chestGraphic", "collarStyle", "jerseyDetails", "slogan", "designConcept"],
          properties: {
            teamName: {
              type: Type.STRING,
              description: "Nome épico e criativo sugerido para o time baseado no conceito."
            },
            colorPalette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 a 4 cores sugeridas em formato hexadecimal ou descrição (ex: 'Roxo Cyber #8F00FF')"
            },
            chestGraphic: {
              type: Type.STRING,
              description: "Descrição detalhada do brasão ou gráfico frontal que ficará no peito da camisa."
            },
            collarStyle: {
              type: Type.STRING,
              description: "Estilo da gola sugerido (ex: Gola Redonda Reforçada, Gola V Esportiva, Gola Polo Italiana)."
            },
            jerseyDetails: {
              type: Type.STRING,
              description: "Padrões, estamparia cyber, grafismos ou listras sugeridos para enriquecer as laterais e costas do uniforme."
            },
            slogan: {
              type: Type.STRING,
              description: "Um grito de guerra ou frase motivacional para ser estampada na nuca ou na fita interna da barra."
            },
            designConcept: {
              type: Type.STRING,
              description: "Conceito poético e técnico que descreve por que esse design representa o espírito e poder da equipe."
            }
          }
        }
      }
    });

    const parsedProposal = JSON.parse(response.text || "{}");
    res.json(parsedProposal);
  } catch (error: any) {
    console.error("AI design proposal error:", error);
    res.status(500).json({ 
      error: error.message || "Ocorreu um erro ao gerar a proposta de design.",
      isKeyMissing: !process.env.GEMINI_API_KEY 
    });
  }
});

// 3. AI Sales Assistant / Customer Support Chat
app.post('/api/ai-chat-assistant', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "O histórico de mensagens é obrigatório." });
      return;
    }

    const ai = getGenAI();

    // Map history to Google GenAI format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = 
      "Você é o atendente virtual inteligente da GMZ Performance, marca premium brasileira de vestuário esportivo " +
      "e uniformes personalizados. Seu objetivo é auxiliar clientes que desejam fazer pedidos em lote " +
      "ou tirar dúvidas do catálogo. Responda em português de forma extremamente profissional, prestativa, elegante " +
      "e entusiasmada. Enfatize que a GMZ apoia atletas com o que há de mais inovador em tecidos e design. " +
      "Informações de vendas: Quantidade mínima para uniformes personalizados em sublimação total é de 10 unidades. " +
      "O prazo de entrega é de 15 a 20 dias úteis após aprovação do layout digital. Enviamos para todo o Brasil. " +
      "Oferecemos desconto progressivo para fardamentos acima de 30 unidades.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Chat assistant error:", error);
    res.status(500).json({ 
      error: error.message || "Ocorreu um erro no atendente inteligente.",
      isKeyMissing: !process.env.GEMINI_API_KEY 
    });
  }
});

// 4. Uniform Quote Calculator Estimation
app.post('/api/quote-calculator', (req, res) => {
  try {
    const { productId, quantity, hasCustomName, hasCustomNumber, notes } = req.body;
    if (!productId || !quantity) {
      res.status(400).json({ error: "Produto e quantidade são campos requeridos." });
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(450).json({ error: "Insira uma quantidade válida superior a zero." });
      return;
    }

    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
      res.status(404).json({ error: "Produto do fardamento não encontrado." });
      return;
    }

    // Calculations & Discounts
    let basePrice = product.price;
    let customFee = 0;
    if (hasCustomName) customFee += 10;
    if (hasCustomNumber) customFee += 5;

    const unitPriceBeforeDiscount = basePrice + customFee;
    
    // Discount mechanism based on bulk tier
    let discountPercentage = 0;
    if (qty >= 50) {
      discountPercentage = 20; // 20% off for giant fardamento order
    } else if (qty >= 30) {
      discountPercentage = 15; // 15% off
    } else if (qty >= 15) {
      discountPercentage = 10; // 10% off
    } else if (qty >= 10) {
      discountPercentage = 5; // 5% off
    }

    const discountAmount = unitPriceBeforeDiscount * (discountPercentage / 100);
    const finalUnitPrice = unitPriceBeforeDiscount - discountAmount;
    const finalTotalPrice = finalUnitPrice * qty;

    // Delivery time calculation
    const currentDate = new Date();
    const minDeliveryDays = qty > 30 ? 20 : 15;
    const maxDeliveryDays = qty > 30 ? 25 : 20;
    
    const minDeliveryDate = new Date(currentDate);
    minDeliveryDate.setDate(currentDate.getDate() + minDeliveryDays);
    const maxDeliveryDate = new Date(currentDate);
    maxDeliveryDate.setDate(currentDate.getDate() + maxDeliveryDays);

    const formattedMinDate = minDeliveryDate.toLocaleDateString('pt-BR');
    const formattedMaxDate = maxDeliveryDate.toLocaleDateString('pt-BR');

    res.json({
      productName: product.title,
      quantity: qty,
      baseUnitPrice: basePrice,
      customFeeUnit: customFee,
      discountPercentage: discountPercentage,
      finalUnitPrice: parseFloat(finalUnitPrice.toFixed(2)),
      finalTotalPrice: parseFloat(finalTotalPrice.toFixed(2)),
      deliveryEstimate: `Entre ${formattedMinDate} e ${formattedMaxDate}`,
      minimumUnitsAlert: qty < 10 ? "Lembramos que pedidos abaixo de 10 unidades passam por análise de custos adicionais de set-up." : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Houve uma falha ao calcular o orçamento." });
  }
});

// Serve compiled build assets
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send("<h1>GMZ Performance Server Rodando!</h1><p>Inicie o Vite na porta 3000 para a interface rica.</p>");
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`GMZ Performance server active on port ${PORT}`);
});
