-- ============================================================
-- SCRIPT: Criar Tenant Reservado para o Master Admin
-- Executar no Supabase SQL Editor (projeto correto)
-- ============================================================

-- PASSO 1: Criar o tenant reservado com UUID fixo
-- Este tenant existe apenas para isolar o Master Admin via RLS
-- Ele NÃO aparece como assinante real do sistema
INSERT INTO tenants (id, name, active, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MASTER ADMIN SISTEMA',
  true,
  'Enterprise'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PASSO 2: Criar o usuário master@estamparia.com
-- FAÇA ISSO NO SUPABASE DASHBOARD:
--   Authentication > Users > Invite User (ou Add User)
--   Email: master@estamparia.com
--   Senha: [escolha uma senha forte]
--   Após criar, copie o UUID gerado e use abaixo
-- ============================================================

-- PASSO 3: Vincular o usuário ao tenant reservado
-- Substitua <UUID-DO-USUARIO-MASTER> pelo UUID real do Supabase Auth
UPDATE profiles
SET
  tenant_id = '00000000-0000-0000-0000-000000000001',
  role = 'master'
WHERE id = '<UUID-DO-USUARIO-MASTER>';

-- VERIFICAÇÃO: Confirmar que o profile foi atualizado corretamente
SELECT
  id,
  email,
  role,
  tenant_id
FROM profiles
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- PASSO 4 (OPCIONAL): Garantir que o tenant master não aparece
-- na listagem de assinantes do painel SaaS
-- Se desejar, adicione uma coluna para marcar como sistema:
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
-- UPDATE tenants SET is_system = true WHERE id = '00000000-0000-0000-0000-000000000001';
-- ============================================================
