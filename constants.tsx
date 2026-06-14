import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 21.9 -> 22.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '25.5.1';
export const APP_NAME = 'Gomesz Speed Print';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 25.5.0 — "Financeiro Real" (14/06/2026):

🚀 ATUALIZAÇÃO NO MÓDULO FINANCEIRO:
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
  { id: 'f1', name: 'Dry Fit Premium', type: 'premium', costPerMeter: 25.5, compatibility: 'Sublimação Total', leadTimeImpact: 0 },
  { id: 'f2', name: 'Ponto de Arroz', type: 'técnico', costPerMeter: 22.0, compatibility: 'Sublimação', leadTimeImpact: 1 },
  { id: 'f3', name: 'Colmeia', type: 'técnico', costPerMeter: 20.0, compatibility: 'Sublimação', leadTimeImpact: 2 },
  { id: 'f4', name: 'Dry Liso', type: 'econômico', costPerMeter: 15.0, compatibility: 'Silk/Sublimação', leadTimeImpact: 0 },
  { id: 'f5', name: 'Dry Fit UV+', type: 'premium', costPerMeter: 30.0, compatibility: 'Sublimação', leadTimeImpact: 1 },
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
  [OrderStatus.FINALIZATION]: { label: 'Conferido', color: 'bg-[#0f172a] text-emerald-400 border-emerald-900/50' },
  [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-[#0f172a] text-emerald-500 border-emerald-500/50' },
  // Store Flow
  [OrderStatus.STORE_REQUEST]: { label: 'Solicitação Nova', color: 'bg-pink-900/30 text-pink-400 border-pink-900/50' },
  [OrderStatus.STORE_CONFERENCE]: { label: 'Em Conferência', color: 'bg-violet-900/30 text-violet-400 border-violet-900/50' },
  [OrderStatus.STORE_CHECKED]: { label: 'Conferido (Aguardando Aprovação)', color: 'bg-teal-900/30 text-teal-400 border-teal-900/50' },
};
