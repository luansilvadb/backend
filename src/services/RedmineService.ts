import axios from 'axios';
import { RedmineConfig, RedmineIssue, BuscarIssuesRequest } from '../types';

export class RedmineService {
  private config: RedmineConfig | null = null;

  setConfig(config: RedmineConfig) {
    this.config = config;
  }

  getConfig(): RedmineConfig | null {
    return this.config;
  }

  async testarConexao(config: RedmineConfig): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await axios.get(`${config.url}/issues.json`, {
        headers: {
          'X-Redmine-API-Key': config.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 1
        },
        timeout: 10000
      });

      return {
        success: true,
        message: 'Conexão com Redmine estabelecida com sucesso',
        data: {
          totalIssues: response.data.total_count,
          version: response.headers['x-redmine-api-version'] || 'desconhecida'
        }
      };
    } catch (error: any) {
      console.error('Erro ao testar conexão Redmine:', error.message);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          return { success: false, message: 'API Key inválida ou sem permissões' };
        } else if (status === 403) {
          return { success: false, message: 'Acesso negado. Verifique as permissões da API Key' };
        } else if (status === 404) {
          return { success: false, message: 'URL do Redmine não encontrada' };
        } else {
          return { success: false, message: `Erro HTTP ${status}: ${error.response.statusText}` };
        }
      } else if (error.code === 'ECONNREFUSED') {
        return { success: false, message: 'Não foi possível conectar ao servidor Redmine' };
      } else if (error.code === 'ENOTFOUND') {
        return { success: false, message: 'URL do Redmine não encontrada (DNS)' };
      } else {
        return { success: false, message: `Erro de conexão: ${error.message}` };
      }
    }
  }

  async buscarIssues(params: BuscarIssuesRequest): Promise<{ success: boolean; message: string; data?: { issues: RedmineIssue[]; totalCount: number; offset: number; limit: number } }> {
    if (!this.config) {
      return { success: false, message: 'Configuração do Redmine não definida' };
    }

    try {
      const queryParams: any = {
        limit: params.limit || 25,
        offset: params.offset || 0
      };      // Aplicar filtros
      if (params.filtros) {
        if (params.filtros.projectId) {
          queryParams.project_id = params.filtros.projectId;
        }

        if (params.filtros.status) {
          queryParams.status_id = params.filtros.status;
        }

        if (params.filtros.assignedTo) {
          queryParams.assigned_to_id = params.filtros.assignedTo;
        }

        if (params.filtros.priority) {
          queryParams.priority_id = params.filtros.priority;
        }

        if (params.filtros.tracker) {
          queryParams.tracker_id = params.filtros.tracker;
        }

        if (params.filtros.createdOn) {
          queryParams.created_on = params.filtros.createdOn;
        }
      }

      console.log('Buscando issues do Redmine com parâmetros:', queryParams);

      const response = await axios.get(`${this.config.url}/issues.json`, {
        headers: {
          'X-Redmine-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        params: queryParams,
        timeout: 30000
      });

      const issues: RedmineIssue[] = response.data.issues || [];
      
      console.log(`Encontradas ${issues.length} issues de um total de ${response.data.total_count}`);

      return {
        success: true,
        message: `${issues.length} issues encontradas`,
        data: {
          issues,
          totalCount: response.data.total_count,
          offset: response.data.offset,
          limit: response.data.limit
        }
      };

    } catch (error: any) {
      console.error('Erro ao buscar issues:', error.message);
      
      if (error.response) {
        return { 
          success: false, 
          message: `Erro HTTP ${error.response.status}: ${error.response.statusText}` 
        };
      } else {
        return { 
          success: false, 
          message: `Erro de conexão: ${error.message}` 
        };
      }
    }
  }

  async buscarProjetos(): Promise<{ success: boolean; message: string; data?: any[] }> {
    if (!this.config) {
      return { success: false, message: 'Configuração do Redmine não definida' };
    }

    try {
      const response = await axios.get(`${this.config.url}/projects.json`, {
        headers: {
          'X-Redmine-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 100
        },
        timeout: 15000
      });

      const projetos = response.data.projects || [];
      
      return {
        success: true,
        message: `${projetos.length} projetos encontrados`,
        data: projetos.map((p: any) => ({
          id: p.id,
          name: p.name,
          identifier: p.identifier,
          description: p.description,
          status: p.status
        }))
      };

    } catch (error: any) {
      console.error('Erro ao buscar projetos:', error.message);
      return { 
        success: false, 
        message: `Erro ao buscar projetos: ${error.message}` 
      };
    }
  }

  async buscarStatus(): Promise<{ success: boolean; message: string; data?: any[] }> {
    if (!this.config) {
      return { success: false, message: 'Configuração do Redmine não definida' };
    }

    try {
      const response = await axios.get(`${this.config.url}/issue_statuses.json`, {
        headers: {
          'X-Redmine-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const status = response.data.issue_statuses || [];
      
      return {
        success: true,
        message: `${status.length} status encontrados`,
        data: status.map((s: any) => ({
          id: s.id,
          name: s.name,
          is_closed: s.is_closed
        }))
      };

    } catch (error: any) {
      console.error('Erro ao buscar status:', error.message);
      return { 
        success: false, 
        message: `Erro ao buscar status: ${error.message}` 
      };
    }
  }

  async buscarUsuarios(): Promise<{ success: boolean; message: string; data?: any[] }> {
    if (!this.config) {
      return { success: false, message: 'Configuração do Redmine não definida' };
    }

    try {
      const response = await axios.get(`${this.config.url}/users.json`, {
        headers: {
          'X-Redmine-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          status: 1, // apenas usuários ativos
          limit: 100
        },
        timeout: 15000
      });

      const usuarios = response.data.users || [];
      
      return {
        success: true,
        message: `${usuarios.length} usuários encontrados`,
        data: usuarios.map((u: any) => ({
          id: u.id,
          name: u.name,
          login: u.login,
          mail: u.mail
        }))
      };

    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error.message);
      return { 
        success: false, 
        message: `Erro ao buscar usuários: ${error.message}` 
      };
    }
  }

  async buscarPrioridades(): Promise<{ success: boolean; message: string; data?: any[] }> {
    if (!this.config) {
      return { success: false, message: 'Configuração do Redmine não definida' };
    }

    try {
      const response = await axios.get(`${this.config.url}/enumerations/issue_priorities.json`, {
        headers: {
          'X-Redmine-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const prioridades = response.data.issue_priorities || [];
      
      return {
        success: true,
        message: `${prioridades.length} prioridades encontradas`,
        data: prioridades.map((p: any) => ({
          id: p.id,
          name: p.name,
          is_default: p.is_default
        }))
      };

    } catch (error: any) {
      console.error('Erro ao buscar prioridades:', error.message);
      return { 
        success: false, 
        message: `Erro ao buscar prioridades: ${error.message}` 
      };
    }
  }

  async buscarTrackers(): Promise<{ success: boolean; message: string; data?: any[] }> {
    if (!this.config) {
      return { success: false, message: 'Configuração do Redmine não definida' };
    }

    try {
      const response = await axios.get(`${this.config.url}/trackers.json`, {
        headers: {
          'X-Redmine-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const trackers = response.data.trackers || [];
      
      return {
        success: true,
        message: `${trackers.length} tipos de issue encontrados`,
        data: trackers.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description
        }))
      };

    } catch (error: any) {
      console.error('Erro ao buscar trackers:', error.message);
      return { 
        success: false, 
        message: `Erro ao buscar trackers: ${error.message}` 
      };
    }
  }

  async buscarCustomFields(): Promise<{ success: boolean; message: string; data?: any[] }> {
    if (!this.config) {
      return { success: false, message: 'Configuração do Redmine não definida' };
    }

    try {
      const response = await axios.get(`${this.config.url}/custom_fields.json`, {
        headers: {
          'X-Redmine-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const customFields = response.data.custom_fields || [];
      
      return {
        success: true,
        message: `${customFields.length} campos customizados encontrados`,
        data: customFields.map((cf: any) => ({
          id: cf.id,
          name: cf.name,
          field_format: cf.field_format,
          possible_values: cf.possible_values || [],
          is_required: cf.is_required,
          is_filter: cf.is_filter
        }))
      };

    } catch (error: any) {
      console.error('Erro ao buscar custom fields:', error.message);
      return { 
        success: false, 
        message: `Erro ao buscar custom fields: ${error.message}` 
      };
    }
  }

  // Métodos de mapeamento de nomes para IDs
  private metadados: {
    projetos?: any[];
    status?: any[];
    usuarios?: any[];
    prioridades?: any[];
    trackers?: any[];
  } = {};

  async carregarMetadados(): Promise<void> {
    if (!this.config) return;

    try {
      console.log('🔄 Carregando metadados do Redmine...');
      
      const [projetos, status, usuarios, prioridades, trackers] = await Promise.all([
        this.buscarProjetos(),
        this.buscarStatus(),
        this.buscarUsuarios(),
        this.buscarPrioridades(),
        this.buscarTrackers()
      ]);

      this.metadados = {
        projetos: projetos.data || [],
        status: status.data || [],
        usuarios: usuarios.data || [],
        prioridades: prioridades.data || [],
        trackers: trackers.data || []
      };

      console.log('✅ Metadados carregados com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao carregar metadados:', error);
    }
  }

  mapearNomeParaId(tipo: 'projeto' | 'status' | 'usuario' | 'prioridade' | 'tracker', nome: string): number | null {
    if (!this.metadados || !nome) return null;

    let lista: any[] = [];
    
    switch (tipo) {
      case 'projeto':
        lista = this.metadados.projetos || [];
        break;
      case 'status':
        lista = this.metadados.status || [];
        break;
      case 'usuario':
        lista = this.metadados.usuarios || [];
        break;
      case 'prioridade':
        lista = this.metadados.prioridades || [];
        break;
      case 'tracker':
        lista = this.metadados.trackers || [];
        break;
    }

    const item = lista.find(item => 
      item.name?.toLowerCase() === nome.toLowerCase() ||
      item.identifier?.toLowerCase() === nome.toLowerCase()
    );

    return item ? item.id : null;
  }

  mapearIdParaNome(tipo: 'projeto' | 'status' | 'usuario' | 'prioridade' | 'tracker', id: number): string | null {
    if (!this.metadados || !id) return null;

    let lista: any[] = [];
    
    switch (tipo) {
      case 'projeto':
        lista = this.metadados.projetos || [];
        break;
      case 'status':
        lista = this.metadados.status || [];
        break;
      case 'usuario':
        lista = this.metadados.usuarios || [];
        break;
      case 'prioridade':
        lista = this.metadados.prioridades || [];
        break;
      case 'tracker':
        lista = this.metadados.trackers || [];
        break;
    }

    const item = lista.find(item => item.id === id);
    return item ? item.name : null;
  }

  // Converte issues do Redmine para formato de dados para o Google Sheets
  convertIssuesParaPlanilha(issues: RedmineIssue[], campos?: string[]): any[] {
    const camposDefault = [
      'id', 'subject', 'status', 'priority', 'tracker', 'author', 'assigned_to', 
      'project', 'created_on', 'updated_on', 'done_ratio', 'estimated_hours', 'spent_hours'
    ];
    
    const camposExportar = campos && campos.length > 0 ? campos : camposDefault;
    
    return issues.map(issue => {
      const linha: any = {};
      
      camposExportar.forEach(campo => {
        switch (campo) {
          case 'id':
            linha['ID'] = issue.id;
            break;
          case 'subject':
            linha['Título'] = issue.subject;
            break;
          case 'description':
            linha['Descrição'] = issue.description;
            break;
          case 'status':
            linha['Status'] = issue.status.name;
            break;
          case 'priority':
            linha['Prioridade'] = issue.priority.name;
            break;
          case 'tracker':
            linha['Tipo'] = issue.tracker.name;
            break;
          case 'author':
            linha['Autor'] = issue.author.name;
            break;
          case 'assigned_to':
            linha['Responsável'] = issue.assigned_to?.name || '';
            break;
          case 'project':
            linha['Projeto'] = issue.project.name;
            break;
          case 'created_on':
            linha['Criado em'] = new Date(issue.created_on).toLocaleDateString('pt-BR');
            break;
          case 'updated_on':
            linha['Atualizado em'] = new Date(issue.updated_on).toLocaleDateString('pt-BR');
            break;
          case 'done_ratio':
            linha['% Concluído'] = issue.done_ratio;
            break;
          case 'estimated_hours':
            linha['Horas Estimadas'] = issue.estimated_hours || 0;
            break;
          case 'spent_hours':
            linha['Horas Gastas'] = issue.spent_hours || 0;
            break;
          default:
            // Buscar em custom_fields se existir
            if (issue.custom_fields) {
              const customField = issue.custom_fields.find(cf => cf.name === campo);
              if (customField) {
                linha[campo] = customField.value;
              }
            }
        }
      });
      
      return linha;
    });
  }
}

export const redmineService = new RedmineService();
