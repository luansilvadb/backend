import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  // Gerar hash da senha
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Verificar senha
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  // Gerar token JWT
  generateToken(user: Omit<User, 'created_at'>): string {
    const payload = { 
      id: user.id, 
      email: user.email, 
      name: user.name 
    };
    
    return jwt.sign(
      payload,
      this.JWT_SECRET,
      { 
        expiresIn: this.JWT_EXPIRES_IN 
      } as jwt.SignOptions
    );
  }

  // Verificar token JWT
  verifyToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        created_at: ''
      };
    } catch (error) {
      return null;
    }
  }

  // Middleware de autenticação
  authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    const user = this.verifyToken(token);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    req.user = user;
    next();
  }

  // Middleware opcional (para rotas que podem funcionar com ou sem auth)
  optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = this.verifyToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  }
}

export const authService = new AuthService();
