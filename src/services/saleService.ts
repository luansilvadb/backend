import prisma from '../config/database';
import { CreateSaleData, PaginationParams } from '../types';
import { Prisma } from '@prisma/client';

export class SaleService {
  static async createSale(data: CreateSaleData, userId: string, tenantId: string) {
    // Corrigido: nested create para items
    const sale = await prisma.sale.create({
      data: {
        userId,
        tenantId,
        status: 'COMPLETED',
        saleNumber: Date.now().toString(),
        total: data.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
        discount: data.discount || 0,
        tax: data.tax || 0,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        customerId: data.customerId,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity
          }))
        }
      },
      include: {
        items: true,
        customer: true,
        user: true
      }
    });
    return sale;
  }

  static async getSales(tenantId: string, params: PaginationParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId
    };

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: true,
          customer: true,
          user: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.sale.count({ where })
    ]);

    return {
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getSaleById(id: string, tenantId: string) {
    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        customer: true,
        user: true
      }
    });
    if (!sale) throw new Error('Venda não encontrada');
    return sale;
  }

  static async cancelSale(id: string, tenantId: string) {
    // Exemplo simplificado: ajuste conforme sua lógica real
    const sale = await prisma.sale.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: true,
        customer: true,
        user: true
      }
    });
    return sale;
  }

  static async refundSale(id: string, items: any[], reason: string, tenantId: string, userId: string) {
    // Exemplo simplificado: ajuste conforme sua lógica real
    // Aqui você pode implementar lógica de estorno parcial
    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        customer: true,
        user: true
      }
    });
    if (!sale) throw new Error('Venda não encontrada');
    // Lógica de estorno real deve ser implementada aqui
    return sale;
  }

  // ... relatórios já implementados ...
  static async getSalesReport(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      productId?: string;
      categoryId?: string;
      paymentMethod?: string;
    } = {}
  ) {
    // ... implementação já existente ...
    // (copie o método já implementado anteriormente)
    return {};
  }

  static async getTopProductsReport(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
      orderBy?: 'quantity' | 'revenue';
    } = {}
  ) {
    // ... implementação já existente ...
    // (copie o método já implementado anteriormente)
    return {};
  }
}
