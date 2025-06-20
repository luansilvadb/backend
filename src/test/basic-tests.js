/**
 * Testes básicos para validar a funcionalidade principal
 * Execute com: npm test
 */

// Simulação simples de testes sem framework externo
const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Iniciando testes básicos da API...\n');

  // Teste 1: Verificar se servidor está rodando
  console.log('1. Testando conexão com servidor...');
  try {
    const response = await fetch(`${API_BASE}/`);
    const text = await response.text();
    
    if (response.ok && text.includes('Dashboard Backend API')) {
      console.log('✅ Servidor está rodando\n');
    } else {
      console.log('❌ Servidor não está respondendo corretamente\n');
      return;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com servidor:', error);
    console.log('💡 Certifique-se de que o servidor está rodando com "npm start"\n');
    return;
  }

  // Teste 2: Verificar documentação Swagger
  console.log('2. Testando documentação Swagger...');
  try {
    const response = await fetch(`${API_BASE}/api-docs/`);
    if (response.ok) {
      console.log('✅ Documentação Swagger disponível\n');
    } else {
      console.log('❌ Documentação Swagger não encontrada\n');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar documentação:', error);
  }

  // Teste 3: Testar endpoint de validação CRON
  console.log('3. Testando validação CRON...');
  try {
    const response = await fetch(`${API_BASE}/api/jobs/validar-cron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cron_expression: '0 9 * * 1-5'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Validação CRON funcionando');
      console.log(`   Expressão: ${data.data.cron_expression}`);
      console.log(`   Válida: ${data.data.valid}\n`);
    } else {
      console.log('❌ Erro na validação CRON:', data.message);
    }
  } catch (error) {
    console.log('❌ Erro ao testar CRON:', error);
  }

  // Teste 4: Testar registro de usuário (dados falsos)
  console.log('4. Testando registro de usuário (dados de teste)...');
  try {
    const testUser = {
      name: 'Usuário Teste',
      email: `teste_${Date.now()}@exemplo.com`,
      password: 'senha123456'
    };

    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.status === 201 && data.success) {
      console.log('✅ Registro de usuário funcionando');
      console.log(`   Usuário: ${data.data.user.name}`);
      console.log(`   ID: ${data.data.user.id}`);
      console.log(`   Token gerado: ${data.data.token ? 'Sim' : 'Não'}\n`);
    } else {
      console.log('❌ Erro no registro:', data.message);
      if (data.errors) {
        console.log('   Erros:', data.errors);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao testar registro:', error);
  }

  console.log('🎯 Testes básicos concluídos!');
  console.log('💡 Para testes completos, configure uma planilha do Google Sheets');
  console.log('💡 e execute os fluxos completos através da documentação em /api-docs');
}

// Executar testes se arquivo for chamado diretamente
if (require.main === module) {
  testAPI().catch(console.error);
}

module.exports = { testAPI };
