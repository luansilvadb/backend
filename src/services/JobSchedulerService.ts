import * as cron from 'node-cron';
import { configSheetsService } from './ConfigSheetsService';
import { redmineService } from './RedmineService';
import { GoogleSheetsService } from './GoogleSheetsService';

export interface JobAgendado {
  job_id: string;
  user_id: string;
  nome: string;
  filtro_id: string;
  cron_expression: string;
  ativo: boolean;
  aba_destino: string;
  sobrescrever_dados: boolean;
  incluir_cabecalhos: boolean;
  criado_em: string;
  ultima_execucao?: string;
  proxima_execucao?: string;
  total_execucoes: number;
}

export interface LogExecucaoJob {
  log_id: string;
  job_id: string;
  user_id: string;
  status: 'sucesso' | 'erro';
  total_issues: number;
  erro_detalhes?: string;
  data_execucao: string;
  tempo_execucao_ms: number;
}

export class JobSchedulerService {
  private jobs: Map<string, any> = new Map();
  private googleSheetsService: GoogleSheetsService;

  constructor() {
    this.googleSheetsService = new GoogleSheetsService();
    this.inicializarJobsAtivos();
  }
  // Inicializar jobs ativos ao iniciar o servidor
  private async inicializarJobsAtivos() {
    try {
      console.log('🔄 Inicializando jobs ativos...');
      
      // Verificar se CONFIG_SPREADSHEET_ID está configurado
      const spreadsheetId = process.env.CONFIG_SPREADSHEET_ID;
      if (!spreadsheetId) {
        console.log('⚠️ CONFIG_SPREADSHEET_ID não configurado. Jobs agendados desabilitados.');
        console.log('💡 Configure CONFIG_SPREADSHEET_ID no arquivo .env para habilitar jobs.');
        return;
      }
      
      // Buscar todos os jobs ativos de todos os usuários
      const jobsAtivos = await this.buscarJobsAtivos();
      
      for (const job of jobsAtivos) {
        await this.agendarJob(job);
      }
      
      console.log(`✅ ${jobsAtivos.length} jobs inicializados`);
    } catch (error) {
      console.error('❌ Erro ao inicializar jobs:', error);
    }
  }

  // Buscar jobs ativos da planilha de configuração
  private async buscarJobsAtivos(): Promise<JobAgendado[]> {
    try {
      const rows = await this.googleSheetsService.lerDados(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'jobs_agendados!A:N'
      );

      if (rows.length <= 1) return [];

      const jobs: JobAgendado[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[5] === 'SIM') { // coluna 'ativo'
          jobs.push({
            job_id: row[0],
            user_id: row[1],
            nome: row[2],
            filtro_id: row[3],
            cron_expression: row[4],
            ativo: true,
            aba_destino: row[6],
            sobrescrever_dados: row[7] === 'SIM',
            incluir_cabecalhos: row[8] === 'SIM',
            criado_em: row[9],
            ultima_execucao: row[10],
            proxima_execucao: row[11],
            total_execucoes: parseInt(row[12]) || 0
          });
        }
      }      return jobs;
    } catch (error) {
      console.log('⚠️ Erro ao buscar jobs (aba jobs_agendados pode não existir ainda):', (error as any).message);
      return [];
    }  }

  // Método para gerar próximo ID sequencial de job
  private async gerarProximoIdJob(): Promise<string> {
    try {      // Buscar todos os jobs para determinar o próximo ID
      const rows = await this.googleSheetsService.lerDados(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'jobs_agendados!A:A'
      );
      
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
      console.error('Erro ao gerar próximo ID de job:', error);
      // Em caso de erro, usar timestamp como fallback
      return Date.now().toString();
    }
  }

  // Criar novo job agendado
  async criarJob(jobData: Omit<JobAgendado, 'job_id' | 'criado_em' | 'total_execucoes' | 'proxima_execucao'>): Promise<{ success: boolean; message: string; jobId?: string }> {
    try {
      // Validar expressão CRON
      if (!cron.validate(jobData.cron_expression)) {
        return { success: false, message: 'Expressão CRON inválida' };
      }

      const jobId = await this.gerarProximoIdJob();
      
      // Calcular próxima execução
      const proximaExecucao = this.calcularProximaExecucao(jobData.cron_expression);

      const jobCompleto: JobAgendado = {
        ...jobData,
        job_id: jobId,
        criado_em: new Date().toISOString(),
        total_execucoes: 0,
        proxima_execucao: proximaExecucao
      };

      // Salvar na planilha
      const dados = {
        job_id: jobCompleto.job_id,
        user_id: jobCompleto.user_id,
        nome: jobCompleto.nome,
        filtro_id: jobCompleto.filtro_id,
        cron_expression: jobCompleto.cron_expression,
        ativo: jobCompleto.ativo ? 'SIM' : 'NÃO',
        aba_destino: jobCompleto.aba_destino,
        sobrescrever_dados: jobCompleto.sobrescrever_dados ? 'SIM' : 'NÃO',
        incluir_cabecalhos: jobCompleto.incluir_cabecalhos ? 'SIM' : 'NÃO',
        criado_em: jobCompleto.criado_em,
        ultima_execucao: '',
        proxima_execucao: jobCompleto.proxima_execucao,
        total_execucoes: '0'
      };

      const resultado = await this.googleSheetsService.salvarDados({
        spreadsheetId: process.env.CONFIG_SPREADSHEET_ID || '',
        nomeAba: 'jobs_agendados',
        dados
      });

      if (!resultado.success) {
        return { success: false, message: `Erro ao salvar job: ${resultado.message}` };
      }

      // Agendar execução se estiver ativo
      if (jobCompleto.ativo) {
        await this.agendarJob(jobCompleto);
      }

      return { success: true, message: 'Job criado com sucesso', jobId };

    } catch (error: any) {
      console.error('Erro ao criar job:', error);
      return { success: false, message: `Erro interno: ${error.message}` };
    }
  }

  // Agendar execução do job
  private async agendarJob(job: JobAgendado): Promise<void> {
    try {
      // Cancelar job existente se houver
      this.cancelarJob(job.job_id);      const task = cron.schedule(job.cron_expression, async () => {
        await this.executarJob(job);
      }, {
        timezone: 'America/Sao_Paulo'
      });

      task.start();
      this.jobs.set(job.job_id, task);
      
      console.log(`📅 Job agendado: ${job.nome} (${job.cron_expression})`);
    } catch (error) {
      console.error(`Erro ao agendar job ${job.job_id}:`, error);
    }
  }

  // Executar job
  private async executarJob(job: JobAgendado): Promise<void> {
    const inicioExecucao = Date.now();
    console.log(`🚀 Executando job: ${job.nome}`);

    try {
      // Buscar configurações do usuário
      const configRedmine = await configSheetsService.buscarConfigRedmine(job.user_id);
      const configSheets = await configSheetsService.buscarConfigSheets(job.user_id);
      const filtro = await configSheetsService.buscarFiltroPorId(job.filtro_id);

      if (!configRedmine || !configSheets || !filtro) {
        throw new Error('Configurações ou filtro não encontrados');
      }      // Configurar Redmine
      redmineService.setConfig({
        url: configRedmine.redmine_url,
        apiKey: configRedmine.api_key
      });

      // Buscar issues
      const resultadoIssues = await redmineService.buscarIssues({
        limit: 1000,
        filtros: {
          projectId: filtro.projeto ? parseInt(filtro.projeto) : undefined,
          status: filtro.status,
          assignedTo: filtro.assignedTo,
          priority: filtro.priority,
          tracker: filtro.tracker,
          createdOn: filtro.data_inicio && filtro.data_fim 
            ? `><${filtro.data_inicio}|${filtro.data_fim}`
            : filtro.data_inicio
        }
      });

      if (!resultadoIssues.success || !resultadoIssues.data) {
        throw new Error(`Erro ao buscar issues: ${resultadoIssues.message}`);
      }

      const issues = resultadoIssues.data.issues;
      
      // Converter para formato de planilha
      const dadosPlanilha = redmineService.convertIssuesParaPlanilha(issues);

      // Verificar se aba existe
      const abasExistentes = await this.googleSheetsService.listarAbas(configSheets.spreadsheet_id);
      
      if (!abasExistentes.includes(job.aba_destino)) {
        const colunas = Object.keys(dadosPlanilha[0] || {});
        await this.googleSheetsService.criarAba({
          spreadsheetId: configSheets.spreadsheet_id,
          nomeAba: job.aba_destino,
          colunas
        });
      }

      // Exportar dados
      let totalSalvo = 0;
      for (const dados of dadosPlanilha) {
        const resultado = await this.googleSheetsService.salvarDados({
          spreadsheetId: configSheets.spreadsheet_id,
          nomeAba: job.aba_destino,
          dados
        });
        
        if (resultado.success) {
          totalSalvo++;
        }
      }

      // Registrar sucesso
      await this.registrarExecucao(job, 'sucesso', totalSalvo, Date.now() - inicioExecucao);
      await this.atualizarUltimaExecucao(job.job_id);

      console.log(`✅ Job concluído: ${job.nome} - ${totalSalvo} issues exportadas`);

    } catch (error: any) {
      console.error(`❌ Erro no job ${job.nome}:`, error);
      await this.registrarExecucao(job, 'erro', 0, Date.now() - inicioExecucao, error.message);
    }
  }

  // Registrar execução do job
  private async registrarExecucao(
    job: JobAgendado, 
    status: 'sucesso' | 'erro', 
    totalIssues: number, 
    tempoExecucao: number,
    erroDetalhes?: string
  ): Promise<void> {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const dados = {
        log_id: logId,
        job_id: job.job_id,
        user_id: job.user_id,
        status: status.toUpperCase(),
        total_issues: totalIssues.toString(),
        erro_detalhes: erroDetalhes || '',
        data_execucao: new Date().toISOString(),
        tempo_execucao_ms: tempoExecucao.toString()
      };

      await this.googleSheetsService.salvarDados({
        spreadsheetId: process.env.CONFIG_SPREADSHEET_ID || '',
        nomeAba: 'logs_execucao_jobs',
        dados
      });
    } catch (error) {
      console.error('Erro ao registrar execução:', error);
    }
  }

  // Atualizar última execução
  private async atualizarUltimaExecucao(jobId: string): Promise<void> {
    // TODO: Implementar update específico da linha do job
    // Por enquanto, apenas log
    console.log(`📝 Atualizando última execução do job: ${jobId}`);
  }

  // Cancelar job
  cancelarJob(jobId: string): void {
    const task = this.jobs.get(jobId);
    if (task) {
      task.stop();
      task.destroy();
      this.jobs.delete(jobId);
      console.log(`🛑 Job cancelado: ${jobId}`);
    }
  }

  // Executar job manualmente
  async executarJobManual(jobId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar job
      const rows = await this.googleSheetsService.lerDados(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'jobs_agendados!A:N'
      );

      const jobRow = rows.find((row, index) => index > 0 && row[0] === jobId && row[1] === userId);
      if (!jobRow) {
        return { success: false, message: 'Job não encontrado' };
      }

      const job: JobAgendado = {
        job_id: jobRow[0],
        user_id: jobRow[1],
        nome: jobRow[2],
        filtro_id: jobRow[3],
        cron_expression: jobRow[4],
        ativo: jobRow[5] === 'SIM',
        aba_destino: jobRow[6],
        sobrescrever_dados: jobRow[7] === 'SIM',
        incluir_cabecalhos: jobRow[8] === 'SIM',
        criado_em: jobRow[9],
        ultima_execucao: jobRow[10],
        proxima_execucao: jobRow[11],
        total_execucoes: parseInt(jobRow[12]) || 0
      };

      await this.executarJob(job);
      
      return { success: true, message: 'Job executado com sucesso' };
    } catch (error: any) {
      console.error('Erro na execução manual:', error);
      return { success: false, message: `Erro: ${error.message}` };
    }
  }  // Calcular próxima execução
  private calcularProximaExecucao(cronExpression: string): string {
    try {
      // Por simplicidade, vamos retornar uma hora no futuro
      // TODO: Implementar parsing real do CRON se necessário
      const nextHour = new Date(Date.now() + 60 * 60 * 1000);
      return nextHour.toISOString();
    } catch (error) {
      console.error('Erro ao calcular próxima execução:', error);
      // Fallback: próxima hora
      return new Date(Date.now() + 60 * 60 * 1000).toISOString();
    }
  }

  // Listar jobs por usuário
  async listarJobsPorUsuario(userId: string): Promise<JobAgendado[]> {
    try {
      const rows = await this.googleSheetsService.lerDados(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'jobs_agendados!A:N'
      );

      if (rows.length <= 1) return [];

      const jobs: JobAgendado[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[1] === userId) {
          jobs.push({
            job_id: row[0],
            user_id: row[1],
            nome: row[2],
            filtro_id: row[3],
            cron_expression: row[4],
            ativo: row[5] === 'SIM',
            aba_destino: row[6],
            sobrescrever_dados: row[7] === 'SIM',
            incluir_cabecalhos: row[8] === 'SIM',
            criado_em: row[9],
            ultima_execucao: row[10],
            proxima_execucao: row[11],
            total_execucoes: parseInt(row[12]) || 0
          });
        }
      }

      return jobs;
    } catch (error) {
      console.error('Erro ao listar jobs:', error);
      return [];
    }
  }

  // Atualizar job existente
  async atualizarJob(jobId: string, updateData: Partial<JobAgendado>): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Atualizando job:', jobId, updateData);      // Buscar job existente
      const rows = await this.googleSheetsService.lerDados(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'jobs_agendados!A:N'
      );

      if (!rows || rows.length === 0) {
        return {
          success: false,
          message: 'Nenhum job encontrado'
        };
      }

      // Encontrar linha do job
      let jobRowIndex = -1;
      let jobExistente: JobAgendado | null = null;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] === jobId) {
          jobRowIndex = i;
          jobExistente = {
            job_id: row[0],
            user_id: row[1],
            nome: row[2],
            filtro_id: row[3],
            cron_expression: row[4],
            ativo: row[5] === 'SIM',
            aba_destino: row[6],
            sobrescrever_dados: row[7] === 'SIM',
            incluir_cabecalhos: row[8] === 'SIM',
            criado_em: row[9],
            ultima_execucao: row[10] || '',
            proxima_execucao: row[11] || '',
            total_execucoes: parseInt(row[12]) || 0
          };
          break;
        }
      }

      if (!jobExistente || jobRowIndex === -1) {
        return {
          success: false,
          message: 'Job não encontrado'
        };
      }

      // Atualizar campos fornecidos
      const jobAtualizado: JobAgendado = {
        ...jobExistente,
        ...updateData,
        job_id: jobId // Garantir que o ID não mude
      };

      // Calcular próxima execução se cron foi alterado
      if (updateData.cron_expression) {
        try {
          const nextDate = this.calcularProximaExecucao(updateData.cron_expression);
          jobAtualizado.proxima_execucao = nextDate;
        } catch (error) {
          return {
            success: false,
            message: 'Expressão CRON inválida'
          };
        }
      }

      // Atualizar na planilha
      const rowData = [
        jobAtualizado.job_id,
        jobAtualizado.user_id,
        jobAtualizado.nome,
        jobAtualizado.filtro_id,
        jobAtualizado.cron_expression,
        jobAtualizado.ativo ? 'SIM' : 'NÃO',
        jobAtualizado.aba_destino,
        jobAtualizado.sobrescrever_dados ? 'SIM' : 'NÃO',
        jobAtualizado.incluir_cabecalhos ? 'SIM' : 'NÃO',
        jobAtualizado.criado_em,
        jobAtualizado.ultima_execucao || '',
        jobAtualizado.proxima_execucao || '',
        jobAtualizado.total_execucoes.toString()
      ];

      const resultado = await this.googleSheetsService.atualizarLinha(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'jobs_agendados',
        jobRowIndex + 1, // +1 porque é 1-indexed
        rowData
      );

      if (!resultado.success) {
        return {
          success: false,
          message: `Erro ao atualizar job: ${resultado.message}`
        };
      }

      // Reagendar job se necessário
      if (jobAtualizado.ativo && (updateData.cron_expression || updateData.ativo)) {
        this.cancelarJob(jobId);
        await this.agendarJob(jobAtualizado);
      } else if (updateData.ativo === false) {
        this.cancelarJob(jobId);
      }

      return {
        success: true,
        message: 'Job atualizado com sucesso'
      };

    } catch (error: any) {
      console.error('Erro ao atualizar job:', error);
      return {
        success: false,
        message: `Erro interno: ${error.message}`
      };
    }
  }
}

export const jobSchedulerService = new JobSchedulerService();
