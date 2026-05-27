import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 21.9 -> 22.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '25.0.0';
export const APP_NAME = 'Gomesz Speed Print';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 25.0.0 — "World-Class Release" (27/05/2026):

🚀 PERFORMANCE & ARQUITETURA:
  * Keep-Alive Navigation: troca entre telas agora é INSTANTÂNEA (0ms) via ViewPanel CSS
  * AuthContext reescrito do zero — elimina AbortError e dupla chamada getUser()
  * Proteção contra loop de login infinito removida

🏪 LOJA GMZ PERFORMANCE (NOVO):
  * Loja online completa com design premium dark/neon
  * Hero Slider animado com 4 slides e auto-rotação
  * Visualizador 360° interativo nos produtos (drag-to-rotate)
  * Carrinho de orçamento + checkout via WhatsApp
  * Ticker animado, seção de stats, coleções, features, FAQ, footer

🛠️ MÓDULO ADMIN DA LOJA (NOVO):
  * Dashboard com gráficos de receita e pedidos (Recharts)
  * CRUD completo de Produtos com viewer 360°, upload de imagem, badge, features
  * Editor de Banners com preview em tempo real
  * Gerenciamento de Pedidos com filtros e atualização de status
  * Editor Visual da loja com preview ao vivo
  * Configurações completas da loja

🔐 SEGURANÇA — MÓDULO DE CREDENCIAIS (NOVO):
  * Credenciais e API Keys gerenciadas via banco de dados (criptografado)
  * Remoção de chaves expostas hardcoded no código-fonte
  * Painel de Credenciais em Ajustes para configuração centralizada
  * Suporte a: Supabase, WhatsApp API, Google AI, OpenAI, SMTP, MercadoPago

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
  [OrderStatus.RECEIVED]: { label: 'Aguardando', color: 'bg-[#0f172a] text-purple-400 border-purple-900/50' },
  [OrderStatus.IN_PRODUCTION]: { label: 'Em Produção', color: 'bg-[#0f172a] text-blue-400 border-blue-900/50' },
  [OrderStatus.SUBLIMATION]: { label: 'Sublimação', color: 'bg-[#0f172a] text-orange-400 border-orange-900/50' },
  [OrderStatus.FINALIZATION]: { label: 'Finalização', color: 'bg-[#0f172a] text-emerald-400 border-emerald-900/50' },
  [OrderStatus.FINISHED]: { label: 'Concluídos Hoje', color: 'bg-[#0f172a] text-emerald-500 border-emerald-500/50' },
  // Store Flow
  [OrderStatus.STORE_REQUEST]: { label: 'Solicitação Nova', color: 'bg-pink-900/30 text-pink-400 border-pink-900/50' },
  [OrderStatus.STORE_CONFERENCE]: { label: 'Em Conferência', color: 'bg-violet-900/30 text-violet-400 border-violet-900/50' },
  [OrderStatus.STORE_CHECKED]: { label: 'Conferido (Aguardando Aprovação)', color: 'bg-teal-900/30 text-teal-400 border-teal-900/50' },
};
