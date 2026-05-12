-- 1. Criação da Tabela de Chats (Focada no Contato / Cliente)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_id TEXT NOT NULL UNIQUE, -- Ex: 551199999999@s.whatsapp.net
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT,
    tag TEXT DEFAULT 'Novo', -- Novo, Atendimento, Arte, Orçamento, Dúvidas
    status TEXT DEFAULT 'open',
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Vínculo Opcional com Pedido Ativo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e criar políticas para Chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de chats autenticada" ON public.chats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção de chats autenticada" ON public.chats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de chats autenticada" ON public.chats FOR UPDATE TO authenticated USING (true);

-- 2. Criação da Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL, -- 'store', 'contact', 'user'
    message_type TEXT DEFAULT 'text',
    external_id TEXT, -- ID da mensagem na Evolution API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e criar políticas para Mensagens
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de mensagens autenticada" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção de mensagens autenticada" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de mensagens autenticada" ON public.messages FOR UPDATE TO authenticated USING (true);

-- 3. Inserir a Evolution Webhook URL (Se usar Edge Functions do Supabase)
-- (Opcional) Migrar mensagens antigas se necessário:
-- INSERT INTO chats (whatsapp_id, client_name, order_id, last_message)
-- SELECT 'migrate_' || o.id, o.client_name, o.id, 'Migrado do antigo chat'
-- FROM orders o JOIN order_messages om ON om.order_id = o.id LIMIT 1;
