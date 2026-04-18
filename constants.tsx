
import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .9, increment major version (e.g., 17.9 -> 18.0)
// --- SYSTEM CONFIG ---
export const SYSTEM_VERSION = '20.9';
export const LATEST_RELEASE_NOTES = `Novidades da Versão 20.9 (Storage & Security Update):
- Upload de Arquivos Corrigido: Criação do bucket de storage e mapeamento de MIME types para .psd, .cdr, .rar, .ai, .7z etc.
- Tratamento de Erro Inteligente: Mensagens detalhadas por arquivo em caso de falha no upload (nome, tamanho, motivo).
- OS de Produção Otimizada: Imagens em grid 3 por linha, sem duplicatas, com deduplicação automática de URLs.
- Checklist de Produção Restaurado: Finalização, Impressão, Estampa, Separação, Costura e Conferência na OS.
- Gestão de Senhas SaaS: Master Admin pode redefinir senhas de acesso dos administradores de cada inquilino.
- Segurança Reforçada: Função segura no banco de dados para reset de senhas com criptografia bcrypt.`;

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
