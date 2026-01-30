
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



export enum PaymentStatus {
  FULL = 'Integral (100%)',
  HALF = 'Sinal (50%)',
  PENDING = 'Pendente'
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
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
  backImageUrl?: string; // New: Back side image
  basePrice: number;
  description?: string; // Commercial description
  allowedGrades?: Record<string, string[]>;
  measurements?: Record<string, { height: number; width: number }>; // New: Size measurements e.g. { 'P': { height: 70, width: 50 } }
}

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  document?: string; // CPF or CNPJ
  address?: string;
}

export enum UserRole {
  SALES = 'Vendedor',
  SALES_MANAGER = 'Gerente de Venda',
  DESIGNER_CREATIVE = 'Designer Criativo',
  DESIGNER_FINAL = 'Designer Finalização',
  PRODUCTION_OPERATOR = 'Operador Produção',
  PRODUCTION_MANAGER = 'Gerente de Produção'
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
  email?: string;
  createdAt?: string;
}

export interface CatalogOrderItem {
  productId: string;
  productName: string;
  size: string; // e.g., "P", "M", "G"
  quantity: number;
  notes?: string;
  imageUrl?: string;
}

export interface CatalogOrder {
  id: string;
  clientId: string; // Link to Client
  clientName: string;
  clientPhone: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  items: CatalogOrderItem[];
  totalEstimated: number;
}

