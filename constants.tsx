import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 21.9 -> 22.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '26.5.0';
export const APP_NAME = 'Gomesz Speed Print';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 26.5.0 — "Checkout, Relatórios e UX da Loja Pública" (02/08/2026):

🏪 LOJA PÚBLICA (CHECKOUT & UX):
  * Múltiplos Arquivos de Arte: Clientes agora podem enviar múltiplas imagens/arquivos no checkout da Loja Pública (URLs agrupadas por " ||| ").
  * Observações Adicionais: Novo campo no checkout para informações soltas.
  * Personalização Agrupada por Tamanho: UX da grid de personalização reescrita! Agora as linhas para digitação de nomes e números respeitam e filtram-se automaticamente ao tamanho selecionado (ex: clicar no tamanho M revela apenas a listagem e contagem do tamanho M). Fim das linhas infinitas.
  * Validação de Pedido Mínimo: Implementado agrupamento por modelo (Product ID). Se o total de peças selecionadas de um mesmo modelo for menor que 10 peças (não importando os tamanhos), o sistema exibe um alerta âmbar informando a validação de quantidade da estamparia.
  * Botão de Tamanho: Fundo corrigido para não ficar camuflado ao clique no modo Dark/Light.

🔐 SEGURANÇA DE ARQUIVOS (PROXY INLINE):
  * O link das imagens renderizadas na loja pública (quando o cliente submete arquivo) agora passa pela rota '/api/arte?file='. Isso oculta o bucket e faz leitura com 'Content-Disposition: inline', não baixando mais os PDFs/Imagens e permitindo preview nativo!

🗄️ MÓDULO FINANCEIRO (RELATÓRIOS E PREVENÇÃO DE DUPLICAÇÃO):
  * Correção Crítica (Idempotência): PDV e Módulo de Pedidos agora passam o ID do pedido ('orderId') ao registrar uma nova transação financeira de pagamento. Se ela já existir no banco, ele ignora (impede a duplicação).
  * Relatório DRE Impresso A4 (Novo!): Adicionado botão 'Imprimir' na aba Financeiro! Gera na tela um documento corporativo A4 clean com Cabeçalho/Logo, 4 KPIs (Faturamento, Despesas, Líquido e Margem), seguido de uma tabela Striped com todas as transações, limpo de assinaturas ou saldos devedores - feito 100% via JS injetado para compatibilidade com o browser.

✅ DESIGN & ESTÉTICA FRONTEND (LOGIN PREMIUM):
  * Logo Remodelada: A arte abstrata antiga foi totalmente removida, dando lugar a uma marca limpa, elegante com estilo "Sparkle" envolvida num círculo glassmorphic (Efeito Vidro).
  * Otimização de Interface: As telas de registro, login e senhas perdidas agora possuem animações fluídas e textos mais amigáveis, gerando um efeito "WOW" imediato.
  
🆕 NOVAS FUNCIONALIDADES (LOGIN & FINANCEIRO):
  * Registro Automático: Agora, no menu de login, é possível clicar em "Crie sua conta" e realizar um cadastro de administrador (SignUp) interligado ao painel do Supabase, destravando a função que estava inativa.
  * Autenticação via Google (OAuth): O botão de login via Google foi ativado para integração direta, agilizando acessos.
  * Controle Financeiro de Fornecedores: Foi introduzido o campo "Pago ao Fornecedor" manualmente na tela de edição do Pedido! O sistema agora armazena e lê essa saída de caixa permanentemente.

🛡️ SEGURANÇA E CRIPTOGRAFIA (INVIOLÁVEL):
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
  * Cálculo de receita na tela de Itens do Pedido: ao editar um pedido existente, o subtotal exibido agora respeita o preço original de cada item em vez de usar o preço do catálogo como substituto.`;

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

