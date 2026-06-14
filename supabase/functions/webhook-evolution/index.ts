
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    try {
        const { method } = req;
        if (method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        // SEC: Validate webhook secret to prevent forged payloads
        const webhookSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
        if (webhookSecret) {
            const signature = req.headers.get("x-webhook-secret") || req.headers.get("apikey");
            if (signature !== webhookSecret) {
                console.warn("Webhook rejected: invalid secret");
                return new Response("Unauthorized", { status: 401 });
            }
        }

        const payload = await req.json();
        console.log("Webhook received:", JSON.stringify(payload).substring(0, 500));

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Event Type: messages.upsert
        if (payload.event === "messages.upsert") {
            const { data } = payload;
            const message = data.message;
            const key = data.key;

            if (!message || !key) return new Response("No message data", { status: 200 });

            const remoteJid = key.remoteJid; // Client's JID (e.g., 5511999999@s.whatsapp.net)
            const fromMe = key.fromMe;
            const content = message.conversation || message.extendedTextMessage?.text || "";

            if (!content && !message.imageMessage) {
                // Ignore unknown message types for now
                return new Response("Ignored message type", { status: 200 });
            }

            // Find or Create Chat
            // We try to match client by phone number if possible, or just create a chat with valid JID
            // JID format: 551199999999@s.whatsapp.net
            const phone = remoteJid.split('@')[0];

            // 1. Check if chat exists
            let { data: chat } = await supabase
                .from("chats")
                .select("id, client_id")
                .eq("whatsapp_id", remoteJid)
                .single();

            if (!chat) {
                // Try to find client by phone (approximate match)
                // We assume phone is in the JID
                const cleanPhone = phone.replace(/\D/g, ""); // should be clean already
                // This is a naive match, ideally we want exact match on a 'mobile_phone' column
                // We will try finding a client whose phone contains this number or vice versa
                // For performance, we might just look for exact match if clients have clean phones.
                // Let's assume we just create the chat without client linkage if not found.

                let clientId = null;
                let clientName = "Cliente Desconhecido";

                // SEC: Escape special characters to prevent ilike pattern injection
                const safeSearchPhone = cleanPhone.substring(2).replace(/[%_\\]/g, '\\$&');

                const { data: client } = await supabase
                    .from("clients")
                    .select("id, name")
                    .ilike("phone", `%${safeSearchPhone}%`) // Try to match ignoring country code?
                    .limit(1)
                    .single();

                if (client) {
                    clientId = client.id;
                    clientName = client.name;
                }

                const { data: newChat, error: chatError } = await supabase
                    .from("chats")
                    .insert({
                        whatsapp_id: remoteJid,
                        client_id: clientId,
                        client_name: clientName,
                        status: "open",
                        last_message: content,
                        unread_count: fromMe ? 0 : 1,
                        tag: "Novo"
                    })
                    .select()
                    .single();

                if (chatError) throw chatError;
                chat = newChat;
            } else {
                // Update Chat
                await supabase
                    .from("chats")
                    .update({
                        last_message: content,
                        last_message_at: new Date(),
                        unread_count: fromMe ? 0 : (chat.unread_count || 0) + 1
                    })
                    .eq("id", chat.id);
            }

            // Check for Bot Commands if message is from Client
            let autoReply = null;
            let updatedTag = null;

            if (!fromMe) {
                // Check if it's the very first message
                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("chat_id", chat.id);

                if (count === 1) { // The one we just inserted is the first
                    autoReply = `Olá! Bem-vindo(a) à nossa Estamparia. 🚀\n\nComo podemos te ajudar hoje? Digite o número da opção desejada:\n\n1️⃣ Atendimento\n2️⃣ Criação de Artes\n3️⃣ Orçamentos\n4️⃣ Dúvidas`;
                } else if (chat.tag === "Novo") {
                    // Check if they are responding to the menu
                    const opt = content.trim();
                    if (opt === "1") {
                        updatedTag = "Atendimento";
                        autoReply = "Ótimo! Um de nossos atendentes já vai falar com você.";
                    } else if (opt === "2") {
                        updatedTag = "Arte";
                        autoReply = "Maravilha! Você será direcionado para o time de Criação de Artes.";
                    } else if (opt === "3") {
                        updatedTag = "Orçamento";
                        autoReply = "Legal! Já vamos te passar a nossa tabela de valores e montar seu orçamento.";
                    } else if (opt === "4") {
                        updatedTag = "Dúvidas";
                        autoReply = "Tudo bem! Pode mandar a sua dúvida que vamos te ajudar.";
                    }
                }
            }

            if (updatedTag) {
                await supabase.from("chats").update({ tag: updatedTag }).eq("id", chat.id);
            }

            if (autoReply) {
                // 1. Send via Evolution API (requires fetching server URL and Global Key from env or db)
                const evoUrl = Deno.env.get("EVOLUTION_API_URL");
                const evoKey = Deno.env.get("EVOLUTION_API_KEY");
                const instanceName = Deno.env.get("EVOLUTION_INSTANCE_NAME") || "GomeszSpeedPrint";

                if (evoUrl && evoKey) {
                    try {
                        await fetch(`${evoUrl}/message/sendText/${instanceName}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': evoKey
                            },
                            body: JSON.stringify({
                                number: remoteJid,
                                options: { delay: 1200, presence: "composing" },
                                textMessage: { text: autoReply }
                            })
                        });

                        // 2. Insert the bot's reply into messages table
                        await supabase.from("messages").insert({
                            chat_id: chat.id,
                            content: autoReply,
                            sender_type: "store",
                            message_type: "text",
                            external_id: `bot-${Date.now()}`
                        });

                    } catch (e) {
                        console.error("Failed to send autoReply via Evolution:", e);
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
