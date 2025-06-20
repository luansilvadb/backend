import { Request, Response } from 'express';
import { authService, AuthRequest } from '../services/AuthService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';

export class AuthController {
  private googleSheetsService: GoogleSheetsService;

  constructor() {
    this.googleSheetsService = new GoogleSheetsService();
  }

  // Método para gerar próximo ID sequencial de usuário
  private async gerarProximoIdUsuario(): Promise<string> {
    try {
      // Buscar todos os usuários para determinar o próximo ID
      const rows = await this.googleSheetsService.lerDados(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'users!A:A'
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
      console.error('Erro ao gerar próximo ID de usuário:', error);
      // Em caso de erro, usar timestamp como fallback
      return Date.now().toString();
    }
  }

  // POST /api/auth/register
  async register(req: Request, res: Response) {
    console.log('=== REGISTRO DE USUÁRIO ===');
    console.log('Body recebido:', { ...req.body, password: '***' });

    try {
      const { name, email, password } = req.body;

      // Validações básicas
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email deve ter formato válido'
        });
      }

      // Verificar se usuário já existe
      const usuarioExistente = await this.buscarUsuarioPorEmail(email);
      if (usuarioExistente) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }      // Hash da senha
      const hashedPassword = await authService.hashPassword(password);      // Criar usuário com ID sequencial
      const userId = await this.gerarProximoIdUsuario();
      
      const userData = {
        user_id: userId,
        name,
        email,
        password: hashedPassword,
        created_at: new Date().toISOString(),
        active: 'SIM'
      };

      // Salvar na planilha de usuários
      const resultado = await this.googleSheetsService.salvarDados({
        spreadsheetId: process.env.CONFIG_SPREADSHEET_ID || '',
        nomeAba: 'users',
        dados: userData
      });

      if (!resultado.success) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao salvar usuário',
          error: resultado.message
        });
      }

      // Gerar token
      const token = authService.generateToken({
        id: userId,
        email,
        name
      });

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: userId,
            name,
            email
          },
          token
        }
      });

    } catch (error: any) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response) {
    console.log('=== LOGIN ===');
    console.log('Body recebido:', { ...req.body, password: '***' });

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário
      const usuario = await this.buscarUsuarioPorEmail(email);
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Verificar senha
      const senhaValida = await authService.verifyPassword(password, usuario.password);
      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Verificar se usuário está ativo
      if (usuario.active !== 'SIM') {
        return res.status(401).json({
          success: false,
          message: 'Usuário desativado'
        });
      }

      // Gerar token
      const token = authService.generateToken({
        id: usuario.user_id,
        email: usuario.email,
        name: usuario.name
      });

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: usuario.user_id,
            name: usuario.name,
            email: usuario.email
          },
          token
        }
      });

    } catch (error: any) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // GET /api/auth/me
  async me(req: AuthRequest, res: Response) {
    console.log('=== DADOS DO USUÁRIO ===');

    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      res.json({
        success: true,
        message: 'Dados do usuário',
        data: {
          user: req.user
        }
      });

    } catch (error: any) {
      console.error('Erro ao obter dados do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // POST /api/auth/logout
  async logout(req: Request, res: Response) {
    console.log('=== LOGOUT ===');

    try {
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error: any) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Método auxiliar para buscar usuário por email
  private async buscarUsuarioPorEmail(email: string): Promise<any | null> {
    try {
      const rows = await this.googleSheetsService.lerDados(
        process.env.CONFIG_SPREADSHEET_ID || '',
        'users!A:F'
      );

      if (rows.length <= 1) return null;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[2] === email) { // email na terceira coluna
          return {
            user_id: row[0],
            name: row[1],
            email: row[2],
            password: row[3],
            created_at: row[4],
            active: row[5]
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }
}

export const authController = new AuthController();
