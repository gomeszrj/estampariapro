import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 17.9 -> 18.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '21.8.8';
export const APP_NAME = 'Gomesz Speed Print';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 21.8.8 (Novo Módulo de Produtos):
- Transformação arquitetural para o formato Master-Detail no Catálogo:
  * 5 novos Cards de KPI no topo (Total, Ativos, Em Produção, Desativados, Estoque).
  * Painel Lateral Direto (Sidebar) para inspeção rápida de qualquer produto sem precisar abrir modal.
  * Abas internas na Sidebar (Detalhes, Variações, Estoque e Histórico).
  * Filtros organizados numa nova barra de ferramentas centralizada.
  * O design escuro (#151B2B) consolida o tema Premium GMZ Performance.`;

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
