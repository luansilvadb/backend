import { GoogleSheetsService } from './GoogleSheetsService';

export interface ConfigRedmine {
  user_id: string;
  redmine_url: string;
  api_key: string;
}

export interface ConfigSheets {
  user_id: string;
  spreadsheet_id: string;
  nome_aba_dados: string;
  nome_aba_logs: string;
}

export interface Filtro {
  filtro_id: string;
  user_id: string;
  nome: string;
  projeto?: string;
  status?: string;
  assignedTo?: string;
  priority?: string;
  tracker?: string;
  data_inicio?: string;
  data_fim?: string;
  criado_em: string;
}

export interface ExportacaoLog {
  log_id: string;
  user_id: string;
  filtro_usado: string;
  total_issues: number;
  sucesso: boolean;
  erro?: string;
  data_exportacao: string;
  aba_destino: string;
}

export class ConfigSheetsService {
  private googleSheetsService: GoogleSheetsService;
  private configSpreadsheetId: string;

  constructor(configSpreadsheetId: string) {
    this.googleSheetsService = new GoogleSheetsService();
    this.configSpreadsheetId = configSpreadsheetId;
  }

  async inicializarPlanilhaConfig(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Inicializando planilha de configuração...');      // Verificar se as abas necessárias existem
      const abasExistentes = await this.googleSheetsService.listarAbas(this.configSpreadsheetId);
      const abasNecessarias = [
        'config_redmine', 
        'config_sheets', 
        'filtros', 
        'exportacoes_logs',
        'users',
        'jobs_agendados',
        'logs_execucao_jobs'
      ];

      for (const aba of abasNecessarias) {
        if (!abasExistentes.includes(aba)) {
          console.log(`📝 Criando aba: ${aba}`);
          let colunas: string[] = [];

          switch (aba) {            case 'config_redmine':
              colunas = ['user_id', 'redmine_url', 'api_key', 'atualizado_em'];
              break;
            case 'config_sheets':
              colunas = ['user_id', 'spreadsheet_id', 'nome_aba_dados', 'nome_aba_logs', 'atualizado_em'];
              break;
            case 'filtros':
              colunas = ['filtro_id', 'user_id', 'nome', 'projeto', 'status', 'assignedTo', 'priority', 'tracker', 'data_inicio', 'data_fim', 'criado_em'];
              break;            case 'exportacoes_logs':
              colunas = ['log_id', 'user_id', 'filtro_usado', 'total_issues', 'sucesso', 'erro', 'data_exportacao', 'aba_destino'];
              break;
            case 'users':
              colunas = ['user_id', 'name', 'email', 'password', 'created_at', 'active'];
              break;
            case 'jobs_agendados':
              colunas = ['job_id', 'user_id', 'nome', 'filtro_id', 'cron_expression', 'ativo', 'aba_destino', 'sobrescrever_dados', 'incluir_cabecalhos', 'criado_em', 'ultima_execucao', 'proxima_execucao', 'total_execucoes'];
              break;
            case 'logs_execucao_jobs':
              colunas = ['log_id', 'job_id', 'user_id', 'status', 'total_issues', 'erro_detalhes', 'data_execucao', 'tempo_execucao_ms'];
              break;
          }

          const resultado = await this.googleSheetsService.criarAba({
            spreadsheetId: this.configSpreadsheetId,
            nomeAba: aba,
            colunas
          });

          if (!resultado.success) {
            return { success: false, message: `Erro ao criar aba ${aba}: ${resultado.message}` };
          }
        }
      }

      return { success: true, message: 'Planilha de configuração inicializada com sucesso' };

    } catch (error: any) {
      console.error('Erro ao inicializar planilha config:', error);
      return { success: false, message: `Erro ao inicializar: ${error.message}` };
    }
  }
  // ==================== CONFIG REDMINE ====================
  async salvarConfigRedmine(config: ConfigRedmine): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar se já existe config para este usuário
      const configExistente = await this.buscarConfigRedmine(config.user_id);

      const dados = {
        user_id: config.user_id,
        redmine_url: config.redmine_url,
        api_key: config.api_key,
        atualizado_em: new Date().toISOString()
      };

      if (configExistente) {
        // Atualizar configuração existente
        // TODO: Implementar update específico de linha
        console.log('⚠️ Config já existe, será adicionada nova linha (implementar update futuro)');
      }

      const resultado = await this.googleSheetsService.salvarDados({
        spreadsheetId: this.configSpreadsheetId,
        nomeAba: 'config_redmine',
        dados
      });

      return resultado.success 
        ? { success: true, message: 'Configuração Redmine salva com sucesso' }
        : { success: false, message: `Erro ao salvar config: ${resultado.message}` };

    } catch (error: any) {
      console.error('Erro ao salvar config Redmine:', error);
      return { success: false, message: `Erro interno: ${error.message}` };
    }
  }
  async buscarConfigRedmine(userId: string): Promise<ConfigRedmine | null> {
    try {      // Ler todos os dados da aba config_redmine
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'config_redmine!A:D');
      
      if (rows.length <= 1) return null; // Apenas cabeçalho

      const userRowIndex = rows.findIndex((row: any, index: number) => index > 0 && row[0] === userId);

      if (userRowIndex === -1) return null;      const userRow = rows[userRowIndex];
      
      return {
        user_id: userRow[0],
        redmine_url: userRow[1],
        api_key: userRow[2]
      };

    } catch (error: any) {
      console.error('Erro ao buscar config Redmine:', error);
      return null;
    }
  }

  // ==================== CONFIG SHEETS ====================
  async salvarConfigSheets(config: ConfigSheets): Promise<{ success: boolean; message: string }> {
    try {
      const dados = {
        user_id: config.user_id,
        spreadsheet_id: config.spreadsheet_id,
        nome_aba_dados: config.nome_aba_dados,
        nome_aba_logs: config.nome_aba_logs,
        atualizado_em: new Date().toISOString()
      };

      const resultado = await this.googleSheetsService.salvarDados({
        spreadsheetId: this.configSpreadsheetId,
        nomeAba: 'config_sheets',
        dados
      });

      return resultado.success 
        ? { success: true, message: 'Configuração Sheets salva com sucesso' }
        : { success: false, message: `Erro ao salvar config: ${resultado.message}` };

    } catch (error: any) {
      console.error('Erro ao salvar config Sheets:', error);
      return { success: false, message: `Erro interno: ${error.message}` };
    }
  }
  async buscarConfigSheets(userId: string): Promise<ConfigSheets | null> {
    try {
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'config_sheets!A:E');
      
      if (rows.length <= 1) return null;

      const userRowIndex = rows.findIndex((row: any, index: number) => index > 0 && row[0] === userId);
      if (userRowIndex === -1) return null;

      const userRow = rows[userRowIndex];
      
      return {
        user_id: userRow[0],
        spreadsheet_id: userRow[1],
        nome_aba_dados: userRow[2],
        nome_aba_logs: userRow[3]
      };

    } catch (error: any) {
      console.error('Erro ao buscar config Sheets:', error);
      return null;
    }
  }
  // ==================== FILTROS ====================
  
  private async gerarProximoIdFiltro(): Promise<string> {
    try {
      // Buscar todos os filtros para determinar o próximo ID
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'filtros!A:A');
      
      if (!rows || rows.length <= 1) {
        // Se não há dados ou só tem o cabeçalho, começar com ID 1
        return '1';
      }

      // Encontrar o maior ID numérico existente
      let maiorId = 0;
      for (let i = 1; i < rows.length; i++) { // Pular cabeçalho (índice 0)
        const id = rows[i][0];
        if (id && !isNaN(Number(id))) {
          const idNumerico = parseInt(id);
          if (idNumerico > maiorId) {
            maiorId = idNumerico;
          }
        }
      }

      // Retornar o próximo ID sequencial
      return (maiorId + 1).toString();

    } catch (error) {
      console.error('Erro ao gerar próximo ID:', error);
      // Em caso de erro, usar timestamp como fallback para evitar conflitos
      return Date.now().toString();
    }
  }

  async salvarFiltro(filtro: Omit<Filtro, 'filtro_id' | 'criado_em'>): Promise<{ success: boolean; message: string; filtroId?: string }> {
    try {
      const filtroId = await this.gerarProximoIdFiltro();
      
      const dados = {
        filtro_id: filtroId,
        user_id: filtro.user_id,
        nome: filtro.nome,
        projeto: filtro.projeto || '',
        status: filtro.status || '',
        assignedTo: filtro.assignedTo || '',
        priority: filtro.priority || '',
        tracker: filtro.tracker || '',
        data_inicio: filtro.data_inicio || '',
        data_fim: filtro.data_fim || '',
        criado_em: new Date().toISOString()
      };

      const resultado = await this.googleSheetsService.salvarDados({
        spreadsheetId: this.configSpreadsheetId,
        nomeAba: 'filtros',
        dados
      });

      return resultado.success 
        ? { success: true, message: 'Filtro salvo com sucesso', filtroId }
        : { success: false, message: `Erro ao salvar filtro: ${resultado.message}` };

    } catch (error: any) {
      console.error('Erro ao salvar filtro:', error);
      return { success: false, message: `Erro interno: ${error.message}` };
    }
  }
  async buscarFiltros(userId: string): Promise<Filtro[]> {
    try {
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'filtros!A:K');
      
      if (rows.length <= 1) return [];

      const filtros: Filtro[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[1] === userId) { // user_id na segunda coluna
          filtros.push({
            filtro_id: row[0],
            user_id: row[1],
            nome: row[2],
            projeto: row[3],
            status: row[4],
            assignedTo: row[5],
            priority: row[6],
            tracker: row[7],
            data_inicio: row[8],
            data_fim: row[9],
            criado_em: row[10]
          });
        }
      }

      return filtros;

    } catch (error: any) {
      console.error('Erro ao buscar filtros:', error);
      return [];
    }
  }
  async buscarFiltroPorId(filtroId: string): Promise<Filtro | null> {
    try {
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'filtros!A:K');
      
      if (rows.length <= 1) return null;

      const filtroRowIndex = rows.findIndex((row: any, index: number) => index > 0 && row[0] === filtroId);
      if (filtroRowIndex === -1) return null;

      const row = rows[filtroRowIndex];
      
      return {
        filtro_id: row[0],
        user_id: row[1],
        nome: row[2],
        projeto: row[3],
        status: row[4],
        assignedTo: row[5],
        priority: row[6],
        tracker: row[7],
        data_inicio: row[8],
        data_fim: row[9],
        criado_em: row[10]
      };

    } catch (error: any) {
      console.error('Erro ao buscar filtro por ID:', error);
      return null;
    }
  }
  // ==================== LOGS DE EXPORTAÇÃO ====================
  
  private async gerarProximoIdLog(): Promise<string> {
    try {
      // Buscar todos os logs para determinar o próximo ID
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'exportacoes_logs!A:A');
      
      if (!rows || rows.length <= 1) {
        // Se não há dados ou só tem o cabeçalho, começar com ID 1
        return '1';
      }

      // Encontrar o maior ID numérico existente
      let maiorId = 0;
      for (let i = 1; i < rows.length; i++) { // Pular cabeçalho (índice 0)
        const id = rows[i][0];
        if (id && !isNaN(Number(id))) {
          const idNumerico = parseInt(id);
          if (idNumerico > maiorId) {
            maiorId = idNumerico;
          }
        }
      }

      // Retornar o próximo ID sequencial
      return (maiorId + 1).toString();

    } catch (error) {
      console.error('Erro ao gerar próximo ID de log:', error);
      // Em caso de erro, usar timestamp como fallback
      return Date.now().toString();
    }
  }

  async salvarLogExportacao(log: Omit<ExportacaoLog, 'log_id' | 'data_exportacao'>): Promise<{ success: boolean; message: string }> {
    try {
      const logId = await this.gerarProximoIdLog();
      
      const dados = {
        log_id: logId,
        user_id: log.user_id,
        filtro_usado: log.filtro_usado,
        total_issues: log.total_issues.toString(),
        sucesso: log.sucesso ? 'SIM' : 'NÃO',
        erro: log.erro || '',
        data_exportacao: new Date().toISOString(),
        aba_destino: log.aba_destino
      };

      const resultado = await this.googleSheetsService.salvarDados({
        spreadsheetId: this.configSpreadsheetId,
        nomeAba: 'exportacoes_logs',
        dados
      });

      return resultado.success 
        ? { success: true, message: 'Log salvo com sucesso' }
        : { success: false, message: `Erro ao salvar log: ${resultado.message}` };

    } catch (error: any) {
      console.error('Erro ao salvar log:', error);
      return { success: false, message: `Erro interno: ${error.message}` };
    }
  }
  async buscarLogsExportacao(userId: string): Promise<ExportacaoLog[]> {
    try {
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'exportacoes_logs!A:H');
      
      if (rows.length <= 1) return [];

      const logs: ExportacaoLog[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[1] === userId) {
          logs.push({
            log_id: row[0],
            user_id: row[1],
            filtro_usado: row[2],
            total_issues: parseInt(row[3]) || 0,
            sucesso: row[4] === 'SIM',
            erro: row[5],
            data_exportacao: row[6],
            aba_destino: row[7]
          });
        }
      }      return logs.reverse(); // Mais recentes primeiro

    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  }  // ==================== EXCLUSÃO DE FILTRO ====================
  async excluirFiltro(filtroId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Excluindo filtro: ${filtroId}`);
      
      // Ler todos os dados da aba filtros
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'filtros!A:K');
      
      if (rows.length <= 1) {
        return {
          success: false,
          message: 'Nenhum filtro encontrado na planilha'
        };
      }

      // Encontrar a linha do filtro a ser excluído
      const filtroRowIndex = rows.findIndex((row: any, index: number) => 
        index > 0 && row[0] === filtroId
      );
      
      if (filtroRowIndex === -1) {
        return {
          success: false,
          message: 'Filtro não encontrado'
        };
      }

      console.log(`📍 Filtro encontrado na linha ${filtroRowIndex + 1}`);

      // Criar nova array sem a linha do filtro
      const novasLinhas = rows.filter((row: any, index: number) => 
        index === 0 || row[0] !== filtroId // Manter cabeçalho e todas as linhas exceto a do filtro
      );

      console.log(`📊 Reescrevendo planilha: ${rows.length - 1} → ${novasLinhas.length - 1} filtros`);

      // Limpar toda a aba e reescrever com os dados filtrados
      const rangeCompleto = `filtros!A1:K${Math.max(rows.length, 10)}`;
      
      // Primeiro, limpar a área
      const valoresVazios = Array(Math.max(rows.length, 10)).fill(null).map(() => 
        Array(11).fill('')
      );
      
      await this.googleSheetsService.atualizarDados(
        this.configSpreadsheetId,
        rangeCompleto,
        valoresVazios
      );

      // Depois, reescrever com os dados corretos
      if (novasLinhas.length > 0) {
        const rangeNovo = `filtros!A1:K${novasLinhas.length}`;
        await this.googleSheetsService.atualizarDados(
          this.configSpreadsheetId,
          rangeNovo,
          novasLinhas
        );
      }

      console.log(`✅ Filtro ${filtroId} excluído com sucesso`);

      return {
        success: true,
        message: 'Filtro excluído com sucesso da planilha'
      };

    } catch (error: any) {
      console.error('❌ Erro ao excluir filtro:', error);
      return {
        success: false,
        message: `Erro interno ao excluir filtro: ${error.message}`      };
    }
  }
  async atualizarFiltro(filtroId: string, dadosAtualizados: any) {
    try {
      console.log('🔄 Atualizando filtro na planilha...', filtroId);      // Buscar todos os filtros para encontrar o índice da linha
      const dados = await this.googleSheetsService.lerDados(
        this.configSpreadsheetId,
        'filtros!A2:K'
      );

      if (!dados || dados.length === 0) {
        return {
          success: false,
          message: 'Nenhum filtro encontrado'
        };
      }

      // Encontrar o índice da linha do filtro
      const indiceLinha = dados.findIndex((linha: any[]) => linha[0] === filtroId);

      if (indiceLinha === -1) {
        return {
          success: false,
          message: 'Filtro não encontrado'
        };
      }

      // Linha na planilha (índice + 2 porque começamos da linha 2 e o array é 0-based)
      const linhaPlanilha = indiceLinha + 2;

      // Obter dados atuais da linha para manter campos não alterados
      const linhaaAtual = dados[indiceLinha];

      // Preparar os dados para atualização (manter valores existentes se não fornecidos)
      const novaLinha = [
        filtroId, // A - filtro_id
        dadosAtualizados.user_id || linhaaAtual[1], // B - user_id
        dadosAtualizados.nome || linhaaAtual[2], // C - nome
        dadosAtualizados.projeto !== undefined ? dadosAtualizados.projeto : (linhaaAtual[3] || ''), // D - projeto
        dadosAtualizados.status !== undefined ? dadosAtualizados.status : (linhaaAtual[4] || ''), // E - status
        dadosAtualizados.assignedTo !== undefined ? dadosAtualizados.assignedTo : (linhaaAtual[5] || ''), // F - assignedTo
        dadosAtualizados.priority !== undefined ? dadosAtualizados.priority : (linhaaAtual[6] || ''), // G - priority
        dadosAtualizados.tracker !== undefined ? dadosAtualizados.tracker : (linhaaAtual[7] || ''), // H - tracker
        dadosAtualizados.data_inicio !== undefined ? dadosAtualizados.data_inicio : (linhaaAtual[8] || ''), // I - data_inicio
        dadosAtualizados.data_fim !== undefined ? dadosAtualizados.data_fim : (linhaaAtual[9] || ''), // J - data_fim
        new Date().toISOString() // K - data_atualizacao
      ];      // Atualizar a linha específica
      const range = `filtros!A${linhaPlanilha}:K${linhaPlanilha}`;
      const sucesso = await this.googleSheetsService.atualizarDados(
        this.configSpreadsheetId,
        range,
        [novaLinha]
      );

      if (sucesso) {
        console.log(`✅ Filtro ${filtroId} atualizado com sucesso na linha ${linhaPlanilha}`);
        return {
          success: true,
          message: 'Filtro atualizado com sucesso',
          filtroId
        };
      } else {
        return {
          success: false,
          message: 'Erro ao atualizar filtro na planilha'
        };
      }

    } catch (error: any) {
      console.error('❌ Erro ao atualizar filtro:', error);
      return {
        success: false,
        message: `Erro interno ao atualizar filtro: ${error.message}`      };
    }
  }

  // ==================== VALIDAÇÃO DE USUÁRIOS ====================
  
  async verificarUsuarioExiste(userId: string): Promise<boolean> {
    try {
      console.log('🔍 Verificando se usuário existe:', userId);
      
      // Buscar todos os usuários na aba users
      const rows = await this.googleSheetsService.lerDados(this.configSpreadsheetId, 'users!A:F');
      
      if (!rows || rows.length <= 1) {
        // Se não há dados ou só tem o cabeçalho, usuário não existe
        return false;
      }

      // Procurar pelo user_id na primeira coluna (A)
      for (let i = 1; i < rows.length; i++) { // Pular cabeçalho (índice 0)
        const row = rows[i];
        if (row[0] === userId) {
          // Verificar se o usuário está ativo (coluna F)
          const active = row[5];
          const isActive = active === 'true' || active === 'SIM' || active === '1';
          console.log(`✅ Usuário ${userId} encontrado, ativo: ${isActive}`);
          return isActive;
        }
      }

      console.log(`❌ Usuário ${userId} não encontrado`);
      return false;

    } catch (error) {
      console.error('❌ Erro ao verificar usuário:', error);
      // Em caso de erro, assumir que o usuário não existe para segurança
      return false;
    }
  }
}

// Singleton para o serviço de configuração
export const configSheetsService = new ConfigSheetsService(
  process.env.CONFIG_SPREADSHEET_ID || '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI'
);
