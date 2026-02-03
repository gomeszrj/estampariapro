
import { Fabric, SizeGrade, OrderStatus } from './types';
import React from 'react';

// Versioning Rule: Minor versions go 0-9. When reaching .10, increment major version (e.g., 2.9 -> 3.0)
export const SYSTEM_VERSION = '14.4';

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
  { label: 'Unissex', sizes: ['UN'] }
];

export const STATUS_CONFIG = {
  [OrderStatus.RECEIVED]: { label: 'Recebido', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  [OrderStatus.FINALIZATION]: { label: 'Organização de Arquivos', color: 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50' },
  [OrderStatus.IN_PRODUCTION]: { label: 'Produção', color: 'bg-amber-900/30 text-amber-400 border-amber-900/50' },
  [OrderStatus.FINISHED]: { label: 'Finalizado', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' },
};
