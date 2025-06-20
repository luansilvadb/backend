import { Request, Response } from 'express';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { validateCreateSheet, validateSaveData } from '../types';

export class SheetsController {
  private sheetsService: GoogleSheetsService;

  constructor() {
    this.sheetsService = new GoogleSheetsService();
  }

  async criarAba(req: Request, res: Response) {
    try {
      const { spreadsheetId, nomeAba, colunas } = req.body;
      
      // Validação dos dados
      const errors = validateCreateSheet({ spreadsheetId, nomeAba, colunas });
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors
        });
      }

      const result = await this.sheetsService.criarAba({
        spreadsheetId,
        nomeAba,
        colunas
      });

      const statusCode = result.success ? 201 : 400;
      return res.status(statusCode).json(result);

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async salvarDados(req: Request, res: Response) {
    try {
      const { spreadsheetId, nomeAba, ...dados } = req.body;
      
      // Validação dos dados
      const errors = validateSaveData({ spreadsheetId, nomeAba, dados });
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors
        });
      }

      const result = await this.sheetsService.salvarDados({
        spreadsheetId,
        nomeAba,
        dados
      });

      const statusCode = result.success ? 201 : 400;
      return res.status(statusCode).json(result);

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  async listarAbas(req: Request, res: Response) {
    try {
      const { spreadsheetId } = req.params;
      
      if (!spreadsheetId) {
        return res.status(400).json({
          success: false,
          message: 'spreadsheetId é obrigatório'
        });
      }

      const abas = await this.sheetsService.listarAbas(spreadsheetId);
      
      return res.status(200).json({
        success: true,
        message: 'Abas listadas com sucesso',
        data: { abas }
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}
