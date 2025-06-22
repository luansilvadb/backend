import { Response, NextFunction } from 'express';
import { SaleService } from '../services/saleService';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sistema de vendas
 */
export class SaleController {
  /**
   * @swagger
   * /api/sales:
   *   post:
   *     summary: Criar nova venda
   *     description: Processa uma nova venda com controle automático de estoque
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateSaleRequest'
   *     responses:
   *       201:
   *         description: Venda criada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Venda realizada com sucesso"
   *       400:
   *         description: Dados inválidos ou estoque insuficiente
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  static async createSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sale = await SaleService.createSale(req.body, req.user!.id, req.tenant!.id);
      res.status(201).json({
        success: true,
        data: sale,
        message: 'Venda realizada com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/sales:
   *   get:
   *     summary: Listar vendas
   *     description: Retorna lista paginada de vendas com filtros por cliente, período, número, etc.
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número da página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Itens por página
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Buscar por número da venda, nome do cliente ou vendedor
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           default: createdAt
   *         description: Campo para ordenação
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Ordem da classificação
   *     responses:
   *       200:
   *         description: Lista de vendas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Sale'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getSales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      const result = await SaleService.getSales(req.tenant!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      res.json({
        success: true,
        data: result.sales,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/sales/{id}:
   *   get:
   *     summary: Detalhar venda
   *     description: Retorna todos os dados de uma venda específica
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID da venda
   *     responses:
   *       200:
   *         description: Venda encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Venda não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  static async getSaleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sale = await SaleService.getSaleById(id, req.tenant!.id);
      res.json({
        success: true,
        data: sale
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/sales/{id}/cancel:
   *   patch:
   *     summary: Cancelar venda
   *     description: Cancela uma venda e reverte o estoque dos produtos vendidos
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID da venda
   *     responses:
   *       200:
   *         description: Venda cancelada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Venda cancelada com sucesso"
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Venda não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  static async cancelSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sale = await SaleService.cancelSale(id, req.tenant!.id);
      res.json({
        success: true,
        data: sale,
        message: 'Venda cancelada com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/sales/{id}/refund:
   *   patch:
   *     summary: Estorno parcial de venda
   *     description: Permite estornar parte dos itens de uma venda, revertendo o estoque e acionando reembolso se aplicável.
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID da venda
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [items]
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required: [productId, quantity]
   *                   properties:
   *                     productId:
   *                       type: string
   *                       format: uuid
   *                     quantity:
   *                       type: integer
   *                       minimum: 1
   *               reason:
   *                 type: string
   *                 example: "Cliente devolveu parte dos produtos"
   *     responses:
   *       200:
   *         description: Estorno realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Sale'
   *                 message:
   *                   type: string
   *                   example: "Estorno parcial realizado com sucesso"
   *       400:
   *         description: Dados inválidos ou quantidade a estornar maior que vendida
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Venda não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  static async refundSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { items, reason } = req.body;
      const sale = await SaleService.refundSale(id, items, reason, req.tenant!.id, req.user!.id);
      res.json({
        success: true,
        data: sale,
        message: 'Estorno parcial realizado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/sales/reports:
   *   get:
   *     summary: Relatório de vendas
   *     description: Retorna relatório de vendas por período, produtos mais vendidos, totais, etc.
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data inicial (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data final (YYYY-MM-DD)
   *       - in: query
   *         name: productId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar por produto
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar por categoria
   *       - in: query
   *         name: paymentMethod
   *         schema:
   *           type: string
   *           enum: [CASH, CREDIT_CARD, DEBIT_CARD, PIX, CHECK]
   *         description: Filtrar por forma de pagamento
   *     responses:
   *       200:
   *         description: Relatório de vendas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SalesReportResponse'
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getSalesReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, productId, categoryId, paymentMethod } = req.query;
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        productId: productId as string,
        categoryId: categoryId as string,
        paymentMethod: paymentMethod as string
      };
      const report = await SaleService.getSalesReport(req.tenant!.id, filters);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/sales/reports/top-products:
   *   get:
   *     summary: Produtos mais vendidos
   *     description: Retorna os produtos mais vendidos em um período, com filtros por categoria e ordenação
   *     tags: [Sales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data inicial (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data final (YYYY-MM-DD)
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar por categoria
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [quantity, revenue]
   *           default: quantity
   *         description: Ordenar por quantidade ou valor total
   *     responses:
   *       200:
   *         description: Lista de produtos mais vendidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TopProductsReportResponse'
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getTopProductsReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, categoryId, orderBy } = req.query;
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        categoryId: categoryId as string,
        orderBy: orderBy as 'quantity' | 'revenue'
      };
      const report = await SaleService.getTopProductsReport(req.tenant!.id, filters);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      next(error);
    }
  }
}
