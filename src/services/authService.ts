import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { CreateUserData, LoginData } from '../types';

interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly SALT_ROUNDS = 12;

  static async login(data: LoginData, userAgent?: string, ipAddress?: string) {
    const { email, password, tenantSlug } = data;

    // Buscar tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug, isActive: true }
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado ou inativo');
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId: tenant.id
        },
        isActive: true
      },
      include: { tenant: true }
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha com timing attack protection
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      console.warn(`Failed login attempt for user: ${email} on tenant: ${tenantSlug}`);
      throw new Error('Credenciais inválidas');
    }

    // Gerar session ID único
    const sessionId = uuidv4();

    // Criar sessão no banco de dados
    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        userAgent: userAgent || '',
        ipAddress: ipAddress || ''
      }
    });

    // Gerar tokens
    const accessToken = this.generateAccessToken(user.id, tenant.id, user.role, sessionId);
    const refreshToken = this.generateRefreshToken(user.id, tenant.id, user.role, sessionId);

    // Log successful login
    console.info(`Successful login for user: ${user.email} on tenant: ${tenant.slug}`);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos em segundos
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        }
      }
    };
  }

  static generateAccessToken(userId: string, tenantId: string, role: string, sessionId: string): string {
    const payload: TokenPayload = {
      userId,
      tenantId,
      role,
      sessionId,
      type: 'access'
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { 
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'pdv-system',
        audience: 'pdv-client'
      }
    );
  }

  static generateRefreshToken(userId: string, tenantId: string, role: string, sessionId: string): string {
    const payload: TokenPayload = {
      userId,
      tenantId,
      role,
      sessionId,
      type: 'refresh'
    };

    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret',
      { 
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'pdv-system',
        audience: 'pdv-client'
      }
    );
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret'
      ) as TokenPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      // Verificar se a sessão ainda está ativa
      const session = await prisma.userSession.findUnique({
        where: { 
          id: decoded.sessionId,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            include: { tenant: true }
          }
        }
      });

      if (!session || !session.user.isActive || !session.user.tenant.isActive) {
        throw new Error('Sessão inválida ou expirada');
      }

      // Gerar novo access token
      const newAccessToken = this.generateAccessToken(
        session.user.id,
        session.user.tenantId,
        session.user.role,
        session.id
      );

      return {
        accessToken: newAccessToken,
        expiresIn: 900, // 15 minutos em segundos
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          tenant: {
            id: session.user.tenant.id,
            name: session.user.tenant.name,
            slug: session.user.tenant.slug
          }
        }
      };
    } catch (error) {
      throw new Error('Token de refresh inválido ou expirado');
    }
  }

  static async logout(sessionId: string) {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { 
        isActive: false,
        revokedAt: new Date()
      }
    });

    return { message: 'Logout realizado com sucesso' };
  }

  static async logoutAllSessions(userId: string) {
    await prisma.userSession.updateMany({
      where: { 
        userId,
        isActive: true
      },
      data: { 
        isActive: false,
        revokedAt: new Date()
      }
    });

    return { message: 'Todas as sessões foram encerradas' };
  }

  static async validateSession(sessionId: string): Promise<boolean> {
    const session = await prisma.userSession.findUnique({
      where: { 
        id: sessionId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    return !!session;
  }

  static async createUser(data: CreateUserData, tenantId: string) {
    // Usar salt rounds mais alto para maior segurança
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        tenantId,
        role: data.role || 'CASHIER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return user;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Validar força da nova senha
    if (newPassword.length < 8) {
      throw new Error('A nova senha deve ter pelo menos 8 caracteres');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Invalidar todas as sessões do usuário após mudança de senha
    await this.logoutAllSessions(userId);

    return { message: 'Senha alterada com sucesso. Faça login novamente.' };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  static async getUserSessions(userId: string) {
    const sessions = await prisma.userSession.findMany({
      where: { 
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return sessions;
  }

  static async revokeSession(sessionId: string, userId: string) {
    const session = await prisma.userSession.findFirst({
      where: { 
        id: sessionId,
        userId,
        isActive: true
      }
    });

    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { 
        isActive: false,
        revokedAt: new Date()
      }
    });

    return { message: 'Sessão revogada com sucesso' };
  }

  // Registro em tenant existente
  static async register(data: {
    email: string;
    name: string;
    password: string;
    tenantSlug: string;
    inviteCode?: string;
  }, userAgent?: string, ipAddress?: string) {
    const { email, name, password, tenantSlug, inviteCode } = data;

    // Verificar se o tenant existe e está ativo
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug, isActive: true }
    });

    if (!tenant) {
      throw new Error('Empresa não encontrada ou inativa');
    }

    // Verificar se o email já está em uso neste tenant
    const existingUser = await prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId: tenant.id
        }
      }
    });

    if (existingUser) {
      throw new Error('Este email já está em uso nesta empresa');
    }

    // TODO: Validar código de convite se fornecido
    // if (inviteCode) {
    //   const validInvite = await this.validateInviteCode(inviteCode, tenant.id);
    //   if (!validInvite) {
    //     throw new Error('Código de convite inválido');
    //   }
    // }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Criar usuário com papel padrão CASHIER
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        tenantId: tenant.id,
        role: 'CASHIER' // Papel padrão para novos registros
      }
    });

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        action: 'RESOURCE_CREATED',
        resource: 'user_registration',
        resourceId: user.id,
        method: 'POST',
        endpoint: '/api/auth/register',
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        success: true,
        details: {
          userEmail: email,
          userName: name,
          userRole: 'CASHIER',
          registrationMethod: 'self_register',
          inviteCode: inviteCode ? 'used' : 'none'
        }
      }
    });

    // Fazer login automático após registro
    const sessionId = uuidv4();

    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        userAgent: userAgent || '',
        ipAddress: ipAddress || ''
      }
    });

    const accessToken = this.generateAccessToken(user.id, tenant.id, user.role, sessionId);
    const refreshToken = this.generateRefreshToken(user.id, tenant.id, user.role, sessionId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos em segundos
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        }
      }
    };
  }

  // Registro com criação de tenant (primeiro usuário vira ADMIN)
  static async registerWithTenant(data: {
    // Dados do usuário
    email: string;
    name: string;
    password: string;
    // Dados do tenant
    tenantName: string;
    tenantSlug: string;
    tenantEmail: string;
    tenantPhone?: string;
    tenantAddress?: string;
    tenantCnpj?: string;
  }, userAgent?: string, ipAddress?: string) {
    const { 
      email, name, password,
      tenantName, tenantSlug, tenantEmail, tenantPhone, tenantAddress, tenantCnpj 
    } = data;

    // Verificar se o slug do tenant já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (existingTenant) {
      throw new Error('Este slug de empresa já está em uso');
    }

    // Verificar se o email do tenant já existe
    const existingTenantEmail = await prisma.tenant.findUnique({
      where: { email: tenantEmail }
    });

    if (existingTenantEmail) {
      throw new Error('Este email de empresa já está em uso');
    }

    // Verificar CNPJ se fornecido
    if (tenantCnpj) {
      const existingCnpj = await prisma.tenant.findUnique({
        where: { cnpj: tenantCnpj }
      });

      if (existingCnpj) {
        throw new Error('Este CNPJ já está em uso');
      }
    }

    // Usar transação para criar tenant e usuário
    const result = await prisma.$transaction(async (tx) => {
      // Criar tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          email: tenantEmail,
          phone: tenantPhone,
          address: tenantAddress,
          cnpj: tenantCnpj
        }
      });

      // Verificar se o email do usuário já existe globalmente (opcional)
      const existingUser = await tx.user.findFirst({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Este email já está em uso');
      }

      // Criar hash da senha
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Criar usuário admin
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          tenantId: tenant.id,
          role: 'ADMIN' // Primeiro usuário vira ADMIN
        }
      });

      return { tenant, user };
    });

    const { tenant, user } = result;

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        action: 'RESOURCE_CREATED',
        resource: 'tenant_registration',
        resourceId: tenant.id,
        method: 'POST',
        endpoint: '/api/auth/register-tenant',
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        success: true,
        details: {
          userEmail: email,
          userName: name,
          userRole: 'ADMIN',
          tenantName,
          tenantSlug,
          registrationMethod: 'tenant_creation'
        }
      }
    });

    // Fazer login automático após registro
    const sessionId = uuidv4();

    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        userAgent: userAgent || '',
        ipAddress: ipAddress || ''
      }
    });

    const accessToken = this.generateAccessToken(user.id, tenant.id, user.role, sessionId);
    const refreshToken = this.generateRefreshToken(user.id, tenant.id, user.role, sessionId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos em segundos
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        }
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email
      }
    };
  }
}
