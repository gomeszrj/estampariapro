# Roteiro de Teste de Fumaça (Smoke Checklist) — EstampariaPro

Este roteiro contém o checklist de verificação rápida que o administrador ou equipe de QA deve realizar em produção para atestar que os principais módulos estão operando com 100% de integridade após a atualização para a versão `v21.8`.

---

## 🔒 1. Segurança e Autenticação
- [ ] **Login de Usuário:** Acessar a tela de login e entrar com um e-mail cadastrado.
- [ ] **Isolamento de Tenant (RLS):** Garantir que usuários comuns não conseguem acessar as configurações globais ou estamparia de terceiros.
- [ ] **Redefinição de Senhas:** No Master Admin, redefinir a senha de um administrador inquilino e validar o acesso dele com a nova credencial.

## 🚀 2. TanStack React Query Cache & UI
- [ ] **Carregamento de Pedidos:** Acessar a aba "Pedidos" e observar o carregamento inicial. Navegar para outras abas e voltar para "Pedidos", validando se a renderização é instantânea devido ao cache de estado.
- [ ] **Alerta de Estoque Baixo:** Entrar no estoque, diminuir um item para abaixo do limite e verificar se o badge `Estoque Baixo` aparece na barra superior piscando em vermelho. Clicar no badge e verificar se redireciona para a tela de estoque.

## ⚡ 3. Baixa Automática e WhatsApp
- [ ] **Fluxo de Produção:**
  - [ ] Criar um produto "Camiseta Dry Fit" e definir a receita com insumo "Insumo Dry" na quantidade de 2 unidades.
  - [ ] Criar um pedido com 10 unidades da "Camiseta Dry Fit" para um cliente de teste (com telefone válido configurado).
  - [ ] Mudar o status do pedido para "Pronto / Entregue".
  - [ ] Acessar o Estoque e verificar se o "Insumo Dry" teve uma redução exata de 20 unidades.
  - [ ] Verificar se o console / logs registram a chamada de envio de WhatsApp ao cliente informando sobre a conclusão do pedido.

## 💎 4. Master Admin e Mercado Pago
- [ ] **Geração de Links de Cobrança:** Tentar gerar o link de assinatura do Mercado Pago para um tenant e garantir que ele seja copiado para o clipboard.
- [ ] **Verificar Vencimentos:** Clicar no botão "Verificar Vencimentos" e atestar que a verificação manual foi concluída informando inquilinos atualizados ou expirados.
