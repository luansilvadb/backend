// Interfaces e tipos para as entidades
export interface CreateSheetRequest {
  spreadsheetId: string;
  nomeAba: string;
  colunas?: string[];
}

export interface SaveDataRequest {
  spreadsheetId: string;
  nomeAba: string;
  dados: Record<string, any>;
}

export interface SheetResponse {
  success: boolean;
  message: string;
  data?: {
    spreadsheetId: string;
    nomeAba: string;
    planilhaUrl: string;
    dadosSalvos?: any[];
    range?: string;
    cabecalhosEncontrados?: string[];
    dadosProcessados?: number;
  };
  error?: string;
  errors?: string[];
}

export interface ListaAbasResponse {
  success: boolean;
  data: {
    spreadsheetId: string;
    abas: string[];
  };
  message: string;
}

// Interfaces para integração Redmine
export interface RedmineConfig {
  url: string;
  apiKey: string;
}

export interface RedmineIssue {
  id: number;
  subject: string;
  description: string;
  status: {
    id: number;
    name: string;
  };
  priority: {
    id: number;
    name: string;
  };
  tracker: {
    id: number;
    name: string;
  };
  author: {
    id: number;
    name: string;
  };
  assigned_to?: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
  };
  created_on: string;
  updated_on: string;
  done_ratio: number;
  estimated_hours?: number;
  spent_hours?: number;
  custom_fields?: Array<{
    id: number;
    name: string;
    value: string;
  }>;
}

export interface ConfigurarRedmineRequest {
  url: string;
  apiKey: string;
}

export interface BuscarIssuesRequest {
  limit?: number;
  offset?: number;
  filtros?: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    tracker?: string;
    createdOn?: string;
    projectId?: number;
  };
}

export interface ExportarRedmineRequest {
  spreadsheetId: string;
  nomeAba: string;
  filtros?: {
    status?: string;
    assignedTo?: string;
    priority?: string;
    tracker?: string;
    createdOn?: string;
    projectId?: number;
  };
  campos?: string[]; // quais campos exportar
}

export interface ConfiguracaoAutomacao {
  id?: string;
  nome: string;
  ativo: boolean;
  cronExpression: string; // ex: "0 9 * * MON" (toda segunda às 9h)
  redmineConfig: RedmineConfig;
  exportConfig: {
    spreadsheetId: string;
    nomeAba: string;
    campos: string[];
  };
  criadoEm?: string;
  ultimaExecucao?: string;
}

// Validações
export const validateCreateSheet = (req: CreateSheetRequest): string[] => {
  const errors: string[] = [];
  
  if (!req.spreadsheetId || req.spreadsheetId.trim() === '') {
    errors.push('spreadsheetId é obrigatório');
  }
  
  if (!req.nomeAba || req.nomeAba.trim() === '') {
    errors.push('nomeAba é obrigatório');
  }
  
  // Validar formato do ID da planilha (Google Sheets ID format)
  const sheetIdPattern = /^[a-zA-Z0-9-_]{44}$/;
  if (req.spreadsheetId && !sheetIdPattern.test(req.spreadsheetId)) {
    errors.push('spreadsheetId deve ter formato válido do Google Sheets');
  }
  
  return errors;
};

export const validateSaveData = (req: SaveDataRequest): string[] => {
  const errors: string[] = [];
  
  if (!req.spreadsheetId || req.spreadsheetId.trim() === '') {
    errors.push('spreadsheetId é obrigatório');
  }
  
  if (!req.nomeAba || req.nomeAba.trim() === '') {
    errors.push('nomeAba é obrigatório');
  }
  
  if (!req.dados || Object.keys(req.dados).length === 0) {
    errors.push('dados são obrigatórios');
  }
  
  return errors;
};

// Validações para Redmine
export const validateRedmineConfig = (req: ConfigurarRedmineRequest): string[] => {
  const errors: string[] = [];
  
  if (!req.url || req.url.trim() === '') {
    errors.push('URL do Redmine é obrigatória');
  }
  
  if (!req.apiKey || req.apiKey.trim() === '') {
    errors.push('API Key do Redmine é obrigatória');
  }
  
  // Validar formato da URL
  try {
    new URL(req.url);
  } catch {
    errors.push('URL do Redmine deve ter formato válido');
  }
  
  return errors;
};

export const validateExportarRedmine = (req: ExportarRedmineRequest): string[] => {
  const errors: string[] = [];
  
  if (!req.spreadsheetId || req.spreadsheetId.trim() === '') {
    errors.push('spreadsheetId é obrigatório');
  }
  
  if (!req.nomeAba || req.nomeAba.trim() === '') {
    errors.push('nomeAba é obrigatório');
  }
  
  // Validar formato do ID da planilha
  const sheetIdPattern = /^[a-zA-Z0-9-_]{44}$/;
  if (req.spreadsheetId && !sheetIdPattern.test(req.spreadsheetId)) {
    errors.push('spreadsheetId deve ter formato válido do Google Sheets');
  }
  
  return errors;
};
