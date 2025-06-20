/**
 * Validações de entrada para os endpoints da API
 */

import { Request, Response, NextFunction } from 'express';

// Validação de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validação de expressão CRON
export function isValidCronExpression(cron: string): boolean {
  const cronParts = cron.split(' ');
  return cronParts.length === 5; // Validação básica
}

// Validação de Spreadsheet ID do Google
export function isValidSpreadsheetId(id: string): boolean {
  // IDs do Google Sheets têm formato específico
  const spreadsheetIdRegex = /^[a-zA-Z0-9-_]{44}$/;
  return spreadsheetIdRegex.test(id);
}

// Middleware de validação para configuração do Redmine
export function validateRedmineConfig(req: Request, res: Response, next: NextFunction) {
  const { redmine_url, api_key } = req.body;

  const errors: string[] = [];

  if (!redmine_url || typeof redmine_url !== 'string') {
    errors.push('redmine_url é obrigatório e deve ser string');
  } else if (!isValidUrl(redmine_url)) {
    errors.push('redmine_url deve ser uma URL válida');
  }

  if (!api_key || typeof api_key !== 'string') {
    errors.push('api_key é obrigatório e deve ser string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
}

// Middleware de validação para configuração do Sheets
export function validateSheetsConfig(req: Request, res: Response, next: NextFunction) {
  const { spreadsheet_id } = req.body;

  const errors: string[] = [];

  if (!spreadsheet_id || typeof spreadsheet_id !== 'string') {
    errors.push('spreadsheet_id é obrigatório e deve ser string');
  } else if (!isValidSpreadsheetId(spreadsheet_id)) {
    errors.push('spreadsheet_id deve ter formato válido do Google Sheets');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
}

// Middleware de validação para filtros
export function validateFilter(req: Request, res: Response, next: NextFunction) {
  const { nome } = req.body;

  const errors: string[] = [];

  if (!nome || typeof nome !== 'string') {
    errors.push('nome é obrigatório e deve ser string');
  } else if (nome.length < 3) {
    errors.push('nome deve ter pelo menos 3 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
}

// Middleware de validação para jobs
export function validateJob(req: Request, res: Response, next: NextFunction) {
  const { nome, filtro_id, cron_expression, aba_destino } = req.body;

  const errors: string[] = [];

  if (!nome || typeof nome !== 'string') {
    errors.push('nome é obrigatório e deve ser string');
  }

  if (!filtro_id || typeof filtro_id !== 'string') {
    errors.push('filtro_id é obrigatório e deve ser string');
  }

  if (!cron_expression || typeof cron_expression !== 'string') {
    errors.push('cron_expression é obrigatório e deve ser string');
  } else if (!isValidCronExpression(cron_expression)) {
    errors.push('cron_expression deve ter formato válido (5 partes separadas por espaço)');
  }

  if (!aba_destino || typeof aba_destino !== 'string') {
    errors.push('aba_destino é obrigatório e deve ser string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
}

// Middleware de validação para autenticação
export function validateAuth(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('email é obrigatório e deve ser string');
  } else if (!isValidEmail(email)) {
    errors.push('email deve ter formato válido');
  }

  if (!password || typeof password !== 'string') {
    errors.push('password é obrigatório e deve ser string');
  } else if (password.length < 6) {
    errors.push('password deve ter pelo menos 6 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }

  next();
}

// Sanitização de dados
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function sanitizeObject(obj: any): any {
  const sanitized: any = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeString(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}
