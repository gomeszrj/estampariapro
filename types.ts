
export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  FINALIZATION = 'FINALIZATION',
  IN_PRODUCTION = 'IN_PRODUCTION',
  FINISHED = 'FINISHED',
  // Loja Virtual Flow
  STORE_REQUEST = 'STORE_REQUEST',       // Solicitação recebida
  STORE_CONFERENCE = 'STORE_CONFERENCE', // Em conferência
  STORE_CHECKED = 'STORE_CHECKED'        // Pedido conferido (Ready for Sales Approval)
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
  notes?: string;
}



export enum PaymentStatus {
  FULL = 'Integral (100%)',
  HALF = 'Sinal (50%)',
  DEPOSIT = 'Sinal / Parcial', // Custom amount
  PENDING = 'Pendente'
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  origin?: 'manual' | 'store'; // New: Origin of the order
  orderType: OrderType;
  items: OrderItem[];
  totalValue: number;
  amountPaid?: number; // New: Custom partial payment amount
  createdAt: string;
  deliveryDate: string;
  notes?: string;
  internalNotes?: string;
  delayReason?: string;
  fiscalKey?: string; // Simulated NFe Access Key
  clientTeam?: string; // Turma/Time (from Store)
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
  costPrice?: number; // New: Cost Price for Profit Calculation
  description?: string; // Commercial description
  allowedGrades?: Record<string, string[]>;
  measurements?: Record<string, { height: string; width: string }>; // New: Size measurements e.g. { 'P': { height: '70', width: '50' } }
  published?: boolean; // Controls visibility in Public Store
}

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  document?: string; // CPF or CNPJ
  address?: string;
  password?: string; // Client Portal Access
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender: 'client' | 'store';
  message: string;
  created_at: string;
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
  clientTeam?: string; // UI Only
  clientPhone: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  items: CatalogOrderItem[];
  totalEstimated: number;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Fabric' | 'Ink' | 'Screen' | 'Other';
  quantity: number;
  unit: string;
  minLevel: number;
}

export interface ProductRecipe {
  id: string;
  productId: string;
  inventoryItemId: string;
  inventoryItemName?: string; // For UI display
  quantityRequired: number;
  unit?: string; // For UI display
}


export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'sale' | 'material' | 'rent' | 'utility' | 'salary' | 'other';
  amount: number;
  description: string;
  date: string;
  orderId?: string; // Optional link to an Order
  createdAt: string;
}
