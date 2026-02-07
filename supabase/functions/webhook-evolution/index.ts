
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    try {
        const { method } = req;
        if (method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const payload = await req.json();
        console.log("Webhook received:", JSON.stringify(payload));

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

                // Try to link
                let clientId = null;
                // Search client (this might be slow if many clients, but ok for MVP)
                // Using Edge Function, we can do a query.
                // Ideally we should have a 'whatsapp' column in clients that is indexed/unique.
                // For now, let's leave clientId null if not strictly found or let user link it later.

                const { data: client } = await supabase
                    .from("clients")
                    .select("id")
                    .ilike("phone", `%${cleanPhone.substring(2)}%`) // Try to match ignoring country code?
                    .limit(1)
                    .single();

                if (client) clientId = client.id;

                const { data: newChat, error: chatError } = await supabase
                    .from("chats")
                    .insert({
                        whatsapp_id: remoteJid,
                        client_id: clientId,
                        status: "open",
                        last_message: content,
                        unread_count: fromMe ? 0 : 1
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

            // Insert Message
            await supabase.from("messages").insert({
                chat_id: chat.id,
                content: content,
                sender_type: fromMe ? "user" : "contact",
                message_type: "text", // Handle images later
                external_id: key.id
            });
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
