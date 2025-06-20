import { Request, Response } from 'express';
import { AuthRequest } from '../services/AuthService';
import { configSheetsService } from '../services/ConfigSheetsService';
import { redmineService } from '../services/RedmineService';

export class ConfigController {  // POST /api/config/init
  async inicializarConfig(req: AuthRequest, res: Response) {
    console.log('=== INICIALIZAR CONFIGURAÇÃO ===');
    console.log('Body recebido:', req.body);

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const { spreadsheet_id } = req.body;

      if (!spreadsheet_id) {
        return res.status(400).json({
          success: false,
          message: 'spreadsheet_id é obrigatório'
        });
      }

      // Primeiro inicializar a planilha de configuração principal
      const resultadoInit = await configSheetsService.inicializarPlanilhaConfig();
      
      if (!resultadoInit.success) {
        return res.status(400).json({
          success: false,
          message: resultadoInit.message
        });
      }

      // Verificar se já existe configuração para este usuário
      const configExistente = await configSheetsService.buscarConfigSheets(user_id);

      if (configExistente) {
        // Se já existe, apenas retornar a configuração existente
        return res.json({
          success: true,
          message: 'Configuração já existe para este usuário',
          data: {
            user_id: user_id,
            spreadsheet_id: configExistente.spreadsheet_id,
            nome_aba_dados: configExistente.nome_aba_dados,
            nome_aba_logs: configExistente.nome_aba_logs,
            config_existed: true,
            abas_inicializadas: resultadoInit.message
          }
        });
      }

      // Se não existe, criar nova configuração para o usuário logado
      const configSheets = {
        user_id: user_id,
        spreadsheet_id: spreadsheet_id,
        nome_aba_dados: 'dados_redmine',
        nome_aba_logs: 'logs_exportacao'
      };

      const resultadoConfig = await configSheetsService.salvarConfigSheets(configSheets);

      if (resultadoConfig.success) {
        res.json({
          success: true,
          message: 'Planilha inicializada com sucesso e configuração criada para o usuário',
          data: {
            user_id: user_id,
            spreadsheet_id: spreadsheet_id,
            nome_aba_dados: 'dados_redmine',
            nome_aba_logs: 'logs_exportacao',
            config_created: true,
            abas_inicializadas: resultadoInit.message
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Erro ao criar configuração: ${resultadoConfig.message}`
        });
      }

    } catch (error: any) {
      console.error('Erro ao inicializar config:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // POST /api/config/redmine
  async salvarConfigRedmine(req: AuthRequest, res: Response) {
    console.log('=== SALVAR CONFIG REDMINE ===');
    console.log('Body recebido:', req.body);

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const { redmine_url, api_key } = req.body;

      // Validações básicas
      if (!redmine_url || !api_key) {
        return res.status(400).json({
          success: false,
          message: 'redmine_url e api_key são obrigatórios'
        });
      }

      // Testar conexão primeiro
      const testeConexao = await redmineService.testarConexao({
        url: redmine_url,
        apiKey: api_key
      });

      if (!testeConexao.success) {
        return res.status(400).json({
          success: false,
          message: 'Falha na conexão com Redmine',
          error: testeConexao.message
        });
      }

      // Salvar configuração
      const resultado = await configSheetsService.salvarConfigRedmine({
        user_id,
        redmine_url,
        api_key
      });

      if (resultado.success) {
        // Configurar o serviço Redmine também
        redmineService.setConfig({
          url: redmine_url,
          apiKey: api_key
        });

        res.json({
          success: true,
          message: resultado.message,
          data: {
            conexaoTeste: testeConexao.data,
            user_id
          }
        });
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao salvar config Redmine:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // GET /api/config/redmine
  async obterConfigRedmine(req: AuthRequest, res: Response) {
    console.log('=== OBTER CONFIG REDMINE ===');

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const config = await configSheetsService.buscarConfigRedmine(user_id);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuração Redmine não encontrada para este usuário'
        });
      }      // Retornar configuração incluindo API Key
      const configSegura = {
        redmine_url: config.redmine_url,
        api_key: config.api_key
      };

      res.json({
        success: true,
        message: 'Configuração encontrada',
        data: configSegura
      });

    } catch (error: any) {
      console.error('Erro ao obter config Redmine:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }  }

  // POST /api/filtros
  async salvarFiltro(req: AuthRequest, res: Response) {
    console.log('=== SALVAR FILTRO ===');
    console.log('Body recebido:', req.body);

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const { nome, projeto, status, assignedTo, priority, tracker, data_inicio, data_fim } = req.body;      // Validações básicas
      if (!nome) {
        return res.status(400).json({
          success: false,
          message: 'nome é obrigatório'
        });
      }      // Buscar configuração do Redmine para carregar metadados se necessário
      const configRedmine = await configSheetsService.buscarConfigRedmine(user_id);
      if (configRedmine) {
        // Configurar o serviço Redmine temporariamente para carregar metadados
        redmineService.setConfig({
          url: configRedmine.redmine_url,
          apiKey: configRedmine.api_key
        });

        // Carregar metadados para validação dos nomes
        await redmineService.carregarMetadados();
      }

      const resultado = await configSheetsService.salvarFiltro({
        user_id,
        nome,
        projeto: projeto || '',
        status: status || '',
        assignedTo: assignedTo || '',
        priority: priority || '',
        tracker: tracker || '',
        data_inicio: data_inicio || '',
        data_fim: data_fim || ''
      });

      if (resultado.success) {
        res.json({
          success: true,
          message: resultado.message,
          data: {
            filtroId: resultado.filtroId,
            user_id,
            nome,
            observacao: 'Filtro salvo com nomes legíveis. O mapeamento para IDs será feito durante a exportação.'
          }
        });
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao salvar filtro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // GET /api/filtros
  async listarFiltros(req: AuthRequest, res: Response) {
    console.log('=== LISTAR FILTROS ===');

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const filtros = await configSheetsService.buscarFiltros(user_id);

      res.json({
        success: true,
        message: `${filtros.length} filtro(s) encontrado(s)`,
        data: filtros
      });

    } catch (error: any) {
      console.error('Erro ao listar filtros:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // GET /api/exportacoes
  async listarExportacoes(req: AuthRequest, res: Response) {
    console.log('=== LISTAR EXPORTAÇÕES ===');

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const logs = await configSheetsService.buscarLogsExportacao(user_id);

      res.json({
        success: true,
        message: `${logs.length} exportação(ões) encontrada(s)`,
        data: logs
      });

    } catch (error: any) {
      console.error('Erro ao listar exportações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // POST /api/export/por-filtro/:filtroId
  async exportarPorFiltro(req: AuthRequest, res: Response) {
    console.log('=== EXPORTAR POR FILTRO ===');

    try {
      const { filtroId } = req.params;
      
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      if (!filtroId) {
        return res.status(400).json({
          success: false,
          message: 'filtroId é obrigatório'
        });
      }

      // Buscar o filtro
      const filtro = await configSheetsService.buscarFiltroPorId(filtroId);
      if (!filtro) {
        return res.status(404).json({
          success: false,
          message: 'Filtro não encontrado'
        });
      }

      // Verificar se o filtro pertence ao usuário
      if (filtro.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Filtro não pertence a este usuário'
        });
      }

      // Buscar configs do usuário
      const configRedmine = await configSheetsService.buscarConfigRedmine(user_id);
      const configSheets = await configSheetsService.buscarConfigSheets(user_id);

      if (!configRedmine || !configSheets) {
        return res.status(400).json({
          success: false,
          message: 'Configurações do Redmine e/ou Sheets não encontradas. Configure primeiro.'
        });
      }      // Configurar e executar exportação
      redmineService.setConfig({
        url: configRedmine.redmine_url,
        apiKey: configRedmine.api_key
      });

      // Carregar metadados para fazer o mapeamento nome->ID
      await redmineService.carregarMetadados();

      // Mapear nomes do filtro para IDs
      const filtroParaBusca: any = {};
      
      if (filtro.projeto) {
        const projetoId = redmineService.mapearNomeParaId('projeto', filtro.projeto);
        if (projetoId) filtroParaBusca.projectId = projetoId;
      }

      if (filtro.status) {
        const statusId = redmineService.mapearNomeParaId('status', filtro.status);
        if (statusId) filtroParaBusca.status = statusId.toString();
      }

      if (filtro.assignedTo) {
        const usuarioId = redmineService.mapearNomeParaId('usuario', filtro.assignedTo);
        if (usuarioId) filtroParaBusca.assignedTo = usuarioId.toString();
      }

      if (filtro.priority) {
        const prioridadeId = redmineService.mapearNomeParaId('prioridade', filtro.priority);
        if (prioridadeId) filtroParaBusca.priority = prioridadeId.toString();
      }

      if (filtro.tracker) {
        const trackerId = redmineService.mapearNomeParaId('tracker', filtro.tracker);
        if (trackerId) filtroParaBusca.tracker = trackerId.toString();
      }

      if (filtro.data_inicio && filtro.data_fim) {
        filtroParaBusca.createdOn = `><${filtro.data_inicio}|${filtro.data_fim}`;
      } else if (filtro.data_inicio) {
        filtroParaBusca.createdOn = `>=${filtro.data_inicio}`;
      } else if (filtro.data_fim) {
        filtroParaBusca.createdOn = `<=${filtro.data_fim}`;
      }

      console.log('🔍 Filtro original (nomes):', {
        projeto: filtro.projeto,
        status: filtro.status,
        assignedTo: filtro.assignedTo,
        priority: filtro.priority,
        tracker: filtro.tracker
      });

      console.log('🔢 Filtro mapeado (IDs):', filtroParaBusca);

      // Buscar issues com o filtro mapeado
      const resultadoIssues = await redmineService.buscarIssues({
        limit: 1000,
        filtros: filtroParaBusca
      });

      if (!resultadoIssues.success || !resultadoIssues.data) {
        await configSheetsService.salvarLogExportacao({
          user_id,
          filtro_usado: filtro.nome,
          total_issues: 0,
          sucesso: false,
          erro: resultadoIssues.message,
          aba_destino: configSheets.nome_aba_dados
        });

        return res.status(400).json({
          success: false,
          message: 'Falha ao buscar issues do Redmine',
          error: resultadoIssues.message
        });
      }

      const issues = resultadoIssues.data.issues;
      
      // Salvar log de sucesso
      await configSheetsService.salvarLogExportacao({
        user_id,
        filtro_usado: filtro.nome,
        total_issues: issues.length,
        sucesso: true,
        aba_destino: configSheets.nome_aba_dados
      });

      res.json({
        success: true,
        message: `Exportação executada com sucesso: ${issues.length} issues encontradas`,
        data: {
          filtro: filtro.nome,
          totalIssues: issues.length,
          filtroOriginal: {
            projeto: filtro.projeto,
            status: filtro.status,
            assignedTo: filtro.assignedTo,
            priority: filtro.priority,
            tracker: filtro.tracker
          },
          filtroMapeado: filtroParaBusca,
          aba_destino: configSheets.nome_aba_dados,
          planilhaUrl: `https://docs.google.com/spreadsheets/d/${configSheets.spreadsheet_id}`
        }
      });

    } catch (error: any) {
      console.error('Erro na exportação por filtro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }  }
  // PUT /api/filtros/:filtroId
  async atualizarFiltro(req: AuthRequest, res: Response) {
    console.log('=== ATUALIZAR FILTRO ===');

    try {
      const { filtroId } = req.params;
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }      const { nome, projeto, status, assignedTo, priority, tracker, data_inicio, data_fim } = req.body;

      if (!filtroId) {
        return res.status(400).json({
          success: false,
          message: 'filtroId é obrigatório'
        });
      }

      // Validar se o usuário existe
      const usuarioExiste = await configSheetsService.verificarUsuarioExiste(user_id as string);
      if (!usuarioExiste) {
        return res.status(404).json({
          success: false,
          message: `Usuário com ID '${user_id}' não encontrado ou inativo.`
        });
      }

      // Verificar se o filtro existe e pertence ao usuário
      const filtroExistente = await configSheetsService.buscarFiltroPorId(filtroId);
      if (!filtroExistente) {
        return res.status(404).json({
          success: false,
          message: 'Filtro não encontrado'
        });
      }

      if (filtroExistente.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Filtro não pertence a este usuário'
        });
      }      // Atualizar o filtro existente
      const resultado = await configSheetsService.atualizarFiltro(filtroId, {
        user_id,
        nome: nome || filtroExistente.nome,
        projeto: projeto !== undefined ? projeto : filtroExistente.projeto,
        status: status !== undefined ? status : filtroExistente.status,
        assignedTo: assignedTo !== undefined ? assignedTo : filtroExistente.assignedTo,
        priority: priority !== undefined ? priority : filtroExistente.priority,
        tracker: tracker !== undefined ? tracker : filtroExistente.tracker,
        data_inicio: data_inicio !== undefined ? data_inicio : filtroExistente.data_inicio,
        data_fim: data_fim !== undefined ? data_fim : filtroExistente.data_fim
      });

      if (resultado.success) {
        res.json({
          success: true,
          message: 'Filtro atualizado com sucesso',
          data: {
            filtroId: resultado.filtroId
          }
        });
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao atualizar filtro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }  // DELETE /api/filtros/:filtroId
  async excluirFiltro(req: AuthRequest, res: Response) {
    console.log('=== EXCLUIR FILTRO ===');

    try {
      const { filtroId } = req.params;
      
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      if (!filtroId) {
        return res.status(400).json({
          success: false,
          message: 'filtroId é obrigatório'
        });
      }

      // Validar se o usuário existe
      const usuarioExiste = await configSheetsService.verificarUsuarioExiste(user_id);
      if (!usuarioExiste) {
        return res.status(404).json({
          success: false,
          message: `Usuário com ID '${user_id}' não encontrado ou inativo.`
        });
      }

      // Verificar se o filtro existe e pertence ao usuário
      const filtroExistente = await configSheetsService.buscarFiltroPorId(filtroId);
      if (!filtroExistente) {
        return res.status(404).json({
          success: false,
          message: 'Filtro não encontrado'
        });
      }

      if (filtroExistente.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Filtro não pertence a este usuário'
        });
      }

      // Implementar exclusão lógica na planilha
      const resultado = await configSheetsService.excluirFiltro(filtroId);
      
      if (resultado.success) {
        res.json({
          success: true,
          message: 'Filtro excluído com sucesso',
          data: {
            filtroId,
            nome: filtroExistente.nome
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.message || 'Erro ao excluir filtro'
        });
      }

    } catch (error: any) {
      console.error('Erro ao excluir filtro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // GET /api/filtros/:filtroId/detalhes
  async obterFiltro(req: AuthRequest, res: Response) {
    console.log('=== OBTER FILTRO ===');

    try {
      const { filtroId } = req.params;
      
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      if (!filtroId) {
        return res.status(400).json({
          success: false,
          message: 'filtroId é obrigatório'
        });
      }

      const filtro = await configSheetsService.buscarFiltroPorId(filtroId);
      
      if (!filtro) {
        return res.status(404).json({
          success: false,
          message: 'Filtro não encontrado'
        });
      }

      // Verificar se o filtro pertence ao usuário logado
      if (filtro.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Filtro não pertence a este usuário'
        });
      }

      res.json({
        success: true,
        message: 'Filtro encontrado',
        data: filtro
      });

    } catch (error: any) {
      console.error('Erro ao obter filtro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // POST /api/config/redmine/test
  async testarConexaoRedmine(req: AuthRequest, res: Response) {
    console.log('=== TESTAR CONEXÃO REDMINE ===');

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      // Buscar configuração do Redmine do usuário
      const config = await configSheetsService.buscarConfigRedmine(user_id);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuração Redmine não encontrada. Configure primeiro através do endpoint POST /api/config/redmine'
        });
      }

      // Testar conexão usando a configuração encontrada
      const resultado = await redmineService.testarConexao({
        url: config.redmine_url,
        apiKey: config.api_key
      });

      if (resultado.success) {
        res.json({
          success: true,
          message: 'Conexão com Redmine testada com sucesso',
          data: {
            ...resultado.data,
            redmine_url: config.redmine_url
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Falha na conexão com Redmine',
          error: resultado.message,
          redmine_url: config.redmine_url
        });
      }

    } catch (error: any) {
      console.error('Erro ao testar conexão Redmine:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }  }

  // GET /api/config/init
  async obterConfigInit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }

      const config = await configSheetsService.buscarConfigSheets(userId);
      
      if (!config) {
        res.status(404).json({ 
          error: 'Configuração inicial não encontrada',
          message: 'Execute POST /api/config/init primeiro para inicializar'
        });
        return;
      }      // Retornar apenas o spreadsheet_id (config inicial)
      res.json({
        spreadsheet_id: config.spreadsheet_id,
        nome_aba_dados: config.nome_aba_dados,
        nome_aba_logs: config.nome_aba_logs
      });
    } catch (error) {
      console.error('Erro ao obter configuração inicial:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const configController = new ConfigController();
