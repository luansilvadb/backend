import prisma from '../config/database';
import { CreateCategoryData, PaginationParams } from '../types';

export class CategoryService {
  static async createCategory(data: CreateCategoryData, tenantId: string) {
    // Verificar se categoria pai existe (se fornecida)
    if (data.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: data.parentId,
          tenantId,
          isActive: true
        }
      });

      if (!parentCategory) {
        throw new Error('Categoria pai não encontrada');
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        tenantId
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true }
        }
      }
    });

    return category;
  }

  static async getCategories(tenantId: string, params: PaginationParams = {}) {
    const {
      page = 1,
      limit = 50,
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
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            include: {
              _count: {
                select: { products: true }
              }
            }
          },
          _count: {
            select: { products: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.category.count({ where })
    ]);

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getCategoriesHierarchy(tenantId: string) {
    // Buscar apenas categorias raiz (sem pai)
    const rootCategories = await prisma.category.findMany({
      where: {
        tenantId,
        isActive: true,
        parentId: null
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { products: true }
                }
              }
            },
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return rootCategories;
  }

  static async getCategoryById(id: string, tenantId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { products: true }
            }
          }
        },
        products: {
          where: { isActive: true },
          include: {
            inventory: true
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    return category;
  }

  static async updateCategory(id: string, data: Partial<CreateCategoryData>, tenantId: string) {
    const existingCategory = await prisma.category.findFirst({
      where: { id, tenantId }
    });

    if (!existingCategory) {
      throw new Error('Categoria não encontrada');
    }

    // Verificar se categoria pai existe (se fornecida)
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error('Uma categoria não pode ser pai de si mesma');
      }

      const parentCategory = await prisma.category.findFirst({
        where: {
          id: data.parentId,
          tenantId,
          isActive: true
        }
      });

      if (!parentCategory) {
        throw new Error('Categoria pai não encontrada');
      }

      // Verificar se não criaria um loop (categoria pai não pode ser filha)
      const isDescendant = await this.isDescendant(data.parentId, id, tenantId);
      if (isDescendant) {
        throw new Error('Não é possível criar uma hierarquia circular');
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    return category;
  }

  static async deleteCategory(id: string, tenantId: string) {
    const category = await prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        children: {
          where: { isActive: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (category._count.products > 0) {
      throw new Error('Não é possível excluir categoria com produtos associados');
    }

    if (category.children && category.children.length > 0) {
      throw new Error('Não é possível excluir categoria que possui subcategorias');
    }

    await prisma.category.update({
      where: { id },
      data: { isActive: false }
    });

    return { message: 'Categoria removida com sucesso' };
  }

  static async getSubcategories(parentId: string, tenantId: string) {
    const subcategories = await prisma.category.findMany({
      where: {
        parentId,
        tenantId,
        isActive: true
      },
      include: {
        children: {
          where: { isActive: true }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return subcategories;
  }

  static async getRootCategories(tenantId: string) {
    const rootCategories = await prisma.category.findMany({
      where: {
        tenantId,
        isActive: true,
        parentId: null
      },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return rootCategories;
  }

  // Método auxiliar para verificar se uma categoria é descendente de outra
  private static async isDescendant(ancestorId: string, descendantId: string, tenantId: string): Promise<boolean> {
    const ancestor = await prisma.category.findFirst({
      where: {
        id: ancestorId,
        tenantId
      },
      include: {
        parent: true
      }
    });

    if (!ancestor || !ancestor.parent) {
      return false;
    }

    if (ancestor.parent.id === descendantId) {
      return true;
    }

    return this.isDescendant(ancestor.parent.id, descendantId, tenantId);
  }

  static async getCategoryPath(categoryId: string, tenantId: string): Promise<string[]> {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId
      },
      include: {
        parent: true
      }
    });

    if (!category) {
      return [];
    }

    const path = [category.name];

    if (category.parent) {
      const parentPath = await this.getCategoryPath(category.parent.id, tenantId);
      return [...parentPath, ...path];
    }

    return path;
  }
}
