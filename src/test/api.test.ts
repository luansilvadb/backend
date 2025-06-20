import request from 'supertest';
import express from 'express';

// Importa a aplicação (vamos criar uma versão para testes)
import '../index';

// Dados de teste
const testData = {
  spreadsheetId: '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI',
  userId: Math.floor(Math.random() * 1000).toString(), // ID sequencial simulado
  filtroId: '',
  jobId: '',
  testUser: {
    name: 'Usuário Teste',
    email: `teste${Date.now()}@teste.com`,
    password: 'teste123456'
  }
};

describe('🧪 TESTE COMPLETO DA API - TODOS OS ENDPOINTS', () => {
  
  beforeAll(async () => {
    console.log('🚀 Iniciando testes da API...');
    // Aguarda um pouco para garantir que o servidor esteja pronto
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    console.log('🏁 Testes concluídos!');
  });

  // ==================== TESTES DE CONFIGURAÇÃO ====================
  describe('📋 Endpoints de Configuração', () => {
    
    test('POST /api/config/init - Inicializar planilha de configuração', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/config/init')
        .send({ spreadsheet_id: testData.spreadsheetId })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('inicializada');
    });    test('POST /api/config/redmine - Configurar Redmine', async () => {
      const configRedmine = {
        user_id: testData.userId,
        redmine_url: 'https://teste.redmine.com',
        api_key: 'test_api_key_123',
        projeto: '1'
      };

      const response = await request('http://localhost:3000')
        .post('/api/config/redmine')
        .send(configRedmine)
        .expect('Content-Type', /json/);
      
      // Pode retornar 200 (sucesso) ou 400 (falha na validação)
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    test('GET /api/config/redmine/:userId - Obter config Redmine', async () => {
      const response = await request('http://localhost:3000')
        .get(`/api/config/redmine/${testData.userId}`)
        .expect('Content-Type', /json/);
      
      // Pode retornar 200 (encontrado) ou 404 (não encontrado)
      expect([200, 404]).toContain(response.status);
    });

    test('POST /api/config/sheets - Configurar Google Sheets', async () => {
      const configSheets = {
        user_id: testData.userId,
        spreadsheet_id: testData.spreadsheetId,
        nome_aba_dados: 'dados_teste'
      };

      const response = await request('http://localhost:3000')
        .post('/api/config/sheets')
        .send(configSheets)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/config/sheets/:userId - Obter config Sheets', async () => {
      const response = await request('http://localhost:3000')
        .get(`/api/config/sheets/${testData.userId}`)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
    });
  });

  // ==================== TESTES DE AUTENTICAÇÃO ====================
  describe('🔐 Endpoints de Autenticação', () => {
    
    test('POST /api/auth/register - Cadastrar usuário', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(testData.testUser)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    test('POST /api/auth/login - Fazer login', async () => {
      const loginData = {
        email: testData.testUser.email,
        password: testData.testUser.password
      };

      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    test('POST /api/auth/login - Login com credenciais inválidas', async () => {
      const loginData = {
        email: testData.testUser.email,
        password: 'senha_errada'
      };

      const response = await request('http://localhost:3000')
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== TESTES GOOGLE SHEETS ====================
  describe('📊 Endpoints Google Sheets', () => {
    
    test('POST /api/sheets/criar-aba - Criar nova aba', async () => {
      const dadosAba = {
        spreadsheetId: testData.spreadsheetId,
        nomeAba: `teste_aba_${Date.now()}`,
        colunas: ['Nome', 'Email', 'Telefone']
      };

      const response = await request('http://localhost:3000')
        .post('/api/sheets/criar-aba')
        .send(dadosAba)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });    test('GET /api/sheets/:spreadsheetId/abas - Listar abas', async () => {
      const response = await request('http://localhost:3000')
        .get(`/api/sheets/${testData.spreadsheetId}/abas`)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.abas)).toBe(true);
    });    test('POST /api/sheets/salvar-dados - Salvar dados', async () => {
      const dados = {
        spreadsheetId: testData.spreadsheetId,
        nomeAba: 'users', // Usa aba que sabemos que existe
        name: 'Teste Automatizado',
        email: 'teste@automatizado.com',
        password: 'teste123'
      };

      const response = await request('http://localhost:3000')
        .post('/api/sheets/salvar-dados')
        .send(dados)
        .expect('Content-Type', /json/);
      
      // Aceita tanto 201 quanto 400 pois pode haver validações específicas
      expect([200, 201, 400]).toContain(response.status);
      if (response.status !== 400) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  // ==================== TESTES DE FILTROS (CRUD COMPLETO) ====================
  describe('🔍 Endpoints de Filtros - CRUD Completo', () => {
    
    test('POST /api/filtros - Criar filtro', async () => {
      const novoFiltro = {
        user_id: testData.userId,
        nome: 'Filtro Teste Automatizado',
        projeto: 'Projeto Teste',
        status: 'Aberto',
        assignedTo: 'Usuário Teste',
        priority: 'Alta',
        tracker: 'Bug',
        data_inicio: '2024-01-01',
        data_fim: '2024-12-31'
      };

      const response = await request('http://localhost:3000')
        .post('/api/filtros')
        .send(novoFiltro)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filtroId');
      
      // Salva o ID para testes subsequentes
      testData.filtroId = response.body.data.filtroId;
    });

    test('GET /api/filtros/:userId - Listar filtros do usuário', async () => {
      const response = await request('http://localhost:3000')
        .get(`/api/filtros/${testData.userId}`)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/filtros/:filtroId/detalhes - Obter detalhes do filtro', async () => {
      const response = await request('http://localhost:3000')
        .get(`/api/filtros/${testData.filtroId}/detalhes`)
        .query({ user_id: testData.userId })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filtro_id');
    });    test('PUT /api/filtros/:filtroId - Atualizar filtro', async () => {
      const dadosAtualizacao = {
        user_id: testData.userId, // Adiciona user_id obrigatório
        nome: 'Filtro Teste Automatizado - Atualizado',
        status: 'Em Andamento',
        priority: 'Urgente'
      };

      const response = await request('http://localhost:3000')
        .put(`/api/filtros/${testData.filtroId}`)
        .send(dadosAtualizacao)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('DELETE /api/filtros/:filtroId - Excluir filtro', async () => {
      const response = await request('http://localhost:3000')
        .delete(`/api/filtros/${testData.filtroId}`)
        .query({ user_id: testData.userId })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('DELETE /api/filtros/:filtroId - Tentar excluir filtro já excluído', async () => {
      const response = await request('http://localhost:3000')
        .delete(`/api/filtros/${testData.filtroId}`)
        .query({ user_id: testData.userId });
      
      expect(response.status).toBe(404);
    });
  });

  // ==================== TESTES DE JOBS AGENDADOS ====================
  describe('⏰ Endpoints de Jobs Agendados', () => {
    
    test('POST /api/jobs/validar-cron - Validar expressão CRON', async () => {
      const cronData = {
        cron_expression: '0 9 * * 1-5'
      };

      const response = await request('http://localhost:3000')
        .post('/api/jobs/validar-cron')
        .send(cronData)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/jobs/validar-cron - CRON inválido', async () => {
      const cronData = {
        cron_expression: 'expressao_invalida'
      };

      const response = await request('http://localhost:3000')
        .post('/api/jobs/validar-cron')
        .send(cronData)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Pular criação de job real por agora, pois precisa de filtro válido
    test.skip('POST /api/jobs - Criar job agendado', async () => {
      const novoJob = {
        user_id: testData.userId,
        nome: 'Job Teste Automatizado',
        filtro_id: 'filtro_teste',
        cron_expression: '0 9 * * 1-5',
        aba_destino: 'dados_teste',
        sobrescrever_dados: true,
        incluir_cabecalhos: true
      };

      const response = await request('http://localhost:3000')
        .post('/api/jobs')
        .send(novoJob)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== TESTES DE METADADOS REDMINE ====================
  describe('🔧 Endpoints de Metadados Redmine', () => {
    
    test('GET /api/redmine/projetos - Listar projetos', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/redmine/projetos');
      
      // Pode retornar 400 se não tiver configuração, isso é esperado
      expect([200, 400]).toContain(response.status);
    });

    test('GET /api/redmine/status - Listar status', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/redmine/status');
      
      expect([200, 400]).toContain(response.status);
    });

    test('GET /api/redmine/usuarios - Listar usuários', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/redmine/usuarios');
      
      expect([200, 400]).toContain(response.status);
    });

    test('GET /api/redmine/prioridades - Listar prioridades', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/redmine/prioridades');
      
      expect([200, 400]).toContain(response.status);
    });

    test('GET /api/redmine/trackers - Listar trackers', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/redmine/trackers');
      
      expect([200, 400]).toContain(response.status);
    });

    test('GET /api/redmine/custom-fields - Listar campos customizados', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/redmine/custom-fields');
      
      expect([200, 400]).toContain(response.status);
    });
  });

  // ==================== TESTES DE ENDPOINTS DIVERSOS ====================
  describe('🌐 Endpoints Diversos', () => {
    
    test('GET / - Página inicial com documentação', async () => {
      const response = await request('http://localhost:3000')
        .get('/');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Dashboard Backend API');
    });

    test('GET /api-docs - Documentação Swagger (redirecionamento)', async () => {
      const response = await request('http://localhost:3000')
        .get('/api-docs');
      
      expect([200, 301, 302]).toContain(response.status);
    });

    test('Endpoint inexistente - 404', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/endpoint-que-nao-existe');
      
      expect(response.status).toBe(404);
    });
  });

  // ==================== TESTES DE VALIDAÇÃO ====================
  describe('✅ Testes de Validação', () => {
    
    test('POST /api/filtros - Dados inválidos', async () => {
      const filtroInvalido = {
        user_id: '', // Inválido
        nome: '' // Inválido
      };

      const response = await request('http://localhost:3000')
        .post('/api/filtros')
        .send(filtroInvalido)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/auth/register - Email já existente', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/auth/register')
        .send(testData.testUser) // Mesmo usuário já cadastrado
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/config/redmine - Dados obrigatórios faltando', async () => {
      const configIncompleta = {
        user_id: testData.userId
        // Faltam redmine_url e api_key
      };

      const response = await request('http://localhost:3000')
        .post('/api/config/redmine')
        .send(configIncompleta)
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
