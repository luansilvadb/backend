import { Request, Response } from 'express';
import { redmineService } from '../services/RedmineService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { 
  ConfigurarRedmineRequest, 
  BuscarIssuesRequest, 
  ExportarRedmineRequest,
  validateRedmineConfig,
  validateExportarRedmine,
  SheetResponse
} from '../types';

const googleSheetsService = new GoogleSheetsService();

export class RedmineController {
    // POST /api/redmine/configurar
  async configurarRedmine(req: Request, res: Response) {
    console.log('=== CONFIGURAR REDMINE ===');
    console.log('Body recebido:', req.body);

    try {
      const request: ConfigurarRedmineRequest = req.body;
      const errors = validateRedmineConfig(request);
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors
        });
      }

      // Testar conexão primeiro
      const testeConexao = await redmineService.testarConexao({
        url: request.url,
        apiKey: request.apiKey
      });

      if (!testeConexao.success) {
        return res.status(400).json({
          success: false,
          message: 'Falha na conexão com Redmine',
          error: testeConexao.message
        });
      }

      // Configurar o serviço
      redmineService.setConfig({
        url: request.url,
        apiKey: request.apiKey
      });

      console.log('Configuração do Redmine salva com sucesso');

      res.json({
        success: true,
        message: 'Configuração do Redmine salva com sucesso',
        data: {
          conexaoTeste: testeConexao.data,
          configuracao: {
            url: request.url
          }
        }
      });

    } catch (error: any) {
      console.error('Erro ao configurar Redmine:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/redmine/testar-conexao
  async testarConexao(req: Request, res: Response) {
    console.log('=== TESTAR CONEXÃO REDMINE ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const resultado = await redmineService.testarConexao(config);
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // POST /api/redmine/buscar-issues
  async buscarIssues(req: Request, res: Response) {
    console.log('=== BUSCAR ISSUES REDMINE ===');
    console.log('Body recebido:', req.body);

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const request: BuscarIssuesRequest = req.body;
      const resultado = await redmineService.buscarIssues(request);
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao buscar issues:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // POST /api/redmine/exportar-para-sheets
  async exportarParaSheets(req: Request, res: Response) {
    console.log('=== EXPORTAR REDMINE PARA SHEETS ===');
    console.log('Body recebido:', req.body);

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const request: ExportarRedmineRequest = req.body;      const validationErrors = validateExportarRedmine(request);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: validationErrors
        });
      }

      // Buscar issues do Redmine
      console.log('Buscando issues do Redmine...');
      const resultadoIssues = await redmineService.buscarIssues({
        limit: 1000, // buscar todas até 1000
        filtros: request.filtros
      });

      if (!resultadoIssues.success || !resultadoIssues.data) {
        return res.status(400).json({
          success: false,
          message: 'Falha ao buscar issues do Redmine',
          error: resultadoIssues.message
        });
      }

      const issues = resultadoIssues.data.issues;
      
      if (issues.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nenhuma issue encontrada com os filtros especificados',
          data: {
            totalIssues: 0,
            issuesExportadas: 0
          }
        });
      }

      // Converter issues para formato de planilha
      console.log(`Convertendo ${issues.length} issues para formato de planilha...`);
      const dadosPlanilha = redmineService.convertIssuesParaPlanilha(issues, request.campos);      // Verificar se a aba existe, se não, criar
      console.log('Verificando se aba existe...');
      const abasExistentes = await googleSheetsService.listarAbas(request.spreadsheetId);
      
      if (!abasExistentes.includes(request.nomeAba)) {
        console.log(`Criando aba "${request.nomeAba}"...`);
        const colunas = Object.keys(dadosPlanilha[0] || {});
        const resultadoCriarAba = await googleSheetsService.criarAba({
          spreadsheetId: request.spreadsheetId,
          nomeAba: request.nomeAba,
          colunas
        });
        
        if (!resultadoCriarAba.success) {
          return res.status(400).json({
            success: false,
            message: 'Falha ao criar aba na planilha',
            error: resultadoCriarAba.message
          });
        }
      }      // Salvar dados na planilha usando batch (mais eficiente)
      console.log('Salvando dados na planilha em batch...');
      const resultado = await googleSheetsService.salvarDadosEmBatch(
        request.spreadsheetId,
        request.nomeAba,
        dadosPlanilha
      );

      if (!resultado.success) {
        return res.status(400).json({
          success: false,
          message: 'Falha ao salvar dados na planilha',
          error: resultado.message
        });
      }

      const planilhaUrl = `https://docs.google.com/spreadsheets/d/${request.spreadsheetId}`;

      const response: SheetResponse = {
        success: true,
        message: `Exportação concluída: ${issues.length} issues exportadas`,
        data: {
          spreadsheetId: request.spreadsheetId,
          nomeAba: request.nomeAba,
          planilhaUrl,
          dadosProcessados: issues.length
        }
      };

      console.log(`Exportação finalizada: ${issues.length} issues salvas`);
      res.json(response);

    } catch (error: any) {
      console.error('Erro ao exportar para sheets:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/redmine/projetos
  async buscarProjetos(req: Request, res: Response) {
    console.log('=== BUSCAR PROJETOS REDMINE ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const resultado = await redmineService.buscarProjetos();
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao buscar projetos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/redmine/status
  async buscarStatus(req: Request, res: Response) {
    console.log('=== BUSCAR STATUS REDMINE ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const resultado = await redmineService.buscarStatus();
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao buscar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/redmine/usuarios
  async buscarUsuarios(req: Request, res: Response) {
    console.log('=== BUSCAR USUÁRIOS REDMINE ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const resultado = await redmineService.buscarUsuarios();
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/redmine/prioridades
  async buscarPrioridades(req: Request, res: Response) {
    console.log('=== BUSCAR PRIORIDADES REDMINE ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const resultado = await redmineService.buscarPrioridades();
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao buscar prioridades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/redmine/trackers
  async buscarTrackers(req: Request, res: Response) {
    console.log('=== BUSCAR TIPOS DE ISSUE ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const resultado = await redmineService.buscarTrackers();
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao buscar tipos de issue:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/redmine/custom-fields
  async buscarCustomFields(req: Request, res: Response) {
    console.log('=== BUSCAR CAMPOS CUSTOMIZADOS ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuração do Redmine não encontrada. Configure primeiro.'
        });
      }

      const resultado = await redmineService.buscarCustomFields();
      
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao buscar campos customizados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // GET /api/redmine/configuracao
  async obterConfiguracao(req: Request, res: Response) {
    console.log('=== OBTER CONFIGURAÇÃO REDMINE ===');

    try {
      const config = redmineService.getConfig();
      
      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuração do Redmine não encontrada'
        });
      }

      // Não retornar a API Key por segurança
      const configSegura = {
        url: config.url
      };

      res.json({
        success: true,
        message: 'Configuração encontrada',
        data: configSegura
      });

    } catch (error: any) {
      console.error('Erro ao obter configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

export const redmineController = new RedmineController();
