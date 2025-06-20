/**
 * Teste Rápido - Dashboard Backend API
 * 
 * Script para testar rapidamente os endpoints principais
 * sem precisar configurar Jest completo
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const testResults = [];

// Dados de teste
const testData = {
  spreadsheetId: '1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI',
  userId: `test_${Date.now()}`,
  testUser: {
    name: 'Teste Rápido',
    email: `teste_${Date.now()}@exemplo.com`,
    password: 'teste123'
  }
};

function logResult(test, success, message, response = null) {
  const result = {
    test,
    success,
    message,
    status: response?.status,
    data: response?.data
  };
  
  testResults.push(result);
  
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
  
  if (!success && response) {
    console.log(`   Status: ${response.status}`);
    if (response.data) {
      console.log(`   Resposta: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }
  }
}

async function testEndpoint(method, url, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    
    const success = response.status === expectedStatus;
    return {
      success,
      response,
      message: success ? 'OK' : `Status ${response.status}, esperado ${expectedStatus}`
    };
      } catch (error) {
    const status = error.response?.status;
    const success = status === expectedStatus;
    
    return {
      success,
      response: error.response,
      message: success ? 'OK (erro esperado)' : `Erro: ${error.code || error.message}`
    };
  }
}

async function runQuickTests() {
  console.log('🚀 INICIANDO TESTES RÁPIDOS DA API');
  console.log('=====================================\n');

  // Teste 1: Página inicial
  const test1 = await testEndpoint('GET', '/');
  logResult('GET /', test1.success, test1.message, test1.response);

  // Teste 2: Swagger docs
  const test2 = await testEndpoint('GET', '/api-docs');
  logResult('GET /api-docs', test2.success, test2.message, test2.response);

  // Teste 3: Inicializar config
  const test3 = await testEndpoint('POST', '/api/config/init', {
    spreadsheet_id: testData.spreadsheetId
  });
  logResult('POST /api/config/init', test3.success, test3.message, test3.response);

  // Teste 4: Registrar usuário
  const test4 = await testEndpoint('POST', '/api/auth/register', testData.testUser, 201);
  logResult('POST /api/auth/register', test4.success, test4.message, test4.response);

  // Teste 5: Login
  const test5 = await testEndpoint('POST', '/api/auth/login', {
    email: testData.testUser.email,
    password: testData.testUser.password
  });
  logResult('POST /api/auth/login', test5.success, test5.message, test5.response);

  // Teste 6: Criar filtro
  const test6 = await testEndpoint('POST', '/api/filtros', {
    user_id: testData.userId,
    nome: 'Teste Rápido Filtro',
    projeto: 'Teste',
    status: 'Aberto'
  });
  logResult('POST /api/filtros', test6.success, test6.message, test6.response);

  // Teste 7: Listar abas (Google Sheets)
  const test7 = await testEndpoint('GET', `/api/sheets/${testData.spreadsheetId}/abas`);
  logResult('GET /api/sheets/:id/abas', test7.success, test7.message, test7.response);

  // Teste 8: Validar CRON
  const test8 = await testEndpoint('POST', '/api/jobs/validar-cron', {
    cron_expression: '0 9 * * 1-5'
  });
  logResult('POST /api/jobs/validar-cron', test8.success, test8.message, test8.response);

  // Teste 9: Endpoint inexistente (deve dar 404)
  const test9 = await testEndpoint('GET', '/api/inexistente', null, 404);
  logResult('GET /api/inexistente (404)', test9.success, test9.message, test9.response);

  console.log('\n📊 RESUMO DOS TESTES');
  console.log('====================');
  
  const passed = testResults.filter(r => r.success).length;
  const total = testResults.length;
  
  console.log(`✅ Passou: ${passed}/${total}`);
  console.log(`❌ Falhou: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! API está funcionando corretamente.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verifique os erros acima.');
    console.log('\n🔧 Dicas:');
    console.log('   - Certifique-se de que o servidor está rodando: npm start');
    console.log('   - Verifique se o Google Sheets está configurado corretamente');
    console.log('   - Verifique o arquivo .env');
  }
  
  console.log('\n📖 Para testes mais detalhados, execute: npm run test');
}

// Se for executado diretamente
if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = { runQuickTests };
