import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 21.9 -> 22.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '26.2.0';
export const APP_NAME = 'Gomesz Speed Print';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 26.2.0 — "Identidade Visual Profissional: Stamp Mark" (02/08/2026):

🎨 REDESIGN DE IDENTIDADE VISUAL (LOGO & BRANDING):
  * Novo Logo "C3 Stamp Mark": Componente SVG vetorial inline EstampariaProLogo — anel orbital ciano, letra E geométrica e 4 pontos de registro nos eixos (referência à serigrafia). Animado, escalável, sem dependência de arquivo externo.
  * Splash Screen Profissional: Logo animado (96px) com anel orbital girando e glow pulsante ciano. Barra de progresso neon. Tipografia Barlow Condensed bold.
  * Favicon SVG: Atualizado para o logo C3 inline — funciona em todos os browsers. Título da aba: "EstampariaPro · Sistema de Gestão".

✅ REDESIGN COMPLETO DO LOGIN:
  * Coluna Esquerda: Logo grande (100px) animado como peça central, título Barlow Condensed 58px, textura de trama de tecido no fundo, linha ciano lateral, grid 2x2 de feature cards com animação escalonada.
  * Card do Formulário: Substituído degradê genérico por card escuro com borda ciano sutil e 4 crosshairs nos cantos (marcas de registro de serigrafia). Mini logo (36px) no topo do card — visível no mobile.
  * Removido toggle "Tema" (era placeholder inativo). Header em Barlow Condensed com acento ciano.

🏠 SIDEBAR ATUALIZADA:
  * Logo "EP" texto substituído pelo novo logo C3 animado (44px) com tipografia Barlow Condensed e acento ciano.

Novidades da Versão 26.1.0 — "Login Glassmorphic e Saída de Caixa de Fornecedores" (01/08/2026):

✅ DESIGN & ESTÉTICA FRONTEND (LOGIN PREMIUM):
  * Logo Remodelada: A arte abstrata antiga foi totalmente removida, dando lugar a uma marca limpa, elegante com estilo "Sparkle" envolvida num círculo glassmorphic (Efeito Vidro).
  * Otimização de Interface: As telas de registro, login e senhas perdidas agora possuem animações fluídas e textos mais amigáveis, gerando um efeito "WOW" imediato.
  
🆕 NOVAS FUNCIONALIDADES (LOGIN & FINANCEIRO):
  * Registro Automático: Agora, no menu de login, é possível clicar em "Crie sua conta" e realizar um cadastro de administrador (SignUp) interligado ao painel do Supabase, destravando a função que estava inativa.
  * Autenticação via Google (OAuth): O botão de login via Google foi ativado para integração direta, agilizando acessos.
  * Controle Financeiro de Fornecedores: Foi introduzido o campo "Pago ao Fornecedor" manualmente na tela de edição do Pedido! O sistema agora armazena e lê essa saída de caixa permanentemente.

🛡️ SEGURANÇA E CRIPTOGRAFIA (INVIOLÁVEL):
  * Implementação da Base Criptográfica SHA-256 nativa via Web Crypto API (cryptoUtils.ts). Pronta para encriptar dados protegidos de integrações sem deixar rastros expostos no Frontend.

Novidades da Versão 26.0.0 — "Estabilidade Total de Persistência" (31/07/2026):
  * Mapeador Refatorado: O banco agora suporta ler até mesmo antigas strings JSON bugadas do passado (ex: Manga Curta Feminina) renderizando as grades intactas no frontend.

Novidades da Versão 25.9.0 — "Estabilidade e Fornecedor no Card" (31/07/2026):

✅ CORREÇÕES CRÍTICAS DE PERSISTÊNCIA:
  * Grade de Produto: Corrigido bug que impedia os tamanhos selecionados (P, M, G...) de serem salvos. O mapper do banco foi reescrito do zero para evitar conflitos de colunas.
  * Custo de Fornecedor: Corrigido bug que impedia o valor de custo cadastrado por fornecedor de ser salvo. O upsert com constraint incompleta foi substituído por lógica explícita de INSERT/UPDATE com validação de tenant.
  * Botão Salvar Produto: Corrigido problema onde o botão "Salvar Alterações" não acionava o envio do formulário por estar posicionado fora da tag <form>.
  * Auto-Healing Seguro: O mecanismo de compatibilidade com banco desatualizado foi corrigido para não mais sobrescrever a grade de tamanhos ao salvar extensões.

🆕 NOVA FUNCIONALIDADE — FORNECEDOR NO CARD:
  * Cada card de pedido agora exibe o nome do fornecedor vinculado aos itens.
  * Pedido com 1 fornecedor: exibe o nome completo (badge azul).
  * Pedido com múltiplos fornecedores: exibe a contagem (badge roxo).
  * Fallback: se apenas o fornecedor padrão do pedido estiver definido, ele também aparece.

🐛 CORREÇÕES GERAIS:
  * Lucro no card: A cor do lucro agora reflete o valor real (verde = lucro, vermelho = prejuízo), independente do status de pagamento.
  * Custo total do pedido (total_cost) agora é salvo e lido corretamente do banco, garantindo cálculo de lucro preciso nos cards.
  * Cálculo de receita na tela de Itens do Pedido: ao editar um pedido existente, o subtotal exibido agora respeita o preço original de cada item em vez de usar o preço do catálogo como substituto.

(25.8.2) Auto-Healing de Pedidos:
  * Novo Motor de Auto-Healing: reescrita do motor de salvamento de itens com polyfill JSON (__extensions).
  * Preços e Descontos: Eliminado bug que aplicava descontos sem autorização ao finalizar pedido.
  * Adicionais (Add-ons): corretamente salvos e carregados na edição.

(25.8.0) Personalização Avançada:
  * Add-ons na Peça: Cadastre adicionais como "Colocar Nome" ou "Número" e ative-os por produto.
  * Cobrança Inteligente: O valor dos Add-ons no pedido são somados em tempo real ao subtotal e repassados ao faturamento.
  * Kanban Dinâmico: A ficha do pedido de produção estampa a tag de adicionais escolhida ("Nome") facilitando muito a vida da Equipe de Arte.
  * Multi-Categorias no Filtro: A correção total do banco agora permite achar um produto independente de por qual de suas categorias cadastradas for pesquisada na lupa ou nos filtros laterais.

(25.7.0) Correções Gerais:
  * Exclusão Manual de Vendas no Financeiro para limpar testes irreais que sujariam a contabilidade.
  * Divisão visual da contagem de Estoque e Matéria-Prima no painel principal de Produtos.

(25.5.0) Financeiro Real:
  * Filtro de Período Dinâmico: Agora é possível selecionar o Mês e Ano para gerar relatórios reais em tempo real.
  * Fluxo de Caixa Real: O balanço abandonou as estimativas. Agora, exibimos Faturamento Bruto (soma de vendas), Receitas Realizadas (pagamentos recebidos no mês), Custo de Produção (custo de fornecedores e insumos) e Despesas Operacionais, resultando no Lucro Líquido exato.
  * Correção de Caixa: Solucionamos a falha silenciosa que impedia pagamentos recebidos na aba "Pedidos" de refletirem automaticamente no Financeiro.

(25.4.0) Múltiplos Fornecedores e Custos:
  * Múltiplos Fornecedores: Agora você pode escolher um fornecedor diferente para CADA item do seu pedido!
  * Margem Dinâmica: O sistema salva o custo interno de produção e separa o lucro de revenda.
  * Isolamento Total: As listas de fornecedores e produtos agora são blindadas por Tenant.

(25.3.1) Correção de Upload:
  * Inserido aviso visual de limite de tamanho de arquivo (50 MB) para o upload de artes.
  * Estrutura de banco de dados oficial configurada para receber arquivos com sucesso no Storage de produção.

(25.3.0) Carrinho e Personalização Dinâmica:
  * O cliente pode adicionar diversas unidades e inserir nomes e números separadamente.
  * Upload de Artes integrado no carrinho.
  * Módulo "Solicitações" totalmente removido, com migração direta para o Admin Loja.

(25.2.0) Evolution CRM Real:
  * Integração Real do Evolution API e correção da desconexão (Instâncias URL-Encoded).
  * Modificação do Changelog System para design mais limpo e elegante (Blur/Neon UX).

(25.1.0) Gestão de SaaS e Multi-Tenant:
  * Isolamento completo de dados por Tenant (RLS 100% ativado no Supabase).
  * Painel de Master Admin para gestão de Tenants e Inadimplência.
  * Credenciais de API (WhatsApp, Gemini) agora protegidas e isoladas por tenant.
  * Correção no catálogo público (Public Store) com roteamento via tenant URL.
  * Ajuste de Mockups visuais no Dashboard de Produtos para não causar confusão.

(25.0.2) 👗 LAYOUT 360 E TABELA DE MEDIDAS:
  * Otimizador de Imagens Client-Side: Redimensionamento automático de imagens pesadas antes do upload.
  * Novo Layout Carrossel 360º.
  * Tabela de Medidas Inteligente.

(25.0.1) 🚀 UPLOAD DE IMAGENS NA LOJA:
  * Adicionado suporte a Upload de Arquivos diretos para as imagens do Banner Hero
  * Upload de imagens agora integrado corretamente com o Supabase Storage (product-images)
  * Modals de Produto e Banner refletem a funcionalidade real de upload, permitindo armazenar arte e camisas de forma persistente.

(25.0.0) 🏪 LOJA GMZ PERFORMANCE:
  * Loja online completa com design premium dark/neon
  * Visualizador 360° interativo nos produtos e Hero Slider animado
  * Carrinho de orçamento + checkout via WhatsApp

(25.0.0) 🛠️ MÓDULO ADMIN DA LOJA:
  * CRUD completo de Produtos e Editor de Banners com preview ao vivo
  * Configurações completas e dashboard com gráficos

(25.0.0) 🔐 SEGURANÇA — MÓDULO DE CREDENCIAIS:
  * Remoção de chaves expostas e configuração centralizada de senhas de API (Supabase, OpenAI, MercadoPago, etc)

🗄️ BANCO DE DADOS:
  * Novas tabelas: gmz_store_products, gmz_store_banners, gmz_store_orders
  * Nova tabela: gmz_store_settings, order_audit_log
  * Índices de performance adicionados

👑 MASTER ADMIN:
  * admin@estamparia.com agora detectado corretamente via role='admin' no DB
  * Botão SAIR dissociado do avatar (evitar logout acidental)`;

// --- FABRIC TYPES ---
export const FABRICS: Fabric[] = [
  { id: 'f1', name: 'DRI FIT LISO', type: 'econômico', costPerMeter: 15.0, compatibility: 'Sublimação/Silk', leadTimeImpact: 0 },
  { id: 'f2', name: 'DRI FIT COLMEIA', type: 'técnico', costPerMeter: 20.0, compatibility: 'Sublimação', leadTimeImpact: 1 },
  { id: 'f3', name: 'DRI FIT FURADINHO', type: 'técnico', costPerMeter: 22.0, compatibility: 'Sublimação', leadTimeImpact: 1 },
  { id: 'f4', name: 'DRI FIT PONTO ARROZ', type: 'premium', costPerMeter: 25.0, compatibility: 'Sublimação', leadTimeImpact: 2 },
  { id: 'f5', name: 'HELANCA LIGHT', type: 'econômico', costPerMeter: 12.0, compatibility: 'Sublimação', leadTimeImpact: 0 },
  { id: 'f6', name: 'ENERGY', type: 'técnico', costPerMeter: 28.0, compatibility: 'Sublimação', leadTimeImpact: 1 },
  { id: 'f7', name: 'NBA', type: 'premium', costPerMeter: 35.0, compatibility: 'Sublimação', leadTimeImpact: 2 },
  { id: 'f8', name: 'ROGBY', type: 'premium', costPerMeter: 32.0, compatibility: 'Sublimação', leadTimeImpact: 2 },
  { id: 'f9', name: 'DRI FIT 3D', type: 'premium', costPerMeter: 28.0, compatibility: 'Sublimação', leadTimeImpact: 2 },
  { id: 'f10', name: 'MICROFIBRA', type: 'técnico', costPerMeter: 18.0, compatibility: 'Sublimação', leadTimeImpact: 0 }
];

export const GRADES: SizeGrade[] = [
  { label: 'Infantil', sizes: ['1', '2', '4', '6', '8', '10', '12', '14'] },
  { label: 'Masculino', sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'ESP1', 'ESP2'] },
  { label: 'Feminino', sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'ESP1', 'ESP2'] },
  { label: 'Unissex', sizes: ['UN'] },
  { label: 'Unidade', sizes: ['UN'] }
];

export const STATUS_CONFIG = {
  [OrderStatus.RECEIVED]: { label: 'Pedido Recebido', color: 'bg-[#0f172a] text-purple-400 border-purple-900/50' },
  [OrderStatus.IN_PRODUCTION]: { label: 'Em Produção', color: 'bg-[#0f172a] text-blue-400 border-blue-900/50' },
  [OrderStatus.SUBLIMATION]: { label: 'Sublimação', color: 'bg-[#0f172a] text-orange-400 border-orange-900/50' },
  [OrderStatus.FINALIZATION]: { label: 'Arte / Finalização', color: 'bg-[#0f172a] text-emerald-400 border-emerald-900/50' },
  [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-[#0f172a] text-emerald-500 border-emerald-500/50' },
  [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-rose-950/50 text-rose-400 border-rose-900/50' },
  // Store Flow
  [OrderStatus.STORE_REQUEST]: { label: 'Solicitação Nova', color: 'bg-pink-900/30 text-pink-400 border-pink-900/50' },
  [OrderStatus.STORE_CONFERENCE]: { label: 'Em Conferência', color: 'bg-violet-900/30 text-violet-400 border-violet-900/50' },
  [OrderStatus.STORE_CHECKED]: { label: 'Conferido (Aguardando Aprovação)', color: 'bg-teal-900/30 text-teal-400 border-teal-900/50' },
};

