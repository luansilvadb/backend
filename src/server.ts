import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Sanitiza NODE_ENV para remover aspas, se houver
const NODE_ENV = (process.env.NODE_ENV || 'development').replace(/^["']|["']$/g, '');

// Middleware de segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Substitua pelo seu domínio em produção
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

if (NODE_ENV !== 'test') {
 // Importação e inicialização do rate limiting apenas fora do ambiente de teste
 // eslint-disable-next-line @typescript-eslint/no-var-requires
 const rateLimit = require('express-rate-limit');

 // Rate limiting geral
 const limiter = rateLimit({
   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // máximo 100 requests por IP
   message: {
     success: false,
     error: 'Muitas tentativas. Tente novamente em alguns minutos.'
   },
   standardHeaders: true,
   legacyHeaders: false
 });

 // Rate limiting específico para registro (mais restritivo)
 const registerLimiter = rateLimit({
   windowMs: parseInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hora
   max: parseInt(process.env.REGISTER_RATE_LIMIT_MAX_REQUESTS || '5'), // máximo 5 registros por IP por hora
   message: {
     success: false,
     error: 'Muitas tentativas de registro. Tente novamente em uma hora.',
     code: 'REGISTER_RATE_LIMIT_EXCEEDED'
   },
   standardHeaders: true,
   legacyHeaders: false,
   skipSuccessfulRequests: false // Contar tanto sucessos quanto falhas
 });

 // Rate limiting para login (proteção contra ataques de força bruta)
 const loginLimiter = rateLimit({
   windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
   max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '10'), // máximo 10 tentativas de login por IP
   message: {
     success: false,
     error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
     code: 'LOGIN_RATE_LIMIT_EXCEEDED'
   },
   standardHeaders: true,
   legacyHeaders: false,
   skipSuccessfulRequests: true // Só contar falhas de login
 });

 app.use(limiter);

 // Aplicar rate limiting específico para rotas de autenticação
 app.use('/api/auth/register', registerLimiter);
 app.use('/api/auth/register-tenant', registerLimiter);
 app.use('/api/auth/login', loginLimiter);
}

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging em desenvolvimento
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Configurar Swagger
setupSwagger(app);

// Rotas da API
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema PDV Multitenant API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs',
      swagger_json: '/api-docs.json'
    }
  });
});

// Middleware de tratamento de rotas não encontradas
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/api/health`);
});

export default app;
