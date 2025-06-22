import { Request, Response, NextFunction } from 'express';

// Mapa para contagem de requisições por endpoint (opcional)
const requestCounts: Record<string, number> = {};

/**
 * Middleware para medir latência e throughput das requisições.
 * Loga método, rota, status e tempo de resposta em ms.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  // Para throughput: contar requisições por endpoint
  const routeKey = `${req.method} ${req.path}`;
  requestCounts[routeKey] = (requestCounts[routeKey] || 0) + 1;

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000; // converte para ms
    const log = `[METRICS] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${durationMs.toFixed(2)}ms`;
    console.log(log);

    // (Opcional) Logar throughput a cada 100 requisições por endpoint
    if (requestCounts[routeKey] % 100 === 0) {
      console.log(`[THROUGHPUT] ${routeKey}: ${requestCounts[routeKey]} requisições`);
    }
  });

  next();
}
