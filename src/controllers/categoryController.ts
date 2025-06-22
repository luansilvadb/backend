import { Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService';
import { AuthenticatedRequest } from '../types';

export class CategoryController {
  static async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.body, req.tenant!.id);
      
      res.status(201).json({
        success: true,
        data: category,
        message: 'Categoria criada com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const result = await CategoryService.getCategories(req.tenant!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      
      res.json({
        success: true,
        data: result.categories,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id, req.tenant!.id);
      
      res.json({
        success: true,
        data: category
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body, req.tenant!.id);
      
      res.json({
        success: true,
        data: category,
        message: 'Categoria atualizada com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CategoryService.deleteCategory(id, req.tenant!.id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }
}