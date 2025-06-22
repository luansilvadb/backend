import prisma from '../config/database';
import { CreateCustomerData, PaginationParams } from '../types';

export class CustomerService {
  static async createCustomer(data: CreateCustomerData, tenantId: string) {
    // Validação de unicidade de CPF/CNPJ
    if (data.cpf) {
      const existing = await prisma.customer.findFirst({
        where: {
          cpf: data.cpf,
          tenantId
        }
      });
      if (existing) {
        throw new Error('Já existe um cliente com este CPF');
      }
    }
    if (data.cnpj) {
      const existing = await prisma.customer.findFirst({
        where: {
          cnpj: data.cnpj,
          tenantId
        }
      });
      if (existing) {
        throw new Error('Já existe um cliente com este CNPJ');
      }
    }

    const customer = await prisma.customer.create({
      data: {
        ...data,
        tenantId
      }
    });

    return customer;
  }

  static async getCustomers(tenantId: string, params: PaginationParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { sales: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getCustomerById(id: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        _count: {
          select: { sales: true }
        }
      }
    });

    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    return customer;
  }

  static async updateCustomer(id: string, data: Partial<CreateCustomerData>, tenantId: string) {
    const existingCustomer = await prisma.customer.findFirst({
      where: { id, tenantId }
    });

    if (!existingCustomer) {
      throw new Error('Cliente não encontrado');
    }

    // Validação de unicidade de CPF/CNPJ (exceto para o próprio registro)
    if (data.cpf) {
      const existing = await prisma.customer.findFirst({
        where: {
          cpf: data.cpf,
          tenantId,
          NOT: { id }
        }
      });
      if (existing) {
        throw new Error('Já existe um cliente com este CPF');
      }
    }
    if (data.cnpj) {
      const existing = await prisma.customer.findFirst({
        where: {
          cnpj: data.cnpj,
          tenantId,
          NOT: { id }
        }
      });
      if (existing) {
        throw new Error('Já existe um cliente com este CNPJ');
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { sales: true }
        }
      }
    });

    return customer;
  }

  static async deleteCustomer(id: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { sales: true }
        }
      }
    });

    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    if (customer._count.sales > 0) {
      // Soft delete se houver vendas associadas
      await prisma.customer.update({
        where: { id },
        data: { isActive: false }
      });
    } else {
      // Hard delete se não houver vendas
      await prisma.customer.delete({
        where: { id }
      });
    }

    return { message: 'Cliente removido com sucesso' };
  }

  static async getCustomerSalesHistory(id: string, tenantId: string, params: PaginationParams = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const skip = (page - 1) * limit;

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId }
    });

    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: {
          customerId: id,
          tenantId
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.sale.count({
        where: {
          customerId: id,
          tenantId
        }
      })
    ]);

    return {
      customer,
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
