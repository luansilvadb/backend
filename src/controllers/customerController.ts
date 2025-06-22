import { Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Gestão de clientes
 */
export class CustomerController {
  /**
   * @swagger
   * /api/customers:
   *   post:
   *     summary: Criar cliente
   *     description: Cria um novo cliente no sistema
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCustomerRequest'
   *     responses:
   *       201:
   *         description: Cliente criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Customer'
   *                 message:
   *                   type: string
   *                   example: Cliente criado com sucesso
   *       400:
   *         description: Dados inválidos ou CPF/CNPJ já cadastrado
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  static async createCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.createCustomer(req.body, req.tenant!.id);
      
      res.status(201).json({
        success: true,
        data: customer,
        message: 'Cliente criado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/customers:
   *   get:
   *     summary: Listar clientes
   *     description: Retorna lista paginada de clientes do tenant
   *     tags: [Customers]
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
   *         description: Buscar por nome, e-mail, telefone, CPF ou CNPJ
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           default: name
   *         description: Campo para ordenação
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *         description: Ordem da classificação
   *     responses:
   *       200:
   *         description: Lista de clientes
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
   *                     $ref: '#/components/schemas/Customer'
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
  static async getCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const result = await CustomerService.getCustomers(req.tenant!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      
      res.json({
        success: true,
        data: result.customers,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/customers/{id}:
   *   get:
   *     summary: Detalhar cliente
   *     description: Retorna todos os dados de um cliente específico
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do cliente
   *     responses:
   *       200:
   *         description: Cliente encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Customer'
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getCustomerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await CustomerService.getCustomerById(id, req.tenant!.id);
      
      res.json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/customers/{id}:
   *   put:
   *     summary: Atualizar cliente
   *     description: Atualiza dados de um cliente existente
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do cliente
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateCustomerRequest'
   *     responses:
   *       200:
   *         description: Cliente atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Customer'
   *                 message:
   *                   type: string
   *                   example: Cliente atualizado com sucesso
   *       400:
   *         description: Dados inválidos ou CPF/CNPJ já cadastrado
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async updateCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await CustomerService.updateCustomer(id, req.body, req.tenant!.id);
      
      res.json({
        success: true,
        data: customer,
        message: 'Cliente atualizado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/customers/{id}:
   *   delete:
   *     summary: Excluir cliente
   *     description: Remove cliente do sistema (soft delete se houver vendas associadas)
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do cliente
   *     responses:
   *       200:
   *         description: Cliente removido com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: "Cliente removido com sucesso"
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async deleteCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CustomerService.deleteCustomer(id, req.tenant!.id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/customers/{id}/sales:
   *   get:
   *     summary: Histórico de compras do cliente
   *     description: Retorna o histórico de vendas de um cliente, incluindo detalhes das vendas (data, produtos, valores)
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do cliente
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
   *         description: Histórico de compras do cliente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     customer:
   *                       $ref: '#/components/schemas/Customer'
   *                     sales:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Sale'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Cliente não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getCustomerSalesHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page, limit, sortBy, sortOrder } = req.query;
      
      const result = await CustomerService.getCustomerSalesHistory(id, req.tenant!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }
}
