import { Request, Response } from 'express';
import { jobSchedulerService } from '../services/JobSchedulerService';
import { AuthRequest } from '../services/AuthService';
import * as cron from 'node-cron';

export class JobController {
    // POST /api/jobs/agendar
  async agendarJob(req: AuthRequest, res: Response) {
    console.log('=== AGENDAR JOB ===');
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

      const { nome, filtro_id, cron_expression, aba_destino, sobrescrever_dados, incluir_cabecalhos } = req.body;

      // Validações básicas
      if (!nome || !filtro_id || !cron_expression || !aba_destino) {
        return res.status(400).json({
          success: false,
          message: 'nome, filtro_id, cron_expression e aba_destino são obrigatórios'
        });
      }

      const resultado = await jobSchedulerService.criarJob({
        user_id,
        nome,
        filtro_id,
        cron_expression,
        ativo: true,
        aba_destino,
        sobrescrever_dados: sobrescrever_dados || false,
        incluir_cabecalhos: incluir_cabecalhos || true
      });

      if (resultado.success) {
        res.json({
          success: true,
          message: resultado.message,
          data: {
            jobId: resultado.jobId,
            nome,
            cron_expression,
            aba_destino
          }
        });
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao agendar job:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // GET /api/jobs
  async listarJobs(req: AuthRequest, res: Response) {
    console.log('=== LISTAR JOBS ===');

    try {
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const jobs = await jobSchedulerService.listarJobsPorUsuario(user_id);

      res.json({
        success: true,
        message: `${jobs.length} job(s) encontrado(s)`,
        data: jobs
      });

    } catch (error: any) {
      console.error('Erro ao listar jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // POST /api/jobs/executar-agora/:jobId
  async executarJobAgora(req: AuthRequest, res: Response) {
    console.log('=== EXECUTAR JOB AGORA ===');

    try {
      const { jobId } = req.params;
      
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'jobId é obrigatório'
        });
      }

      const resultado = await jobSchedulerService.executarJobManual(jobId, user_id);

      if (resultado.success) {
        res.json({
          success: true,
          message: resultado.message,
          data: {
            jobId,
            executadoEm: new Date().toISOString()
          }
        });
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao executar job:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // DELETE /api/jobs/:jobId
  async cancelarJob(req: AuthRequest, res: Response) {
    console.log('=== CANCELAR JOB ===');

    try {
      const { jobId } = req.params;
      
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'jobId é obrigatório'
        });
      }

      // Cancelar agendamento
      jobSchedulerService.cancelarJob(jobId);

      // TODO: Marcar como inativo na planilha
      // Por enquanto, apenas retornar sucesso

      res.json({
        success: true,
        message: 'Job cancelado com sucesso',
        data: {
          jobId,
          canceladoEm: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Erro ao cancelar job:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // GET /api/jobs/:jobId/logs
  async obterLogsJob(req: AuthRequest, res: Response) {
    console.log('=== OBTER LOGS JOB ===');

    try {
      const { jobId } = req.params;
      
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'jobId é obrigatório'
        });
      }

      // TODO: Implementar busca de logs específicos do job
      // Por enquanto, retornar array vazio

      res.json({
        success: true,
        message: 'Logs do job',
        data: []
      });

    } catch (error: any) {
      console.error('Erro ao obter logs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // POST /api/jobs/validar-cron
  async validarCron(req: Request, res: Response) {
    console.log('=== VALIDAR CRON ===');

    try {
      const { cron_expression } = req.body;

      if (!cron_expression) {
        return res.status(400).json({
          success: false,
          message: 'cron_expression é obrigatória'
        });
      }      const isValid = cron.validate(cron_expression);

      if (isValid) {
        res.json({
          success: true,
          message: 'Expressão CRON válida',
          data: {
            cron_expression,
            valid: true,
            exemplos: [
              { expressao: '*/5 * * * *', descricao: 'A cada 5 minutos' },
              { expressao: '0 9 * * 1-5', descricao: 'Todo dia útil às 9h' },
              { expressao: '0 */6 * * *', descricao: 'A cada 6 horas' },
              { expressao: '0 8 1 * *', descricao: 'Todo dia 1 do mês às 8h' }
            ]
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Expressão CRON inválida',
          data: {
            cron_expression,
            valid: false,
            exemplos: [
              { expressao: '*/5 * * * *', descricao: 'A cada 5 minutos' },
              { expressao: '0 9 * * 1-5', descricao: 'Todo dia útil às 9h' },
              { expressao: '0 */6 * * *', descricao: 'A cada 6 horas' },
              { expressao: '0 8 1 * *', descricao: 'Todo dia 1 do mês às 8h' }
            ]
          }
        });
      }

    } catch (error: any) {
      console.error('Erro ao validar CRON:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  // PUT /api/jobs/:jobId
  async atualizarJob(req: AuthRequest, res: Response) {
    console.log('=== ATUALIZAR JOB ===');
    console.log('Body recebido:', req.body);
    console.log('Job ID:', req.params.jobId);

    try {
      const jobId = req.params.jobId;
      
      // Obter user_id do usuário logado (via token JWT)
      const user_id = req.user?.id;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação inválido ou expirado'
        });
      }

      const { nome, cron_expression, ativo, aba_destino, sobrescrever_dados, incluir_cabecalhos } = req.body;

      // Validações básicas
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID é obrigatório'
        });
      }

      const resultado = await jobSchedulerService.atualizarJob(jobId, {
        user_id,
        nome,
        cron_expression,
        ativo,
        aba_destino,
        sobrescrever_dados,
        incluir_cabecalhos
      });

      if (resultado.success) {
        res.json({
          success: true,
          message: resultado.message,
          data: {
            jobId,
            nome,
            cron_expression,
            ativo,
            aba_destino
          }
        });
      } else {
        res.status(400).json(resultado);
      }

    } catch (error: any) {
      console.error('Erro ao atualizar job:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

export const jobController = new JobController();
