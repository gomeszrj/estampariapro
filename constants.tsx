
import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 17.9 -> 18.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '21.1';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 21.1 (Sistema de Permissões e Módulos):
- Controle Granular de Módulos (RBAC): O Admin Master agora pode escolher exatamente quais telas (Módulos) cada empresa assinante pode ver e usar (Ex: habilitar Estoque só para plano Pro).
- Ocultamento Seguro de IAS: Extrator de Pedidos com Inteligência Artificial e a janela de configuração de API Keys foram ocultados permanentemente dos assinantes. Agora, somente o Admin Master tem acesso a essa tecnologia central.
- Autopreenchimento de Permissões: Adicionado botão "Aplicar Padrão do Plano" ao registrar assinantes, que marca/desmarca sozinho os recursos que o cliente terá direito conforme o pacote contratado.
- Header Limpo: Assinantes agora veem sua própria tag "Administrador" e o ícone de configurações de robô não fica mais visível para eles.`;

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
