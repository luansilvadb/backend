import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import { Permission } from '../config/permissions';
import { checkPermission } from '../middleware/authorization';

export class AuditController {
  // Listar logs de auditoria
  static async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const {
        page = 1,
        limit = 50,
        userId,
        action,
        resource,
        dateFrom,
        dateTo,
        success
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {
        tenantId: req.tenant.id
      };

      if (userId) {
        where.userId = userId;
      }

      if (action) {
        where.action = action;
      }

      if (resource) {
        where.resource = {
          contains: resource as string,
          mode: 'insensitive'
        };
      }

      if (success !== undefined) {
        where.success = success === 'true';
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Buscar logs com contagem total
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.auditLog.count({ where })
      ]);

      return res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  // Obter estatísticas de auditoria
  static async getAuditStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const { dateFrom, dateTo } = req.query;

      // Filtros de data
      const dateFilter: any = {
        tenantId: req.tenant.id
      };

      if (dateFrom || dateTo) {
        dateFilter.createdAt = {};
        if (dateFrom) {
          dateFilter.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          dateFilter.createdAt.lte = new Date(dateTo as string);
        }
      }

      // Buscar estatísticas
      const [
        totalLogs,
        successfulActions,
        failedActions,
        actionsByType,
        userActivity,
        recentActivity
      ] = await Promise.all([
        prisma.auditLog.count({ where: dateFilter }),
        
        prisma.auditLog.count({
          where: { ...dateFilter, success: true }
        }),
        
        prisma.auditLog.count({
          where: { ...dateFilter, success: false }
        }),
        
        prisma.auditLog.groupBy({
          by: ['action'],
          where: dateFilter,
          _count: {
            action: true
          },
          orderBy: {
            _count: {
              action: 'desc'
            }
          },
          take: 10
        }),
        
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: dateFilter,
          _count: {
            userId: true
          },
          orderBy: {
            _count: {
              userId: 'desc'
            }
          },
          take: 10
        }),
        
        prisma.auditLog.findMany({
          where: dateFilter,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        })
      ]);

      // Buscar informações dos usuários mais ativos
      const userIds = userActivity.map(u => u.userId);
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          tenantId: req.tenant.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      const userActivityWithDetails = userActivity.map(activity => {
        const user = users.find(u => u.id === activity.userId);
        return {
          user,
          count: activity._count.userId
        };
      });

      return res.json({
        success: true,
        data: {
          summary: {
            totalLogs,
            successfulActions,
            failedActions,
            successRate: totalLogs > 0 ? ((successfulActions / totalLogs) * 100).toFixed(2) : '0'
          },
          actionsByType: actionsByType.map(action => ({
            action: action.action,
            count: action._count.action
          })),
          userActivity: userActivityWithDetails,
          recentActivity
        }
      });
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  // Exportar logs de auditoria
  static async exportAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Verificar permissão para exportar dados
      if (!checkPermission(req.user.role, Permission.SECURITY_AUDIT)) {
        return res.status(403).json({
          success: false,
          error: 'Permissão insuficiente para exportar logs de auditoria',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      const { dateFrom, dateTo, format = 'json' } = req.query;

      const where: any = {
        tenantId: req.tenant.id
      };

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (format === 'csv') {
        // Converter para CSV
        const csvHeader = 'Data,Usuario,Email,Acao,Recurso,Sucesso,IP,User Agent,Detalhes\n';
        const csvRows = logs.map(log => {
          const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
          return [
            log.createdAt.toISOString(),
            log.user.name,
            log.user.email,
            log.action,
            log.resource,
            log.success ? 'Sim' : 'Não',
            log.ipAddress || '',
            log.userAgent || '',
            `"${details}"`
          ].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csvContent);
      }

      // Formato JSON (padrão)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
      
      return res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        tenant: {
          id: req.tenant.id,
          name: req.tenant.name
        },
        filters: {
          dateFrom,
          dateTo
        },
        totalRecords: logs.length,
        data: logs
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  // Limpar logs antigos
  static async cleanupOldLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Verificar se é admin
      if (!checkPermission(req.user.role, Permission.SYSTEM_CONFIG)) {
        return res.status(403).json({
          success: false,
          error: 'Apenas administradores podem limpar logs',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      const { daysToKeep = 90 } = req.body;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(daysToKeep));

      const deletedCount = await prisma.auditLog.deleteMany({
        where: {
          tenantId: req.tenant.id,
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      // Log da operação de limpeza
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          tenantId: req.tenant.id,
          action: 'SYSTEM_CONFIG_CHANGED',
          resource: 'audit_logs_cleanup',
          method: 'DELETE',
          endpoint: '/api/audit/cleanup',
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          success: true,
          details: {
            daysToKeep: Number(daysToKeep),
            cutoffDate: cutoffDate.toISOString(),
            deletedCount: deletedCount.count
          }
        }
      });

      return res.json({
        success: true,
        message: `${deletedCount.count} logs antigos foram removidos`,
        data: {
          deletedCount: deletedCount.count,
          cutoffDate: cutoffDate.toISOString(),
          daysToKeep: Number(daysToKeep)
        }
      });
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}
