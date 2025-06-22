// Tipos do banco de dados baseados no schema Prisma
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CHECK';
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type ProductUnit = 'UNIT' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'M2' | 'M3' | 'PACK' | 'BOX' | 'DOZEN';

// NOVOS: Tipos para movimentações e alertas de estoque
export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'VENDA' | 'DEVOLUCAO' | 'PERDA' | 'TRANSFERENCIA';
export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'EXPIRED';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  cnpj?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  tenant?: Tenant;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  price: number;
  cost: number;
  unit: ProductUnit;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  categoryId: string;
  category?: Category;
  inventory?: Inventory[];
}

export interface Inventory {
  id: string;
  quantity: number;
  minStock: number;
  maxStock?: number | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  productId: string;
  product?: Product;
}

// NOVO: Interface para movimentações de estoque
export interface InventoryMovement {
  id: string;
  productId: string;
  quantity: number;
  type: MovementType;
  reason?: string | null;
  reference?: string | null;
  notes?: string | null;
  createdAt: Date;
  tenantId: string;
  userId: string;
  product?: Product;
  user?: User;
}

// NOVO: Interface para alertas de estoque
export interface StockAlert {
  id: string;
  productId: string;
  alertType: AlertType;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: Date | null;
  createdAt: Date;
  tenantId: string;
  product?: Product;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  discount: number;
  tax: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  userId: string;
  customerId?: string | null;
  user?: User;
  customer?: Customer;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  saleId: string;
  productId: string;
  sale?: Sale;
  product?: Product;
}
