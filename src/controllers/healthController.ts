import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Monitoramento e status da aplicação
 */
export class HealthController {
  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Verificar status da aplicação
   *     description: Endpoint para monitoramento que verifica se a API e banco estão funcionando
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Aplicação funcionando corretamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 status:
   *                   type: string
   *                   example: "healthy"
   *                 message:
   *                   type: string
   *                   example: "API funcionando corretamente"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 version:
   *                   type: string
   *                   example: "1.0.0"
   *                 environment:
   *                   type: string
   *                   example: "development"
   *                 database:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: "connected"
   *                     responseTime:
   *                       type: string
   *                       example: "12ms"
   *                 uptime:
   *                   type: string
   *                   example: "2h 15m 30s"
   *       503:
   *         description: Serviço indisponível
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 status:
   *                   type: string
   *                   example: "unhealthy"
   *                 message:
   *                   type: string
   *                   example: "Erro na conexão com banco de dados"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  static async healthCheck(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      // Verificar conexão com banco de dados
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStart;
      
      // Calcular uptime
      const uptimeSeconds = process.uptime();
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptime = `${hours}h ${minutes}m ${seconds}s`;
      
      const response = {
        success: true,
        status: 'healthy',
        message: 'API funcionando corretamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`
        },
        uptime,
        responseTime: `${Date.now() - startTime}ms`
      };
      
      res.status(200).json(response);
      
    } catch (error: any) {
      const response = {
        success: false,
        status: 'unhealthy',
        message: 'Erro na conexão com banco de dados',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'disconnected',
          error: error.message
        },
        responseTime: `${Date.now() - startTime}ms`
      };
      
      res.status(503).json(response);
    }
  }

  /**
   * @swagger
   * /api/health/detailed:
   *   get:
   *     summary: Status detalhado da aplicação
   *     description: Informações completas sobre o sistema, banco e recursos
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Status detalhado da aplicação
   */
  static async detailedHealth(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      // Verificar banco de dados
      const dbStart = Date.now();
      const [dbResult] = await Promise.all([
        prisma.$queryRaw`SELECT version() as version`,
        prisma.$queryRaw`SELECT current_database() as database`
      ]);
      const dbResponseTime = Date.now() - dbStart;
      
      // Informações do sistema
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Contadores do banco
      const [tenantCount, userCount, productCount] = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.product.count()
      ]);
      
      const response = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        application: {
          name: 'Sistema PDV Multitenant',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          pid: process.pid
        },
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`,
          version: (dbResult as any)[0]?.version || 'unknown'
        },
        system: {
          memory: {
            used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          },
          platform: process.platform,
          nodeVersion: process.version
        },
        statistics: {
          tenants: tenantCount,
          users: userCount,
          products: productCount
        },
        responseTime: `${Date.now() - startTime}ms`
      };
      
      res.status(200).json(response);
      
    } catch (error: any) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`
      });
    }
  }
}