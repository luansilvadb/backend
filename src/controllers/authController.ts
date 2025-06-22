import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints de autenticação e gestão de usuários
 */
export class AuthController {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Realizar login no sistema
   *     description: Autentica um usuário e retorna um token JWT
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
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
   *                     token:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         email:
   *                           type: string
   *                         name:
   *                           type: string
   *                         role:
   *                           type: string
   *                         tenant:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: string
   *                             name:
   *                               type: string
   *                             slug:
   *                               type: string
   *                 message:
   *                   type: string
   *                   example: "Login realizado com sucesso"
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Credenciais inválidas
   *       500:
   *         description: Erro interno do servidor
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      const result = await AuthService.login(req.body, userAgent, ipAddress);
      
      res.json({
        success: true,
        data: result,
        message: 'Login realizado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.createUser(req.body, req.tenant!.id);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'Usuário criado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Obter perfil do usuário logado
   *     description: Retorna informações detalhadas do usuário autenticado
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Perfil do usuário
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Token inválido ou expirado
   *       500:
   *         description: Erro interno do servidor
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await AuthService.getUserProfile(req.user!.id);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
      
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
   * /api/auth/refresh:
   *   post:
   *     summary: Renovar token de acesso
   *     description: Renova o token de acesso usando o refresh token
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Token de refresh válido
   *             required:
   *               - refreshToken
   *     responses:
   *       200:
   *         description: Token renovado com sucesso
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
   *                     accessToken:
   *                       type: string
   *                     expiresIn:
   *                       type: number
   *                     user:
   *                       type: object
   *       401:
   *         description: Refresh token inválido ou expirado
   *       500:
   *         description: Erro interno do servidor
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token é obrigatório'
        });
      }

      const result = await AuthService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: result,
        message: 'Token renovado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Realizar logout
   *     description: Invalida a sessão atual do usuário
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout realizado com sucesso
   *       401:
   *         description: Token inválido ou expirado
   */
  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.sessionId) {
        await AuthService.logout(req.sessionId);
      }
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/logout-all:
   *   post:
   *     summary: Encerrar todas as sessões
   *     description: Invalida todas as sessões ativas do usuário
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Todas as sessões foram encerradas
   *       401:
   *         description: Token inválido ou expirado
   */
  static async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.logoutAllSessions(req.user!.id);
      
      res.json({
        success: true,
        data: result,
        message: 'Todas as sessões foram encerradas'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/sessions:
   *   get:
   *     summary: Listar sessões ativas
   *     description: Retorna todas as sessões ativas do usuário
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de sessões ativas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       userAgent:
   *                         type: string
   *                       ipAddress:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                       expiresAt:
   *                         type: string
   */
  static async getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await AuthService.getUserSessions(req.user!.id);
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/sessions/{sessionId}:
   *   delete:
   *     summary: Revogar sessão específica
   *     description: Revoga uma sessão específica do usuário
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da sessão a ser revogada
   *     responses:
   *       200:
   *         description: Sessão revogada com sucesso
   *       404:
   *         description: Sessão não encontrada
   */
  static async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const result = await AuthService.revokeSession(sessionId, req.user!.id);
      
      res.json({
        success: true,
        data: result,
        message: 'Sessão revogada com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Registrar novo usuário em empresa existente
   *     description: Cria uma nova conta de usuário em uma empresa já cadastrada
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "usuario@exemplo.com"
   *               name:
   *                 type: string
   *                 example: "João Silva"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: "MinhaSenh@123"
   *                 description: "Deve conter pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial"
   *               tenantSlug:
   *                 type: string
   *                 example: "minha-empresa"
   *               inviteCode:
   *                 type: string
   *                 example: "CONV123"
   *                 description: "Código de convite (opcional)"
   *             required:
   *               - email
   *               - name
   *               - password
   *               - tenantSlug
   *     responses:
   *       201:
   *         description: Usuário registrado com sucesso
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
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     expiresIn:
   *                       type: number
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         email:
   *                           type: string
   *                         name:
   *                           type: string
   *                         role:
   *                           type: string
   *                           example: "CASHIER"
   *                         tenant:
   *                           type: object
   *                 message:
   *                   type: string
   *                   example: "Usuário registrado com sucesso"
   *       400:
   *         description: Dados inválidos
   *       409:
   *         description: Email já em uso ou empresa não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      const result = await AuthService.register(req.body, userAgent, ipAddress);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Usuário registrado com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/register-tenant:
   *   post:
   *     summary: Registrar nova empresa e usuário administrador
   *     description: Cria uma nova empresa e o primeiro usuário como administrador
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "admin@minhaempresa.com"
   *               name:
   *                 type: string
   *                 example: "João Silva"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: "MinhaSenh@123"
   *               tenantName:
   *                 type: string
   *                 example: "Minha Empresa LTDA"
   *               tenantSlug:
   *                 type: string
   *                 example: "minha-empresa"
   *                 pattern: "^[a-z0-9-]+$"
   *               tenantEmail:
   *                 type: string
   *                 format: email
   *                 example: "contato@minhaempresa.com"
   *               tenantPhone:
   *                 type: string
   *                 example: "(11) 99999-9999"
   *               tenantAddress:
   *                 type: string
   *                 example: "Rua das Flores, 123, São Paulo, SP"
   *               tenantCnpj:
   *                 type: string
   *                 example: "12.345.678/0001-90"
   *             required:
   *               - email
   *               - name
   *               - password
   *               - tenantName
   *               - tenantSlug
   *               - tenantEmail
   *     responses:
   *       201:
   *         description: Empresa e usuário criados com sucesso
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
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     expiresIn:
   *                       type: number
   *                     user:
   *                       type: object
   *                       properties:
   *                         role:
   *                           type: string
   *                           example: "ADMIN"
   *                     tenant:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         name:
   *                           type: string
   *                         slug:
   *                           type: string
   *                 message:
   *                   type: string
   *                   example: "Empresa e usuário criados com sucesso"
   *       400:
   *         description: Dados inválidos
   *       409:
   *         description: Slug, email ou CNPJ já em uso
   *       500:
   *         description: Erro interno do servidor
   */
  static async registerWithTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      const result = await AuthService.registerWithTenant(req.body, userAgent, ipAddress);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Empresa e usuário criados com sucesso'
      });
    } catch (error: any) {
      next(error);
    }
  }
}
