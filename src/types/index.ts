import { Request } from 'express';
import { User, Tenant, UserRole, PaymentMethod, ProductUnit, MovementType, AlertType } from './database';

export interface AuthenticatedRequest extends Request {
  user?: User;
  tenant?: Tenant;
  sessionId?: string;
  ownershipFilter?: { userId: string };
}

// Re-exportar tipos do database para facilitar importação
export { User, Tenant, UserRole, PaymentMethod, ProductUnit, MovementType, AlertType } from './database';

export interface CreateTenantData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  cnpj?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER' | 'CASHIER';
}

export interface LoginData {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  unit?: ProductUnit;
  categoryId: string;
  initialStock?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
}

export interface CreateSaleData {
  customerId?: string;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CHECK';
  discount?: number;
  tax?: number;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateInventoryData {
  quantity: number;
  minStock?: number;
  maxStock?: number;
}

// NOVOS: Interfaces para movimentações de estoque
export interface CreateInventoryMovementData {
  productId: string;
  quantity: number;
  type: MovementType;
  reason?: string;
  reference?: string;
  notes?: string;
}

export interface InventoryMovementFilters {
  productId?: string;
  type?: MovementType;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

// NOVOS: Interfaces para alertas de estoque
export interface CreateStockAlertData {
  productId: string;
  alertType: AlertType;
  message: string;
}

export interface StockAlertFilters {
  productId?: string;
  alertType?: AlertType;
  isRead?: boolean;
  isResolved?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
