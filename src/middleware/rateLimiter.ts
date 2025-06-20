import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // janela de tempo em ms
  maxRequests: number; // máximo de requisições por janela
  message?: string;
}

interface ClientRequest {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private clients: Map<string, ClientRequest> = new Map();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Muitas requisições. Tente novamente em alguns segundos.',
      ...options
    };

    // Limpa clientes expirados a cada minuto
    setInterval(() => {
      this.cleanupExpiredClients();
    }, 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = this.getClientId(req);
      const now = Date.now();
      
      let client = this.clients.get(clientId);
      
      // Se não existe ou expirou, cria novo
      if (!client || now > client.resetTime) {
        client = {
          count: 0,
          resetTime: now + this.options.windowMs
        };
        this.clients.set(clientId, client);
      }
      
      client.count++;
      
      // Verifica se excedeu o limite
      if (client.count > this.options.maxRequests) {
        return res.status(429).json({
          success: false,
          message: this.options.message,
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((client.resetTime - now) / 1000)
        });
      }
      
      // Adiciona headers informativos
      res.set({
        'X-RateLimit-Limit': this.options.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.options.maxRequests - client.count).toString(),
        'X-RateLimit-Reset': new Date(client.resetTime).toISOString()
      });
      
      next();
    };
  }

  private getClientId(req: Request): string {
    // Por simplicidade, usa o IP. Em produção, consideraria user ID se autenticado
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private cleanupExpiredClients() {
    const now = Date.now();
    for (const [clientId, client] of this.clients.entries()) {
      if (now > client.resetTime) {
        this.clients.delete(clientId);
      }
    }
  }
}

// Rate limiters para diferentes tipos de operação
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100 // 100 requisições por 15min
}).middleware();

export const sheetsRateLimit = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  maxRequests: 30 // 30 requisições por minuto para Google Sheets
}).middleware();

export const redmineRateLimit = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  maxRequests: 20 // 20 requisições por minuto para Redmine
}).middleware();

export const exportRateLimit = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  maxRequests: 5 // máximo 5 exportações por 5min
}).middleware();
