import { google } from 'googleapis';
import { CreateSheetRequest, SaveDataRequest, SheetResponse } from '../types';

export class GoogleSheetsService {
  private auth: any;
  private sheets: any;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minRequestInterval = 100; // mínimo 100ms entre requisições

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  // Rate limiting para evitar quota exceeded
  private async executeWithRateLimit<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          
          if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
          }
          
          this.lastRequestTime = Date.now();
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const operation = this.requestQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Erro na operação da fila:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }  async criarAba(request: CreateSheetRequest): Promise<SheetResponse> {
    try {
      const { spreadsheetId, nomeAba, colunas = ['Nome', 'Email'] } = request;

      // Verifica se a aba já existe com rate limiting
      const existingSheets: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.get({
          spreadsheetId,
          fields: 'sheets.properties.title'
        })
      );

      const sheetExists = existingSheets.data.sheets?.some(
        (sheet: any) => sheet.properties.title === nomeAba
      );

      if (sheetExists) {
        return {
          success: false,
          message: `Aba '${nomeAba}' já existe nesta planilha`,
          error: 'SHEET_ALREADY_EXISTS'
        };
      }

      // Primeiro, criar apenas a aba
      const createResponse: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: nomeAba,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: Math.max(26, colunas.length)
                    }
                  }
                }
              }
            ]
          }
        })
      );

      // Obter o ID da nova aba
      const newSheetId = createResponse.data.replies[0].addSheet.properties.sheetId;

      // Segundo, adicionar cabeçalhos usando o range da nova aba
      await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${nomeAba}!A1:${String.fromCharCode(64 + colunas.length)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [colunas],
          },
        })
      );      return {
        success: true,
        message: 'Aba criada com sucesso!',
        data: {
          spreadsheetId,
          nomeAba,
          planilhaUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${newSheetId}`
        }
      };

    } catch (error: any) {
      console.error('Erro ao criar aba:', error);
      if (error.message?.includes('rateLimitExceeded')) {
        return {
          success: false,
          message: 'Muitas requisições. Tente novamente em alguns segundos.',
          error: 'RATE_LIMIT_EXCEEDED'
        };
      }
      return {
        success: false,
        message: 'Erro ao criar aba',
        error: error.message
      };
    }
  }async salvarDados(request: SaveDataRequest): Promise<SheetResponse> {
    try {
      const { spreadsheetId, nomeAba, dados } = request;
      console.log('📝 Salvando dados:', { spreadsheetId, nomeAba, dados });

      // Verifica se a aba existe com rate limiting
      const existingSheets: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.get({
          spreadsheetId,
          fields: 'sheets.properties.title'
        })
      );

      const sheetExists = existingSheets.data.sheets?.some(
        (sheet: any) => sheet.properties.title === nomeAba
      );
      console.log('📋 Abas encontradas:', existingSheets.data.sheets?.map((s: any) => s.properties.title));
      console.log(`🔍 Aba '${nomeAba}' existe?`, sheetExists);

      if (!sheetExists) {
        return {
          success: false,
          message: `Aba '${nomeAba}' não encontrada. Crie a aba primeiro.`,
          error: 'SHEET_NOT_FOUND'
        };
      }

      // Pega os cabeçalhos da primeira linha com rate limiting
      console.log('📊 Buscando cabeçalhos da aba...');
      const headersResponse: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${nomeAba}!1:1`,
        })
      );

      const headers = headersResponse.data.values?.[0] || [];
      console.log('📋 Cabeçalhos encontrados:', headers);
      
      // Verifica se há dados enviados que não correspondem aos cabeçalhos
      const dadosEnviados = Object.keys(dados);
      const cabecalhosNaoEncontrados = dadosEnviados.filter(campo => !headers.includes(campo));
      
      if (cabecalhosNaoEncontrados.length > 0) {
        return {
          success: false,
          message: `Campos não encontrados na planilha: ${cabecalhosNaoEncontrados.join(', ')}. Cabeçalhos disponíveis: ${headers.join(', ')}`,
          error: 'CAMPOS_NAO_ENCONTRADOS'
        };
      }

      if (headers.length === 0) {
        return {
          success: false,
          message: `A aba '${nomeAba}' não possui cabeçalhos. Adicione cabeçalhos na primeira linha.`,
          error: 'SEM_CABECALHOS'
        };
      }
      
      // Mapeia os dados de acordo com os cabeçalhos
      const rowData = headers.map((header: string) => {
        const valor = dados[header] || '';
        console.log(`🔗 Mapeando '${header}': '${valor}'`);
        return valor;
      });
      console.log('📊 Dados mapeados para salvar:', rowData);

      // Adiciona nova linha com os dados usando rate limiting
      const range = `${nomeAba}!A:${String.fromCharCode(64 + headers.length)}`;
      console.log('📍 Range para salvar:', range);
      
      const appendResult: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [rowData],
          },
        })
      );
      
      console.log('✅ Resultado do append:', appendResult.data);

      return {
        success: true,
        message: 'Dados salvos com sucesso!',
        data: {
          spreadsheetId,
          nomeAba,
          planilhaUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          cabecalhosEncontrados: headers,
          dadosProcessados: rowData.length
        }
      };

    } catch (error: any) {
      console.error('❌ Erro ao salvar dados:', error);
      if (error.message?.includes('rateLimitExceeded')) {
        return {
          success: false,
          message: 'Muitas requisições. Tente novamente em alguns segundos.',
          error: 'RATE_LIMIT_EXCEEDED'
        };
      }
      return {
        success: false,
        message: 'Erro ao salvar dados',
        error: error.message
      };
    }
  }
  async listarAbas(spreadsheetId: string): Promise<string[]> {
    try {
      const response: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.get({
          spreadsheetId,
          fields: 'sheets.properties.title'
        })
      );

      return response.data.sheets?.map((sheet: any) => sheet.properties.title) || [];
    } catch (error: any) {
      console.error('Erro ao listar abas:', error);
      if (error.message?.includes('rateLimitExceeded')) {
        throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
      }
      throw new Error('Erro ao listar abas da planilha');
    }
  }

  async lerDados(spreadsheetId: string, range: string): Promise<any[][]> {
    try {
      const response: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range
        })
      );

      return response.data.values || [];
    } catch (error: any) {
      console.error('Erro ao ler dados:', error);
      if (error.message?.includes('rateLimitExceeded')) {
        throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
      }
      throw new Error(`Erro ao ler dados: ${error.message}`);
    }
  }

  // Método otimizado para salvar múltiplas linhas de uma vez
  async salvarDadosEmBatch(spreadsheetId: string, nomeAba: string, dadosList: Record<string, any>[]): Promise<SheetResponse> {
    try {
      if (dadosList.length === 0) {
        return {
          success: false,
          message: 'Nenhum dado fornecido para salvar'
        };
      }

      console.log(`📝 Salvando ${dadosList.length} linhas em batch...`);

      // Busca cabeçalhos apenas uma vez
      const headersResponse: any = await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${nomeAba}!1:1`,
        })
      );

      const headers = headersResponse.data.values?.[0] || [];
      
      if (headers.length === 0) {
        return {
          success: false,
          message: `A aba '${nomeAba}' não possui cabeçalhos`,
          error: 'SEM_CABECALHOS'
        };
      }

      // Mapeia todos os dados de uma vez
      const batchData = dadosList.map(dados => {
        return headers.map((header: string) => dados[header] || '');
      });

      // Salva todos os dados em uma única requisição
      const range = `${nomeAba}!A:${String.fromCharCode(64 + headers.length)}`;
      await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values: batchData,
          },
        })
      );

      console.log(`✅ ${dadosList.length} linhas salvas com sucesso!`);

      return {
        success: true,
        message: `${dadosList.length} linhas salvas com sucesso!`,
        data: {
          spreadsheetId,
          nomeAba,
          planilhaUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          dadosProcessados: dadosList.length
        }
      };

    } catch (error: any) {
      console.error('❌ Erro ao salvar dados em batch:', error);
      if (error.message?.includes('rateLimitExceeded')) {
        return {
          success: false,
          message: 'Muitas requisições. Tente novamente em alguns segundos.',
          error: 'RATE_LIMIT_EXCEEDED'
        };
      }
      return {
        success: false,
        message: 'Erro ao salvar dados em batch',
        error: error.message
      };
    }
  }

  // Método para atualizar dados específicos
  async atualizarDados(spreadsheetId: string, range: string, values: any[][]): Promise<boolean> {
    try {
      await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values,
          },
        })
      );

      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
      if (error.message?.includes('rateLimitExceeded')) {
        throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
      }
      throw new Error('Erro ao atualizar dados da planilha');
    }
  }

  // Atualizar uma linha específica
  async atualizarLinha(
    spreadsheetId: string, 
    nomeAba: string, 
    rowIndex: number, 
    rowData: any[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const range = `${nomeAba}!A${rowIndex}:${String.fromCharCode(65 + rowData.length - 1)}${rowIndex}`;
      
      await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [rowData],
          },
        })
      );

      return {
        success: true,
        message: 'Linha atualizada com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao atualizar linha:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar linha'
      };
    }
  }

  // Marcar registro como inativo (exclusão lógica)
  async marcarComoInativo(
    spreadsheetId: string, 
    nomeAba: string, 
    id: string,
    idColumn: string = 'A' // Coluna onde está o ID (padrão A)
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar todas as linhas para encontrar o registro
      const rows = await this.lerDados(spreadsheetId, `${nomeAba}!A:Z`);
      
      if (!rows || rows.length === 0) {
        return {
          success: false,
          message: 'Nenhum dado encontrado na aba'
        };
      }

      // Encontrar linha com o ID
      let targetRowIndex = -1;
      let activeColumnIndex = -1;

      // Procurar coluna 'ativo' ou 'active' no cabeçalho
      const headers = rows[0];
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]?.toString().toLowerCase();
        if (header === 'ativo' || header === 'active') {
          activeColumnIndex = i;
          break;
        }
      }

      if (activeColumnIndex === -1) {
        return {
          success: false,
          message: 'Coluna de status (ativo/active) não encontrada'
        };
      }

      // Encontrar linha com o ID
      const idColumnIndex = idColumn.charCodeAt(0) - 65; // A=0, B=1, etc.
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][idColumnIndex] === id) {
          targetRowIndex = i;
          break;
        }
      }

      if (targetRowIndex === -1) {
        return {
          success: false,
          message: 'Registro não encontrado'
        };
      }

      // Atualizar status para inativo
      const activeColumnLetter = String.fromCharCode(65 + activeColumnIndex);
      const range = `${nomeAba}!${activeColumnLetter}${targetRowIndex + 1}`;
      
      await this.executeWithRateLimit(() =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['NÃO']],
          },
        })
      );

      return {
        success: true,
        message: 'Registro marcado como inativo'
      };

    } catch (error: any) {
      console.error('Erro ao marcar como inativo:', error);
      return {
        success: false,
        message: error.message || 'Erro ao marcar registro como inativo'
      };
    }
  }

  // Buscar registro por ID em uma aba
  async buscarPorId(
    spreadsheetId: string, 
    nomeAba: string, 
    id: string,
    idColumn: string = 'A'
  ): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const rows = await this.lerDados(spreadsheetId, `${nomeAba}!A:Z`);
      
      if (!rows || rows.length === 0) {
        return {
          success: false,
          message: 'Nenhum dado encontrado na aba'
        };
      }

      const headers = rows[0];
      const idColumnIndex = idColumn.charCodeAt(0) - 65; // A=0, B=1, etc.

      // Encontrar linha com o ID
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][idColumnIndex] === id) {
          // Converter linha em objeto usando cabeçalhos
          const registro: any = {};
          for (let j = 0; j < headers.length; j++) {
            registro[headers[j]] = rows[i][j] || '';
          }
          
          return {
            success: true,
            data: registro,
            message: 'Registro encontrado'
          };
        }
      }

      return {
        success: false,
        message: 'Registro não encontrado'
      };

    } catch (error: any) {
      console.error('Erro ao buscar por ID:', error);
      return {
        success: false,
        message: error.message || 'Erro ao buscar registro'
      };
    }
  }
}
