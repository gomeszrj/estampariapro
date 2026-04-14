
import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 17.9 -> 18.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '20.2';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 20.2 (SaaS Security & Smart CloudBot):
- Blindagem SaaS (RLS) Finalizada: Isolamento total de dados por Inquilino (Tenant). Usuários comuns só enxergam seus próprios dados.
- Escudo Master Admin: O e-mail admin@estamparia.com agora possui acesso global de auditoria nativo no banco de dados.
- CloudBot Inteligente: Adicionado mapeamento automático de idade para tamanho (Ex: 2 anos -> Tamanho 2).
- Análise de Listas: O robô agora gera uma tabela de conferência e pede autorização antes de formalizar pedidos.`;

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
  [OrderStatus.RECEIVED]: { label: 'Recebido / Separando', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  [OrderStatus.FINALIZATION]: { label: 'Em Arte / Aprovação', color: 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50' },
  [OrderStatus.IN_PRODUCTION]: { label: 'Em Produção', color: 'bg-amber-900/30 text-amber-400 border-amber-900/50' },
  [OrderStatus.FINISHED]: { label: 'Pronto / Entregue', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' },
  // Store Flow
  [OrderStatus.STORE_REQUEST]: { label: 'Solicitação Nova', color: 'bg-pink-900/30 text-pink-400 border-pink-900/50' },
  [OrderStatus.STORE_CONFERENCE]: { label: 'Em Conferência', color: 'bg-violet-900/30 text-violet-400 border-violet-900/50' },
  [OrderStatus.STORE_CHECKED]: { label: 'Conferido (Aguardando Aprovação)', color: 'bg-teal-900/30 text-teal-400 border-teal-900/50' },
};
