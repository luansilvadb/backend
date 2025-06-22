import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Registro já existe',
          details: 'Violação de restrição única'
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Registro não encontrado'
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Violação de chave estrangeira'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Erro no banco de dados',
          details: error.message
        });
    }
  }

  // Validation errors
  if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: (error as any).message
    });
  }

  // JWT errors
  if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado'
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' && typeof error === 'object' && error !== null && 'message' in error
      ? (error as any).message
      : undefined
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
};