import { Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Gestão de estoque e movimentações
 */
export class InventoryController {
  static async getInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      const result = await InventoryService.getInventory(req.tenant!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      res.json({
        success: true,
        data: result.inventory,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getLowStockItems(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const items = await InventoryService.getLowStockItems(req.tenant!.id);
      res.json({
        success: true,
        data: items
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getInventoryReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await InventoryService.getInventoryReport(req.tenant!.id);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getInventoryByProductId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const inventory = await InventoryService.getInventoryByProductId(productId, req.tenant!.id);
      res.json({
        success: true,
        data: inventory
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async createInventoryMovement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const movement = await InventoryService.createInventoryMovement(
        req.body,
        req.user!.id,
        req.tenant!.id
      );
      res.status(201).json({
        success: true,
        data: movement,
        message: 'Movimentação registrada com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getInventoryMovements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, productId, type, startDate, endDate } = req.query;
      const filters = {
        productId: productId as string,
        type: type as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };
      const result = await InventoryService.getInventoryMovements(req.tenant!.id, filters, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({
        success: true,
        data: result.movements,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getProductMovementHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { page, limit } = req.query;
      const result = await InventoryService.getProductMovementHistory(productId, req.tenant!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({
        success: true,
        data: result.movements,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getStockAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, alertType, isRead, isResolved } = req.query;
      const filters = {
        alertType: alertType as any,
        isRead: isRead ? isRead === 'true' : undefined,
        isResolved: isResolved ? isResolved === 'true' : undefined
      };
      const result = await InventoryService.getStockAlerts(req.tenant!.id, filters, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({
        success: true,
        data: result.alerts,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async markAlertAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { alertId } = req.params;
      const alert = await InventoryService.markAlertAsRead(alertId, req.tenant!.id);
      res.json({
        success: true,
        data: alert,
        message: 'Alerta marcado como lido'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async resolveAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { alertId } = req.params;
      const alert = await InventoryService.resolveAlert(alertId, req.tenant!.id);
      res.json({
        success: true,
        data: alert,
        message: 'Alerta resolvido com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async monitorStockLevels(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.monitorStockLevels(req.tenant!.id);
      res.json({
        success: true,
        data: result,
        message: 'Monitoramento de estoque executado'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async updateInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const inventory = await InventoryService.updateInventory(productId, req.body, req.tenant!.id);
      res.json({
        success: true,
        data: inventory,
        message: 'Estoque atualizado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async adjustInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { adjustment, reason } = req.body;
      const inventory = await InventoryService.adjustInventory(
        productId,
        adjustment,
        req.tenant!.id,
        reason
      );
      res.json({
        success: true,
        data: inventory,
        message: 'Ajuste de estoque realizado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getInventoryMovementsReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, productId, type, userId } = req.query;
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        productId: productId as string,
        type: type as string,
        userId: userId as string
      };
      const report = await InventoryService.getInventoryMovementsReport(req.tenant!.id, filters);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      next(error);
    }
  }
}
