import { Product, Inventory, Category, Sale, SaleItem } from './database';

// Tipos específicos para operações com Prisma
export interface InventoryWithProduct extends Inventory {
  product: Product & {
    category: Category;
  };
}

export interface ProductWithInventory extends Product {
  inventory?: Inventory[];
  category?: Category;
}

export interface SaleWithItems extends Omit<Sale, 'user' | 'customer'> {
  items: (SaleItem & {
    product: Product;
  })[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
  customer?: {
    id: string;
    name: string;
    email?: string | null;
  };
}