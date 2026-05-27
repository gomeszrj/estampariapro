import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== "POST") {
            return new Response("Method not allowed", { status: 405, headers: corsHeaders });
        }

        const { text, availableProducts } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "Missing text parameter" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let apiKey = Deno.env.get("GEMINI_API_KEY");
        
        try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL");
            const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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
            return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured in DB or server." }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
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

        return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("AI Gateway Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
