import dotenv from 'dotenv';

// Carrega variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

// Configurações globais para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Porta diferente para testes

// Aumenta o timeout padrão para operações com Google Sheets
jest.setTimeout(30000);
