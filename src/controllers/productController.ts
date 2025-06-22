import { Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestão de produtos
 */
export class ProductController {
  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: Criar produto
   *     description: Cria um novo produto no sistema
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProductRequest'
   *     responses:
   *       201:
   *         description: Produto criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *                 message:
   *                   type: string
   *                   example: Produto criado com sucesso
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Sem permissão
   *       500:
   *         description: Erro interno do servidor
   */
  static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body, req.tenant!.id);
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Produto criado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Listar produtos
   *     description: Retorna lista paginada de produtos do tenant
   *     tags: [Products]
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
   *         description: Buscar por nome, descrição, SKU ou código de barras
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar por categoria
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *         description: Filtrar por status
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
   *         description: Lista de produtos
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
   *                     $ref: '#/components/schemas/Product'
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
  static async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, categoryId, status, sortBy, sortOrder } = req.query;
      
      const result = await ProductService.getProducts(req.tenant!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        categoryId: categoryId as string,
        status: status as 'active' | 'inactive',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Obter produto por ID
   *     description: Retorna detalhes completos de um produto específico
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do produto
   *     responses:
   *       200:
   *         description: Produto encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id, req.tenant!.id);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products/sku/{sku}:
   *   get:
   *     summary: Obter produto por SKU
   *     description: Busca produto pelo código SKU - útil para PDV e consultas rápidas
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sku
   *         required: true
   *         schema:
   *           type: string
   *         description: Código SKU do produto
   *         example: "COCA350ML"
   *     responses:
   *       200:
   *         description: Produto encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getProductBySku(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sku } = req.params;
      const product = await ProductService.getProductBySku(sku, req.tenant!.id);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products/barcode/{barcode}:
   *   get:
   *     summary: Obter produto por código de barras
   *     description: Busca produto pelo código de barras - útil para PDV
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: barcode
   *         required: true
   *         schema:
   *           type: string
   *         description: Código de barras do produto
   *         example: "7894900011517"
   *     responses:
   *       200:
   *         description: Produto encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getProductByBarcode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { barcode } = req.params;
      const product = await ProductService.getProductByBarcode(barcode, req.tenant!.id);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products/units:
   *   get:
   *     summary: Listar unidades de medida
   *     description: Retorna todas as unidades de medida disponíveis para produtos
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de unidades de medida
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
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                         example: "UNIT"
   *                       label:
   *                         type: string
   *                         example: "Unidade"
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getProductUnits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const units = await ProductService.getProductUnits();
      
      res.json({
        success: true,
        data: units
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products/low-stock:
   *   get:
   *     summary: Produtos com estoque baixo
   *     description: Retorna produtos com quantidade menor ou igual ao estoque mínimo
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de produtos com estoque baixo
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
   *                     $ref: '#/components/schemas/Product'
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getLowStockProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getLowStockProducts(req.tenant!.id);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products/{id}:
   *   put:
   *     summary: Atualizar produto
   *     description: Atualiza dados de um produto existente
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do produto
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Coca-Cola 350ml Atualizada"
   *               description:
   *                 type: string
   *                 example: "Refrigerante Coca-Cola lata 350ml"
   *               sku:
   *                 type: string
   *                 example: "COCA350ML"
   *               barcode:
   *                 type: string
   *                 example: "7894900011517"
   *               price:
   *                 type: number
   *                 example: 4.99
   *               cost:
   *                 type: number
   *                 example: 3.00
   *               unit:
   *                 type: string
   *                 enum: [UNIT, KG, G, L, ML, M, CM, M2, M3, PACK, BOX, DOZEN]
   *                 example: "UNIT"
   *               categoryId:
   *                 type: string
   *                 format: uuid
   *               isActive:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Produto atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *                 message:
   *                   type: string
   *                   example: Produto atualizado com sucesso
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Sem permissão
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body, req.tenant!.id);
      
      res.json({
        success: true,
        data: product,
        message: 'Produto atualizado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/products/{id}/reactivate:
   *   patch:
   *     summary: Reativar produto
   *     description: Reativa um produto que foi inativado anteriormente
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do produto
   *     responses:
   *       200:
   *         description: Produto reativado com sucesso
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
   *                       example: "Produto reativado com sucesso"
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Sem permissão
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async reactivateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ProductService.reactivateProduct(id, req.tenant!.id);
      
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
   * /api/products/{id}:
   *   delete:
   *     summary: Excluir produto
   *     description: Remove produto do sistema (soft delete se houver vendas associadas)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID do produto
   *     responses:
   *       200:
   *         description: Produto removido com sucesso
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
   *                       example: "Produto removido com sucesso"
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Sem permissão
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  static async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ProductService.deleteProduct(id, req.tenant!.id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }
}
