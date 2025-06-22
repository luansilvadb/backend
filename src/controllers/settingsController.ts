import { Response, NextFunction } from 'express';
import { SettingsService } from '../services/settingsService';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Configurações da loja e sistema
 */
export class SettingsController {
  /**
   * @swagger
   * /api/settings/store:
   *   get:
   *     summary: Buscar configurações da loja
   *     description: Retorna as configurações da loja (nome, endereço, CNPJ, logotipo, impostos, regras de negócio)
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Configurações da loja
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StoreSettings'
   *       401:
   *         description: Não autorizado
   */
  static async getStoreSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getStoreSettings(req.tenant!.id);
      res.json(settings);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/settings/store:
   *   put:
   *     summary: Atualizar configurações da loja
   *     description: Atualiza as configurações da loja (restrito a administradores)
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/StoreSettings'
   *     responses:
   *       200:
   *         description: Configurações atualizadas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StoreSettings'
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Sem permissão
   */
  static async updateStoreSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Aqui você pode validar se o usuário é admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Apenas administradores podem alterar as configurações.' });
      }
      const settings = await SettingsService.updateStoreSettings(req.tenant!.id, req.body);
      res.json(settings);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/settings/backup:
   *   post:
   *     summary: Backup manual do banco de dados
   *     description: Realiza backup manual do banco de dados (restrito a administradores)
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Backup realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 backupFile:
   *                   type: string
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Sem permissão
   */
  static async backupDatabase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Apenas administradores podem realizar backup.' });
      }
      const result = await SettingsService.backupDatabase(req.tenant!.id);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/settings/restore:
   *   post:
   *     summary: Restauração de backup do banco de dados
   *     description: Restaura o banco de dados a partir de um backup (restrito a administradores)
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               backupFile:
   *                 type: string
   *                 description: Caminho ou nome do arquivo de backup
   *     responses:
   *       200:
   *         description: Restauração realizada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Sem permissão
   */
  static async restoreDatabase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Apenas administradores podem restaurar backups.' });
      }
      const { backupFile } = req.body;
      const result = await SettingsService.restoreDatabase(req.tenant!.id, backupFile);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
}
