
export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  FINALIZATION = 'FINALIZATION',
  IN_PRODUCTION = 'IN_PRODUCTION',
  FINISHED = 'FINISHED'
}

export enum OrderType {
  SALE = 'SALE',
  BUDGET = 'BUDGET'
}

export type FabricType = 'premium' | 'técnico' | 'econômico';

export interface Fabric {
  id: string;
  name: string;
  type: FabricType;
  costPerMeter: number;
  compatibility: string;
  leadTimeImpact: number;
}

export interface SizeGrade {
  label: string;
  sizes: string[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  fabricId: string;
  fabricName: string;
  gradeLabel: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  status: OrderStatus;
  orderType: OrderType;
  items: OrderItem[];
  totalValue: number;
  createdAt: string;
  deliveryDate: string;
  notes?: string;
  internalNotes?: string;
  delayReason?: string;
  fiscalKey?: string; // Simulated NFe Access Key
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  imageUrl: string;
  basePrice: number;
  description?: string; // New: Commercial description
  allowedGrades?: Record<string, string[]>; // New: e.g. { 'Masculino': ['P', 'M'], 'Infantil': ['10', '12'] }
}

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  document?: string; // CPF or CNPJ
  address?: string;
}
