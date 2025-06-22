import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/authService';

interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido',
        code: 'TOKEN_MISSING'
      });
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({
        success: false,
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }

    // Verificar se é um access token
    if (decoded.type !== 'access') {
      return res.status(403).json({
        success: false,
        error: 'Tipo de token inválido',
        code: 'TOKEN_TYPE_INVALID'
      });
    }

    // Verificar se a sessão ainda está ativa
    const isSessionValid = await AuthService.validateSession(decoded.sessionId);
    if (!isSessionValid) {
      return res.status(401).json({
        success: false,
        error: 'Sessão inválida ou expirada',
        code: 'SESSION_INVALID'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true }
    });

    if (!user || !user.isActive || !user.tenant.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Usuário ou tenant inválido',
        code: 'USER_INVALID'
      });
    }

    // Adicionar informações da sessão à requisição
    req.user = user;
    req.tenant = user.tenant;
    req.sessionId = decoded.sessionId;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Permissão insuficiente'
      });
    }
    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireManagerOrAdmin = requireRole(['ADMIN', 'MANAGER']);