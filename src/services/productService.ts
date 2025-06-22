import prisma from '../config/database';
import { CreateProductData, PaginationParams } from '../types';

export class ProductService {
  static async createProduct(data: CreateProductData, tenantId: string) {
    // Verificar se a categoria existe e pertence ao tenant
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        tenantId
      }
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    // Verificar se o SKU já existe
    const existingSku = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        tenantId
      }
    });

    if (existingSku) {
      throw new Error('SKU já existe');
    }

    // Verificar se o código de barras já existe (se fornecido)
    if (data.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: {
          barcode: data.barcode,
          tenantId
        }
      });

      if (existingBarcode) {
        throw new Error('Código de barras já existe');
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        price: data.price,
        cost: data.cost,
        unit: data.unit || 'UNIT',
        categoryId: data.categoryId,
        tenantId
      },
      include: {
        category: true
      }
    });

    // Criar registro de estoque inicial
    await prisma.inventory.create({
      data: {
        productId: product.id,
        tenantId,
        quantity: data.initialStock || 0,
        minStock: data.minStock || 0,
        maxStock: data.maxStock
      }
    });

    return product;
  }

  static async getProducts(tenantId: string, params: PaginationParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      status,
      sortBy = 'name',
      sortOrder = 'asc'
    } = params;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      tenantId
    };

    // Filtro por status (ativo/inativo)
    if (status !== undefined) {
      where.isActive = status === 'active';
    } else {
      where.isActive = true; // Por padrão, mostrar apenas ativos
    }

    // Filtro por categoria
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filtro de busca
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            include: {
              parent: true,
              children: true
            }
          },
          inventory: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getProductById(id: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        category: {
          include: {
            parent: true,
            children: true
          }
        },
        inventory: true
      }
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    return product;
  }

  static async getProductBySku(sku: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: {
        sku,
        tenantId,
        isActive: true
      },
      include: {
        category: {
          include: {
            parent: true,
            children: true
          }
        },
        inventory: true
      }
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    return product;
  }

  static async getProductByBarcode(barcode: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: {
        barcode,
        tenantId,
        isActive: true
      },
      include: {
        category: {
          include: {
            parent: true,
            children: true
          }
        },
        inventory: true
      }
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    return product;
  }

  static async updateProduct(id: string, data: Partial<CreateProductData>, tenantId: string) {
    // Verificar se o produto existe
    const existingProduct = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!existingProduct) {
      throw new Error('Produto não encontrado');
    }

    // Verificar categoria se fornecida
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          tenantId
        }
      });

      if (!category) {
        throw new Error('Categoria não encontrada');
      }
    }

    // Verificar SKU se fornecido
    if (data.sku && data.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findFirst({
        where: {
          sku: data.sku,
          tenantId,
          id: { not: id }
        }
      });

      if (duplicateSku) {
        throw new Error('SKU já existe');
      }
    }

    // Verificar código de barras se fornecido
    if (data.barcode && data.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await prisma.product.findFirst({
        where: {
          barcode: data.barcode,
          tenantId,
          id: { not: id }
        }
      });

      if (duplicateBarcode) {
        throw new Error('Código de barras já existe');
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        price: data.price,
        cost: data.cost,
        unit: data.unit,
        categoryId: data.categoryId,
        isActive: data.isActive
      },
      include: {
        category: {
          include: {
            parent: true,
            children: true
          }
        },
        inventory: true
      }
    });

    return product;
  }

  static async deleteProduct(id: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    // Verificar se o produto tem vendas associadas
    const saleItems = await prisma.saleItem.findFirst({
      where: { productId: id }
    });

    if (saleItems) {
      // Se tem vendas, apenas inativar (soft delete)
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });
      return { message: 'Produto inativado com sucesso (preservando histórico de vendas)' };
    } else {
      // Se não tem vendas, pode excluir fisicamente
      await prisma.product.delete({
        where: { id }
      });
      return { message: 'Produto removido com sucesso' };
    }
  }

  static async reactivateProduct(id: string, tenantId: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: true }
    });

    return { message: 'Produto reativado com sucesso' };
  }

  static async getLowStockProducts(tenantId: string) {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        inventory: true
      }
    });

    // Filtrar produtos com estoque baixo
    const lowStockProducts = products.filter(
      (product) =>
        Array.isArray(product.inventory) &&
        product.inventory[0] &&
        typeof product.inventory[0].quantity === 'number' &&
        typeof product.inventory[0].minStock === 'number' &&
        product.inventory[0].quantity <= product.inventory[0].minStock
    );

    return lowStockProducts;
  }

  static async getProductUnits() {
    return [
      { value: 'UNIT', label: 'Unidade' },
      { value: 'KG', label: 'Quilograma' },
      { value: 'G', label: 'Grama' },
      { value: 'L', label: 'Litro' },
      { value: 'ML', label: 'Mililitro' },
      { value: 'M', label: 'Metro' },
      { value: 'CM', label: 'Centímetro' },
      { value: 'M2', label: 'Metro quadrado' },
      { value: 'M3', label: 'Metro cúbico' },
      { value: 'PACK', label: 'Pacote' },
      { value: 'BOX', label: 'Caixa' },
      { value: 'DOZEN', label: 'Dúzia' }
    ];
  }

  static async getProductsByCategory(categoryId: string, tenantId: string, includeSubcategories: boolean = false) {
    let categoryIds = [categoryId];

    if (includeSubcategories) {
      // Buscar subcategorias
      const subcategories = await prisma.category.findMany({
        where: {
          parentId: categoryId,
          tenantId,
          isActive: true
        }
      });
      categoryIds = [...categoryIds, ...subcategories.map(cat => cat.id)];
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        tenantId,
        isActive: true
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        inventory: true
      },
      orderBy: { name: 'asc' }
    });

    return products;
  }
}
