import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Permission, hasPermission, hasAnyPermission, getRoutePermissions, SpecialPermissions } from '../config/permissions';
import prisma from '../config/database';

// Interface para logs de auditoria
interface AccessAttempt {
  userId: string;
  userEmail: string;
  userRole: string;
  tenantId: string;
  method: string;
  path: string;
  endpoint: string;
  requiredPermissions: Permission[];
  hasPermission: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  reason?: string;
  resourceId?: string;
}

// Enum temporário até o Prisma gerar o cliente
enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RESOURCE_CREATED = 'RESOURCE_CREATED',
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  RESOURCE_VIEWED = 'RESOURCE_VIEWED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  BULK_OPERATION = 'BULK_OPERATION',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT'
}

// Classe para gerenciar logs de auditoria aprimorada
class AuditLogger {
  static async logAccessAttempt(attempt: AccessAttempt) {
    try {
      // Log no console para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const status = attempt.hasPermission ? '✅ ALLOWED' : '❌ DENIED';
        console.log(`[RBAC] ${status} ${attempt.userEmail} (${attempt.userRole}) -> ${attempt.method} ${attempt.path}`);
        
        if (!attempt.hasPermission) {
          console.log(`[RBAC] Required: [${attempt.requiredPermissions.join(', ')}]`);
          console.log(`[RBAC] Reason: ${attempt.reason}`);
        }
      }

      // Salvar no banco de dados com novos campos
      const auditAction = attempt.hasPermission ? 'PERMISSION_GRANTED' : 'ACCESS_DENIED';
      
      await prisma.auditLog.create({
        data: {
          userId: attempt.userId,
          tenantId: attempt.tenantId,
          action: auditAction,
          resource: attempt.endpoint,
          resourceId: attempt.resourceId,
          method: attempt.method,
          endpoint: attempt.endpoint,
          ipAddress: attempt.ipAddress,
          userAgent: attempt.userAgent,
          success: attempt.hasPermission,
          errorCode: attempt.hasPermission ? undefined : 'INSUFFICIENT_PERMISSIONS',
          details: {
            userEmail: attempt.userEmail,
            userRole: attempt.userRole,
            requiredPermissions: attempt.requiredPermissions,
            reason: attempt.reason,
            timestamp: attempt.timestamp.toISOString()
          }
        }
      }).catch(error => {
        console.error('Failed to save audit log:', error);
      });
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Método para registrar ações específicas
  static async logResourceAction(
    userId: string,
    tenantId: string,
    action: 'RESOURCE_CREATED' | 'RESOURCE_UPDATED' | 'RESOURCE_DELETED' | 'RESOURCE_VIEWED',
    resource: string,
    resourceId: string,
    method: string,
    endpoint: string,
    ipAddress: string,
    userAgent: string,
    success: boolean = true,
    details?: Record<string, unknown>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          tenantId,
          action,
          resource,
          resourceId,
          method,
          endpoint,
          ipAddress,
          userAgent,
          success,
          details: details ? JSON.stringify(details) : undefined
        }
      });
    } catch (error) {
      console.error('Failed to log resource action:', error);
    }
  }

  // Método para registrar relatórios gerados
  static async logReportGeneration(
    userId: string,
    tenantId: string,
    reportType: string,
    ipAddress: string,
    userAgent: string,
    filters?: Record<string, unknown>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          tenantId,
          action: 'REPORT_GENERATED',
          resource: `report:${reportType}`,
          method: 'GET',
          endpoint: `/api/reports/${reportType}`,
          ipAddress,
          userAgent,
          success: true,
          details: {
            reportType,
            filters: filters ? JSON.parse(JSON.stringify(filters)) : {},
            generatedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Failed to log report generation:', error);
    }
  }

  // Método para registrar operações em lote
  static async logBulkOperation(
    userId: string,
    tenantId: string,
    operation: string,
    resource: string,
    affectedCount: number,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: Record<string, unknown>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          tenantId,
          action: 'BULK_OPERATION',
          resource,
          method: 'POST',
          endpoint: `/api/${resource}/bulk`,
          ipAddress,
          userAgent,
          success,
          details: {
            operation,
            affectedCount,
            ...details
          }
        }
      });
    } catch (error) {
      console.error('Failed to log bulk operation:', error);
    }
  }
}

// Middleware principal de autorização
export const authorize = (requiredPermissions: Permission | Permission[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const userRole = req.user.role;
      const hasRequiredPermission = hasAnyPermission(userRole, permissions);

      // Preparar dados para auditoria
      const endpoint = `${req.method} ${req.path}`;
      const accessAttempt: AccessAttempt = {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: userRole,
        tenantId: req.tenant.id,
        method: req.method,
        path: req.path,
        endpoint: endpoint,
        requiredPermissions: permissions,
        hasPermission: hasRequiredPermission,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
      };

      // Verificações especiais
      if (hasRequiredPermission) {
        // Verificar restrições especiais para criação de usuários
        if (permissions.includes(Permission.USER_CREATE)) {
          const { role: newUserRole } = req.body;
          const roleRestrictions = SpecialPermissions.USER_CREATE_ROLE_RESTRICTION as Record<string, string[]>;
          const allowedRoles = roleRestrictions[userRole];
          
          if (allowedRoles && newUserRole && !allowedRoles.includes(newUserRole)) {
            accessAttempt.hasPermission = false;
            accessAttempt.reason = `Role ${userRole} can only create users with roles: ${allowedRoles.join(', ')}`;
            await AuditLogger.logAccessAttempt(accessAttempt);
            
            return res.status(403).json({
              success: false,
              error: `Você só pode criar usuários com os papéis: ${allowedRoles.join(', ')}`,
              code: 'ROLE_RESTRICTION'
            });
          }
        }

        // Verificar restrições de propriedade para vendas
        if (permissions.includes(Permission.SALE_READ) || permissions.includes(Permission.SALE_LIST)) {
          const saleOwnershipRestrictions = SpecialPermissions.SALE_OWNERSHIP as Record<string, string>;
          const saleOwnership = saleOwnershipRestrictions[userRole];
          
          if (saleOwnership === 'self_only') {
            // Para CASHIER, adicionar filtro para mostrar apenas suas próprias vendas
            req.ownershipFilter = { userId: req.user.id };
          }
        }

        // Verificar restrições de sessão
        if (permissions.includes(Permission.SESSION_MANAGE)) {
          const sessionId = req.params.sessionId;
          
          if (sessionId && SpecialPermissions.SESSION_SELF_ONLY) {
            // Verificar se a sessão pertence ao usuário
            const session = await prisma.userSession.findFirst({
              where: {
                id: sessionId,
                userId: req.user.id
              }
            });

            if (!session && userRole !== 'ADMIN') {
              accessAttempt.hasPermission = false;
              accessAttempt.reason = 'User can only manage their own sessions';
              await AuditLogger.logAccessAttempt(accessAttempt);
              
              return res.status(403).json({
                success: false,
                error: 'Você só pode gerenciar suas próprias sessões',
                code: 'SESSION_OWNERSHIP'
              });
            }
          }
        }
      }

      // Log da tentativa de acesso
      await AuditLogger.logAccessAttempt(accessAttempt);

      // Verificar se tem permissão
      if (!hasRequiredPermission) {
        return res.status(403).json({
          success: false,
          error: 'Permissão insuficiente para acessar este recurso',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: permissions,
            userRole: userRole
          }
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno de autorização',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// Middleware para autorização automática baseada na rota
export const autoAuthorize = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Obter permissões necessárias para a rota atual
    const requiredPermissions = getRoutePermissions(req.method, req.path);
    
    // Se não há permissões definidas para a rota, permitir acesso
    if (requiredPermissions.length === 0) {
      return next();
    }

    // Aplicar middleware de autorização
    return authorize(requiredPermissions)(req, res, next);
  } catch (error) {
    console.error('Auto-authorization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autorização automática',
      code: 'AUTO_AUTHORIZATION_ERROR'
    });
  }
};

// Middleware para verificar se é admin
export const requireAdmin = authorize([Permission.USER_CREATE, Permission.USER_DELETE, Permission.SYSTEM_CONFIG]);

// Middleware para verificar se é manager ou admin
export const requireManagerOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (!['ADMIN', 'MANAGER'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Acesso restrito a gerentes e administradores',
      code: 'MANAGER_OR_ADMIN_REQUIRED'
    });
  }

  next();
};

// Middleware para verificar permissões específicas
export const requirePermission = (permission: Permission) => authorize([permission]);

// Middleware para verificar qualquer uma das permissões
export const requireAnyPermission = (permissions: Permission[]) => authorize(permissions);

// Middleware para verificar todas as permissões
export const requireAllPermissions = (permissions: Permission[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const hasAllRequired = permissions.every(permission => hasPermission(userRole, permission));

    if (!hasAllRequired) {
      // Log da tentativa de acesso negado
      await AuditLogger.logAccessAttempt({
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: userRole,
        tenantId: req.tenant!.id,
        method: req.method,
        path: req.path,
        endpoint: `${req.method} ${req.path}`,
        requiredPermissions: permissions,
        hasPermission: false,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        reason: 'Missing required permissions'
      });

      return res.status(403).json({
        success: false,
        error: 'Todas as permissões são necessárias para acessar este recurso',
        code: 'ALL_PERMISSIONS_REQUIRED',
        details: {
          required: permissions,
          userRole: userRole
        }
      });
    }

    next();
  };
};

// Função utilitária para verificar permissões em controllers
export const checkPermission = (userRole: string, permission: Permission): boolean => {
  return hasPermission(userRole, permission);
};

// Função para obter permissões do usuário
export const getUserPermissions = (userRole: string): Permission[] => {
  const permissions = Object.values(Permission).filter(permission => 
    hasPermission(userRole, permission)
  );
  return permissions;
};
