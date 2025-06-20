import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { SheetsController } from './controllers/SheetsController';
import { ConfigController } from './controllers/ConfigController';
import { AuthController } from './controllers/AuthController';
import { JobController } from './controllers/JobController';
import { authService } from './services/AuthService';
import { sheetsRateLimit, exportRateLimit } from './middleware/rateLimiter';
import { 
  validateRedmineConfig, 
  validateSheetsConfig, 
  validateFilter, 
  validateJob, 
  validateAuth 
} from './middleware/validation';

dotenv.config();

const app = express();
app.use(express.json());

// Instanciar os controllers
const sheetsController = new SheetsController();
const configController = new ConfigController();
const authController = new AuthController();
const jobController = new JobController();

// Configuração Swagger melhorada
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Dashboard Backend API',
    version: '1.0.0',
    description: 'API REST para integração com Google Sheets e Redmine seguindo boas práticas',
  },
  servers: [
    { url: 'https://backend-mb2ff2h5i-luandevuxs-projects.vercel.app', description: 'Production server' },
    { url: 'http://localhost:3000', description: 'Development server' }
  ],  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }  },  tags: [
    { name: 'Google Sheets', description: 'Operações com Google Sheets' },
    { name: 'Configuração', description: 'Configurações do sistema' },
    { name: 'Autenticação', description: 'Autenticação e autorização' },
    { name: 'Filtros', description: 'Gerenciamento de filtros CRUD completo' },
    { name: 'Jobs Agendados', description: 'Agendamento e execução de tarefas' },
    { name: 'Exportação', description: 'Exportação de dados e histórico' }
  ],
  paths: {
    '/api/sheets/{spreadsheetId}/abas': {
      get: {
        summary: 'Lista todas as abas da planilha',
        tags: ['Google Sheets'],
        parameters: [{
          name: 'spreadsheetId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID da planilha Google Sheets'
        }],
        responses: {
          '200': { description: 'Lista de abas retornada com sucesso' }
        }
      }
    },
    '/api/sheets/criar-aba': {
      post: {
        summary: 'Cria uma nova aba na planilha',
        tags: ['Google Sheets'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['spreadsheetId', 'nomeAba'],
                properties: {
                  spreadsheetId: { 
                    type: 'string',
                    description: 'ID da planilha Google Sheets',
                    example: '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI'
                  },
                  nomeAba: { 
                    type: 'string',
                    description: 'Nome da nova aba',
                    example: 'DadosUsuarios'
                  },
                  colunas: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Cabeçalhos das colunas (opcional, padrão: Nome, Email)',
                    example: ['Nome', 'Email', 'Telefone']
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Aba criada com sucesso' },
          '400': { description: 'Dados inválidos ou aba já existe' }
        }
      }
    },
    '/api/sheets/salvar-dados': {
      post: {
        summary: 'Salva dados na aba especificada',
        tags: ['Google Sheets'],
        description: 'Envia dados que serão mapeados automaticamente para as colunas da planilha',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['spreadsheetId', 'nomeAba'],
                properties: {
                  spreadsheetId: { 
                    type: 'string',
                    description: 'ID da planilha Google Sheets',
                    example: '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI'
                  },
                  nomeAba: { 
                    type: 'string',
                    description: 'Nome da aba onde salvar os dados',
                    example: 'Dados2024'
                  },
                  Nome: {
                    type: 'string',
                    description: 'Nome da pessoa (deve corresponder ao cabeçalho da planilha)',
                    example: 'João Silva'
                  },
                  Email: {
                    type: 'string',
                    description: 'Email da pessoa (deve corresponder ao cabeçalho da planilha)',
                    example: 'joao@email.com'
                  }
                },
                additionalProperties: {
                  type: 'string',
                  description: 'Qualquer campo adicional será mapeado para as colunas da planilha'
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Dados salvos com sucesso' },
          '400': { description: 'Dados inválidos ou aba não encontrada' }
        }
      }
    },    '/api/config/init': {
      post: {
        summary: 'Inicializar planilha de configuração',
        tags: ['Configuração'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['spreadsheet_id'],
                properties: {
                  spreadsheet_id: {
                    type: 'string',
                    description: 'ID da planilha do Google Sheets para configurações',
                    example: '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { 
            description: 'Planilha inicializada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Planilha inicializada com sucesso e configuração criada para o usuário' },
                    data: {
                      type: 'object',
                      properties: {
                        user_id: { type: 'string', example: '15' },
                        spreadsheet_id: { type: 'string', example: '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI' },
                        config_created: { type: 'boolean', example: true },
                        abas_criadas: { type: 'string', example: 'Abas de configuração criadas com sucesso' }
                      }
                    }
                  }
                }
              }            }
          },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Token inválido ou expirado' }
        }
      },
      get: {
        summary: 'Obter configuração inicial do usuário logado',
        tags: ['Configuração'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { 
            description: 'Configuração inicial retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    spreadsheet_id: { type: 'string', example: '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI' },
                    nome_aba_dados: { type: 'string', example: 'dados_redmine' },
                    nome_aba_logs: { type: 'string', example: 'logs_exportacao' }
                  }
                }
              }
            }
          },
          '404': { description: 'Configuração inicial não encontrada' },
          '401': { description: 'Token inválido ou expirado' }
        }
      }},    '/api/config/redmine': {
      post: {
        summary: 'Configurar conexão com Redmine',
        tags: ['Configuração'],
        security: [{ bearerAuth: [] }],        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['redmine_url', 'api_key'],
                properties: {
                  redmine_url: { type: 'string', format: 'uri', example: 'https://meuredmine.com' },
                  api_key: { type: 'string', example: 'sua_api_key_aqui' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Configuração salva com sucesso' },
          '400': { description: 'Dados inválidos ou falha na conexão com Redmine' },
          '401': { description: 'Token inválido ou expirado' }
        }
      },
      get: {
        summary: 'Obter configuração Redmine do usuário logado',
        tags: ['Configuração'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { 
            description: 'Configuração retornada com sucesso',            content: {
              'application/json': {                schema: {
                  type: 'object',
                  properties: {
                    redmine_url: { type: 'string', example: 'https://meuredmine.com' },
                    api_key: { type: 'string', example: 'sua_api_key_aqui' }
                  }
                }
              }
            }
          },          '404': { description: 'Configuração não encontrada' },
          '401': { description: 'Token inválido ou expirado' }        }
      }
    },
    '/api/config/redmine/test': {
      post: {
        summary: 'Testar conexão com Redmine usando configuração do usuário logado',
        tags: ['Configuração'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { 
            description: 'Conexão testada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Conexão com Redmine testada com sucesso' },
                    data: {
                      type: 'object',
                      properties: {
                        totalIssues: { type: 'number', example: 150 },
                        version: { type: 'string', example: '4.2.0' },
                        redmine_url: { type: 'string', example: 'https://meuredmine.com' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': { 
            description: 'Falha na conexão com Redmine',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Falha na conexão com Redmine' },
                    error: { type: 'string', example: 'API Key inválida ou sem permissões' },
                    redmine_url: { type: 'string', example: 'https://meuredmine.com' }
                  }
                }
              }
            }
          },
          '401': { description: 'Token inválido ou expirado' },
          '404': { 
            description: 'Configuração Redmine não encontrada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Configuração Redmine não encontrada. Configure primeiro através do endpoint POST /api/config/redmine' }
                  }
                }
              }
            }
          }        }
      }
    },
    '/api/exportacoes': {
      get: {
        summary: 'Histórico de exportações do usuário logado',
        tags: ['Exportação'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { 
            description: 'Histórico retornado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: '7' },
                      user_id: { type: 'string', example: '15' },
                      filtro_id: { type: 'string', example: '42' },
                      filtro_nome: { type: 'string', example: 'Issues Críticas' },
                      aba_destino: { type: 'string', example: 'dados_issues' },
                      registros_exportados: { type: 'number', example: 25 },
                      tempo_execucao: { type: 'string', example: '1.2s' },
                      status: { type: 'string', example: 'sucesso' },
                      data_execucao: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Token inválido ou expirado' }
        }
      }
    },
    '/api/export/por-filtro/{filtroId}': {
      post: {
        summary: 'Exportar usando filtro salvo',
        tags: ['Exportação'],
        parameters: [{
          name: 'filtroId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do filtro para exportar',
          example: '42'
        }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id'],
                properties: {
                  user_id: { type: 'string', example: '15' },
                  aba_destino: { type: 'string', example: 'dados_export_manual' },
                  sobrescrever_dados: { type: 'boolean', example: true },
                  incluir_cabecalhos: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Exportação realizada com sucesso' },
          '404': { description: 'Filtro não encontrado' },
          '400': { description: 'Erro na exportação' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Cadastrar novo usuário',
        tags: ['Autenticação'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'João Silva' },
                  email: { type: 'string', format: 'email', example: 'joao@empresa.com' },
                  password: { type: 'string', minLength: 6, example: 'minhasenha123' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Usuário criado com sucesso' },
          '409': { description: 'Email já cadastrado' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Fazer login',
        tags: ['Autenticação'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'joao@empresa.com' },
                  password: { type: 'string', example: 'minhasenha123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Login realizado com sucesso' },
          '401': { description: 'Credenciais inválidas' }
        }
      }    },
    '/api/filtros': {
      post: {
        summary: 'Criar filtro personalizado',
        tags: ['Filtros'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome'],
                properties: {
                  nome: { type: 'string', example: 'Issues Críticas em Aberto' },
                  projeto: { type: 'string', example: 'Meu Projeto' },
                  status: { type: 'string', example: 'Aberto' },
                  assignedTo: { type: 'string', example: 'João Silva' },
                  priority: { type: 'string', example: 'Alta' },
                  tracker: { type: 'string', example: 'Bug' },
                  data_inicio: { type: 'string', format: 'date', example: '2024-01-01' },
                  data_fim: { type: 'string', format: 'date', example: '2024-12-31' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Filtro criado com sucesso' },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Token inválido ou expirado' }
        }
      },
      get: {
        summary: 'Listar filtros do usuário logado',
        tags: ['Filtros'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { 
            description: 'Lista de filtros retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: '42' },
                      user_id: { type: 'string', example: '15' },
                      nome: { type: 'string', example: 'Issues Críticas em Aberto' },
                      projeto: { type: 'string', example: 'Meu Projeto' },
                      status: { type: 'string', example: 'Aberto' },
                      assignedTo: { type: 'string', example: 'João Silva' },
                      priority: { type: 'string', example: 'Alta' },
                      tracker: { type: 'string', example: 'Bug' },
                      data_criacao: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Token inválido ou expirado' }
        }
      }
    },    '/api/filtros/{filtroId}/detalhes': {
      get: {
        summary: 'Obter detalhes de um filtro específico',
        tags: ['Filtros'],
        security: [{ bearerAuth: [] }],
        parameters: [{
          name: 'filtroId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do filtro',
          example: '42'
        }],
        responses: {
          '200': { 
            description: 'Detalhes do filtro retornados com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '42' },
                    user_id: { type: 'string', example: '15' },
                    nome: { type: 'string', example: 'Issues Críticas em Aberto' },
                    projeto: { type: 'string', example: 'Meu Projeto' },
                    status: { type: 'string', example: 'Aberto' },
                    assignedTo: { type: 'string', example: 'João Silva' },
                    priority: { type: 'string', example: 'Alta' },
                    tracker: { type: 'string', example: 'Bug' },
                    data_inicio: { type: 'string', format: 'date' },
                    data_fim: { type: 'string', format: 'date' },
                    data_criacao: { type: 'string', format: 'date-time' },
                    data_atualizacao: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '404': { description: 'Filtro não encontrado' },
          '403': { description: 'Filtro não pertence a este usuário' },
          '401': { description: 'Token inválido ou expirado' }
        }
      }
    },
    '/api/filtros/{filtroId}': {      put: {
        summary: 'Atualizar filtro existente',
        tags: ['Filtros'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'filtroId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID do filtro a ser atualizado',
            example: '42'
          }
        ],        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome'],
                properties: {
                  nome: { type: 'string', example: 'Issues Críticas em Aberto - Atualizado' },
                  projeto: { type: 'string', example: 'Meu Projeto' },
                  status: { type: 'string', example: 'Em Andamento' },
                  assignedTo: { type: 'string', example: 'Maria Silva' },
                  priority: { type: 'string', example: 'Urgente' },
                  tracker: { type: 'string', example: 'Feature' },
                  data_inicio: { type: 'string', format: 'date', example: '2024-01-01' },
                  data_fim: { type: 'string', format: 'date', example: '2024-12-31' }
                }
              }
            }
          }
        },        responses: {
          '200': { description: 'Filtro atualizado com sucesso' },
          '404': { description: 'Filtro não encontrado' },
          '400': { description: 'Dados inválidos' },
          '403': { description: 'Filtro não pertence a este usuário' },
          '401': { description: 'Token inválido ou expirado' }
        }
      },      delete: {
        summary: 'Excluir filtro',
        tags: ['Filtros'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'filtroId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID do filtro a ser excluído',
            example: '42'
          }
        ],
        responses: {
          '200': { description: 'Filtro excluído com sucesso' },
          '404': { description: 'Filtro não encontrado' },
          '403': { description: 'Filtro não pertence a este usuário' },
          '401': { description: 'Token de autenticação inválido' }
        }
      }    },'/api/jobs': {
      post: {
        summary: 'Criar job agendado',
        tags: ['Jobs Agendados'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome', 'filtro_id', 'cron_expression', 'aba_destino'],
                properties: {
                  nome: { type: 'string', example: 'Sync Issues Diário' },
                  filtro_id: { type: 'string', example: '42' },
                  cron_expression: { type: 'string', example: '0 9 * * 1-5', description: 'Todo dia útil às 9h' },
                  aba_destino: { type: 'string', example: 'dados_issues' },
                  sobrescrever_dados: { type: 'boolean', example: true },
                  incluir_cabecalhos: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Job criado com sucesso' },
          '400': { description: 'Dados inválidos ou expressão CRON inválida' },
          '401': { description: 'Token inválido ou expirado' }
        }
      },
      get: {
        summary: 'Listar jobs do usuário logado',
        tags: ['Jobs Agendados'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { 
            description: 'Lista de jobs retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'job_1234567890_abc123' },
                      user_id: { type: 'string', example: '15' },
                      nome: { type: 'string', example: 'Sync Issues Diário' },
                      filtro_id: { type: 'string', example: '42' },
                      cron_expression: { type: 'string', example: '0 9 * * 1-5' },
                      aba_destino: { type: 'string', example: 'dados_issues' },
                      ativo: { type: 'boolean', example: true },
                      proxima_execucao: { type: 'string', format: 'date-time' },
                      ultima_execucao: { type: 'string', format: 'date-time' },
                      data_criacao: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          '400': { description: 'Usuário não encontrado' }
        }
      }
    },
    '/api/jobs/{jobId}': {
      put: {
        summary: 'Atualizar job existente',
        tags: ['Jobs Agendados'],
        parameters: [{
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do job a ser atualizado',
          example: 'job_1234567890_abc123'
        }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome', 'cron_expression'],
                properties: {
                  nome: { type: 'string', example: 'Sync Issues Diário - Atualizado' },
                  filtro_id: { type: 'string', example: '42' },
                  cron_expression: { type: 'string', example: '0 8 * * 1-5', description: 'Todo dia útil às 8h' },
                  aba_destino: { type: 'string', example: 'dados_issues_v2' },
                  sobrescrever_dados: { type: 'boolean', example: false },
                  incluir_cabecalhos: { type: 'boolean', example: true },
                  ativo: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Job atualizado com sucesso' },
          '404': { description: 'Job não encontrado' },
          '400': { description: 'Dados inválidos ou expressão CRON inválida' }
        }
      },
      delete: {
        summary: 'Cancelar/excluir job agendado',
        tags: ['Jobs Agendados'],
        parameters: [{
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do job a ser cancelado',
          example: 'job_1234567890_abc123'
        }],
        responses: {
          '200': { description: 'Job cancelado com sucesso' },
          '404': { description: 'Job não encontrado' }
        }
      }
    },
    '/api/jobs/rodar-agora/{filtroId}': {
      post: {
        summary: 'Executar job manualmente',
        tags: ['Jobs Agendados'],
        parameters: [{
          name: 'filtroId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do filtro para executar imediatamente',
          example: '42'
        }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id'],
                properties: {
                  user_id: { type: 'string', example: '15' },
                  aba_destino: { type: 'string', example: 'dados_issues_manual' },
                  sobrescrever_dados: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Job executado com sucesso' },
          '404': { description: 'Filtro não encontrado' },
          '400': { description: 'Erro na execução' }
        }
      }
    },
    '/api/jobs/{jobId}/logs': {
      get: {
        summary: 'Ver logs de execução do job',
        tags: ['Jobs Agendados'],
        parameters: [{
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do job para ver logs',
          example: 'job_1234567890_abc123'
        }],
        responses: {
          '200': { 
            description: 'Logs retornados com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      data_execucao: { type: 'string', format: 'date-time' },
                      status: { type: 'string', example: 'sucesso' },
                      registros_exportados: { type: 'number', example: 25 },
                      tempo_execucao: { type: 'string', example: '1.2s' },
                      erro: { type: 'string', description: 'Mensagem de erro se houver' }
                    }
                  }
                }
              }
            }
          },
          '404': { description: 'Job não encontrado' }
        }
      }
    },
    '/api/jobs/validar-cron': {
      post: {
        summary: 'Validar expressão CRON',
        tags: ['Jobs Agendados'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cron_expression'],
                properties: {
                  cron_expression: {
                    type: 'string',
                    example: '0 9 * * 1-5',
                    description: 'Expressão CRON para validar'
                  }
                }
              }
            }
          }
        },        responses: {
          '200': { description: 'Validação concluída' }
        }
      }
    }
  }
};

// Endpoint para servir apenas o JSON do Swagger (para usar em editores externos)
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas organizadas por recurso com rate limiting específico
app.get('/api/sheets/:spreadsheetId/abas', sheetsRateLimit, (req, res) => 
  sheetsController.listarAbas(req, res)
);

app.post('/api/sheets/criar-aba', sheetsRateLimit, (req, res) => 
  sheetsController.criarAba(req, res)
);

app.post('/api/sheets/salvar-dados', sheetsRateLimit, (req, res) => 
  sheetsController.salvarDados(req, res)
);

// Rotas de Configuração (Nova Arquitetura)
app.post('/api/config/init', authService.authenticateToken.bind(authService), (req, res) => 
  configController.inicializarConfig(req, res)
);

app.get('/api/config/init', authService.authenticateToken.bind(authService), (req, res) => 
  configController.obterConfigInit(req, res)
);

app.post('/api/config/redmine', authService.authenticateToken.bind(authService), validateRedmineConfig, (req, res) => 
  configController.salvarConfigRedmine(req, res)
);

app.get('/api/config/redmine', authService.authenticateToken.bind(authService), (req, res) => 
  configController.obterConfigRedmine(req, res)
);

app.post('/api/config/redmine/test', authService.authenticateToken.bind(authService), (req, res) => 
  configController.testarConexaoRedmine(req, res)
);

// Rotas de Filtros
app.post('/api/filtros', authService.authenticateToken.bind(authService), validateFilter, (req, res) => 
  configController.salvarFiltro(req, res)
);

app.get('/api/filtros', authService.authenticateToken.bind(authService), (req, res) => 
  configController.listarFiltros(req, res)
);

app.get('/api/filtros/:filtroId/detalhes', authService.authenticateToken.bind(authService), (req, res) => 
  configController.obterFiltro(req, res)
);

app.put('/api/filtros/:filtroId', authService.authenticateToken.bind(authService), validateFilter, (req, res) => 
  configController.atualizarFiltro(req, res)
);

app.delete('/api/filtros/:filtroId', authService.authenticateToken.bind(authService), (req, res) => 
  configController.excluirFiltro(req, res)
);

// Rotas de Exportação e Logs
app.get('/api/exportacoes', authService.authenticateToken.bind(authService), (req, res) => 
  configController.listarExportacoes(req, res)
);

app.post('/api/export/por-filtro/:filtroId', authService.authenticateToken.bind(authService), (req, res) => 
  configController.exportarPorFiltro(req, res)
);

// Rotas de Autenticação
app.post('/api/auth/register', validateAuth, (req, res) => 
  authController.register(req, res)
);

app.post('/api/auth/login', validateAuth, (req, res) => 
  authController.login(req, res)
);

app.get('/api/auth/me', authService.authenticateToken.bind(authService), (req, res) => 
  authController.me(req, res)
);

app.post('/api/auth/logout', (req, res) => 
  authController.logout(req, res)
);

// Rotas de Jobs Agendados
app.post('/api/jobs', authService.authenticateToken.bind(authService), validateJob, (req, res) => 
  jobController.agendarJob(req, res)
);

app.get('/api/jobs', authService.authenticateToken.bind(authService), (req, res) => 
  jobController.listarJobs(req, res)
);

app.put('/api/jobs/:jobId', authService.authenticateToken.bind(authService), validateJob, (req, res) => 
  jobController.atualizarJob(req, res)
);

app.delete('/api/jobs/:jobId', authService.authenticateToken.bind(authService), (req, res) => 
  jobController.cancelarJob(req, res)
);

app.post('/api/jobs/executar-agora/:jobId', authService.authenticateToken.bind(authService), (req, res) => 
  jobController.executarJobAgora(req, res)
);

app.get('/api/jobs/:jobId/logs', authService.authenticateToken.bind(authService), (req, res) => 
  jobController.obterLogsJob(req, res)
);

app.post('/api/jobs/validar-cron', (req, res) => 
  jobController.validarCron(req, res)
);

// Manter compatibilidade com endpoints antigos
app.post('/api/criar-aba', (req, res) => 
  sheetsController.criarAba(req, res)
);

app.post('/api/dados', (req, res) => {
  // Adapter para o formato antigo
  const { nome, email, spreadsheetId, nomeAba } = req.body;
  req.body = {
    spreadsheetId,
    nomeAba,
    Nome: nome,
    Email: email
  };
  return sheetsController.salvarDados(req, res);
});

// Documentação principal
app.get('/', (req: Request, res: Response) => {
  res.type('html').send(`
    <h1>📊 Dashboard Backend API</h1>    <h2>🏗️ Nova Arquitetura SaaS</h2>
    <p><strong>Persistência:</strong> Google Sheets como banco de dados</p>
    <p><strong>Multi-usuário:</strong> Cada usuário tem suas próprias configurações</p>
    
    <h2>� Endpoints de Autenticação</h2>
    <ul>
      <li><code>POST /api/auth/register</code> - Cadastro de usuário</li>
      <li><code>POST /api/auth/login</code> - Login e geração de token JWT</li>
      <li><code>GET /api/auth/me</code> - Dados do usuário autenticado</li>
      <li><code>POST /api/auth/logout</code> - Logout</li>
    </ul>
    
    <h2>�🔧 Endpoints de Configuração</h2>
    <ul>
      <li><code>POST /api/config/init</code> - Inicializa planilha de configuração</li>      <li><code>POST /api/config/redmine</code> - Salva configuração Redmine</li>
      <li><code>GET /api/config/redmine</code> - Obter config Redmine do usuário logado</li>      <li><code>POST /api/config/redmine/test</code> - Testar conexão Redmine do usuário logado</li>
    </ul>
      <h2>📋 Endpoints de Filtros - CRUD Completo</h2>
    <ul>
      <li><code>POST /api/filtros</code> - Criar novo filtro</li>
      <li><code>GET /api/filtros</code> - Listar filtros do usuário logado</li>
      <li><code>GET /api/filtros/{filtroId}/detalhes</code> - Obter detalhes de um filtro</li>
      <li><code>PUT /api/filtros/{filtroId}</code> - Atualizar filtro existente</li>
      <li><code>DELETE /api/filtros/{filtroId}</code> - Excluir filtro</li>
    </ul>
      <h2>📊 Endpoints de Exportação</h2>
    <ul>
      <li><code>GET /api/exportacoes</code> - Histórico de exportações do usuário logado</li>
      <li><code>POST /api/export/por-filtro/{filtroId}</code> - Exportar usando filtro salvo</li>
    </ul>    <h2>⏰ Endpoints de Jobs Agendados</h2>
    <ul>      <li><code>POST /api/jobs</code> - Criar job agendado</li>
      <li><code>GET /api/jobs</code> - Listar jobs do usuário logado</li>
      <li><code>PUT /api/jobs/{jobId}</code> - Atualizar job existente</li>
      <li><code>DELETE /api/jobs/{jobId}</code> - Cancelar job</li>
      <li><code>POST /api/jobs/executar-agora/{jobId}</code> - Executar job manualmente</li>
      <li><code>GET /api/jobs/{jobId}/logs</code> - Ver logs de execução</li>
    </ul>

    <h2>📋 Endpoints Google Sheets (Compatibilidade)</h2>
    <ul>
      <li><code>GET /api/sheets/{id}/abas</code> - Lista abas</li>
      <li><code>POST /api/sheets/criar-aba</code> - Cria nova aba</li>
      <li><code>POST /api/sheets/salvar-dados</code> - Salva dados</li>    </ul>
    
    <h2>🚀 Fluxo de Uso SaaS</h2>
    <ol>
      <li><strong>Autenticar:</strong> POST /api/auth/register ou POST /api/auth/login</li>
      <li><strong>Inicializar:</strong> POST /api/config/init</li>      <li><strong>Configurar Redmine:</strong> POST /api/config/redmine</li>
      <li><strong>Criar Filtros:</strong> POST /api/filtros (usando nomes legíveis)</li>
      <li><strong>Exportar:</strong> POST /api/export/por-filtro/{filtroId}</li>
      <li><strong>Agendar Jobs:</strong> POST /api/jobs (sincronização automática)</li>
      <li><strong>Ver Histórico:</strong> GET /api/exportacoes</li>
    </ol>
    
    <h2>🔐 Exemplo de Registro/Login</h2>
    <h3>Registro:</h3>
    <pre>POST /api/auth/register
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "minhasenha123"
}</pre>
    
    <h3>Login:</h3>
    <pre>POST /api/auth/login
{
  "email": "joao@empresa.com",
  "password": "minhasenha123"
}</pre>
    
    <h3>Usar Token (Header):</h3>
    <pre>Authorization: Bearer &lt;token_jwt&gt;</pre>
    
    <h2>📝 Exemplo de Filtro com Nomes Legíveis</h2>
    <pre>{
  "user_id": "usuario123",
  "nome": "Issues Abertas do Projeto XYZ",
  "projeto": "Projeto XYZ",
  "status": "Aberto",
  "assignedTo": "João Silva",
  "priority": "Alta",
  "tracker": "Bug",
  "data_inicio": "2024-01-01",
  "data_fim": "2024-12-31"
}</pre>
    <p><strong>Nota:</strong> O backend fará o mapeamento automático dos nomes para IDs do Redmine.</p>
      <h2>🎯 Exemplo Completo de Uso</h2>    <h3>1. Configurar Redmine:</h3>
    <pre>POST /api/config/redmine
{
  "redmine_url": "https://meuredmine.com",
  "api_key": "sua_api_key_aqui"
}</pre>

    <h3>2. Criar Filtro com Nomes Legíveis:</h3>
    <pre>POST /api/filtros
{
  "nome": "Bugs Críticos do Projeto XYZ",
  "projeto": "Projeto XYZ",
  "status": "Novo",
  "priority": "Imediato",
  "tracker": "Bug",
  "data_inicio": "2024-01-01"
}</pre>

    <h3>3. Exportar Usando o Filtro:</h3>
    <pre>POST /api/export/por-filtro/filtro_1234567890
{
}</pre>

    <p><strong>✨ Vantagem:</strong> Você trabalha com nomes legíveis no frontend, e o backend faz todo o mapeamento para IDs automaticamente!</p>

    <h2>💾 Estrutura de Dados (Google Sheets)</h2>
    <p>A aplicação usa as seguintes abas na planilha de configuração:</p>
    <ul>
      <li><strong>config_redmine:</strong> Configurações de conexão Redmine por usuário</li>
      <li><strong>config_sheets:</strong> Configurações de planilhas por usuário</li>
      <li><strong>filtros:</strong> Filtros salvos por usuário (com nomes legíveis)</li>
      <li><strong>exportacoes_logs:</strong> Histórico de exportações com estatísticas</li>
    </ul>
    
    <h2>📋 Como Usar o Endpoint /api/sheets/salvar-dados</h2>
    <h3>Exemplo de Payload:</h3>
    <pre>{

  "spreadsheetId": "1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI",
  "nomeAba": "Dados2024",
  "Nome": "João Silva",
  "Email": "joao@email.com",
  "Telefone": "(11) 99999-9999",
  "Empresa": "Minha Empresa LTDA",
  "Cargo": "Desenvolvedor"
}</pre>
    
    <h3>📝 Regras:</h3>
    <ul>
      <li><strong>Campos obrigatórios:</strong> spreadsheetId, nomeAba</li>
      <li><strong>Campos dinâmicos:</strong> Qualquer outro campo será mapeado para as colunas da planilha</li>
      <li><strong>Mapeamento:</strong> O nome do campo deve corresponder exatamente ao cabeçalho da coluna</li>
      <li><strong>Flexibilidade:</strong> Você pode enviar quantos campos quiser</li>
    </ul>
      <h2>📋 Endpoints Google Sheets</h2>
    <ul>
      <li><code>GET /api/sheets/{id}/abas</code> - Lista abas</li>
      <li><code>POST /api/sheets/criar-aba</code> - Cria nova aba</li>
      <li><code>POST /api/sheets/salvar-dados</code> - Salva dados</li>    </ul>
      <h2>🔗 Links</h2>
    <p><a href="/api-docs">📖 Documentação Swagger interativa</a></p>
    <p><strong>Alternativa se o Swagger não carregar:</strong></p>
    <ul>
      <li>📄 <a href="/api-docs.json">Swagger JSON</a> - Cole no <a href="https://editor.swagger.io" target="_blank">Swagger Editor</a></li>
      <li>🌐 Use Postman, Insomnia ou outra ferramenta de API</li>
    </ul>
      <h2>✅ Boas Práticas Implementadas</h2>
    <ul>
      <li>Separação de responsabilidades (MVC)</li>
      <li>Validação de dados robusta</li>
      <li>Tratamento de erros padronizado</li>
      <li>Tipagem TypeScript completa</li>
      <li>Verificação de integridade (aba existe?)</li>
      <li>Mapeamento dinâmico de colunas</li>
      <li>Endpoints RESTful organizados</li>
      <li><strong>Rate Limiting:</strong> Proteção contra abuse de API</li>
      <li><strong>Operações em Batch:</strong> Redução de requisições ao Google Sheets</li>
      <li><strong>Controle de Quota:</strong> Gerenciamento inteligente da API do Google</li>
    </ul>
    
    <h2>⚡ Rate Limits</h2>
    <ul>
      <li><strong>API Geral:</strong> 100 requisições por 15 minutos</li>
      <li><strong>Google Sheets:</strong> 30 requisições por minuto</li>
      <li><strong>Redmine:</strong> 20 requisições por minuto</li>
      <li><strong>Exportações:</strong> 5 exportações por 5 minutos</li>
    </ul>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📖 Documentação: http://localhost:${PORT}/api-docs`);
  console.log(`🏠 Home: http://localhost:${PORT}`);
  console.log(`✅ Arquitetura com boas práticas implementada!`);
});
