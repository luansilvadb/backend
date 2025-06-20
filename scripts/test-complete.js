#!/usr/bin/env node

/**
 * Script de teste completo para a API Dashboard Backend
 * 
 * Este script executa todos os testes automatizados disponíveis:
 * - Testes unitários com Jest
 * - Testes de integração de todos os endpoints
 * - Validações de dados
 * - Testes de erro
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 INICIANDO TESTE COMPLETO DA API DASHBOARD BACKEND');
console.log('==================================================');
console.log('');

// Função para executar comandos
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`⚡ Executando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
  });
}

async function runTests() {
  try {
    console.log('📋 ETAPA 1: Build do projeto...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Build concluído!\n');

    console.log('📋 ETAPA 2: Verificando se o servidor está rodando...');
    console.log('💡 IMPORTANTE: Certifique-se de que o servidor está rodando em localhost:3000');
    console.log('   Execute: npm start (em outro terminal)\n');
    
    // Aguarda um pouco para dar tempo do usuário iniciar o servidor
    console.log('⏳ Aguardando 5 segundos para você iniciar o servidor...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📋 ETAPA 3: Executando testes automatizados...');
    await runCommand('npm', ['test']);
    console.log('✅ Testes concluídos!\n');

    console.log('🎉 TODOS OS TESTES FORAM EXECUTADOS COM SUCESSO!');
    console.log('==================================================');
    console.log('📊 Relatório resumido:');
    console.log('   ✅ Build: OK');
    console.log('   ✅ Testes de endpoints: OK');
    console.log('   ✅ Validações: OK');
    console.log('');
    console.log('📖 Para ver relatório detalhado com cobertura:');
    console.log('   npm run test:coverage');

  } catch (error) {
    console.error('❌ ERRO durante os testes:', error.message);
    console.log('');
    console.log('🔧 Dicas para resolver problemas:');
    console.log('   1. Certifique-se de que o servidor está rodando: npm start');
    console.log('   2. Verifique as variáveis de ambiente no .env');
    console.log('   3. Verifique se o Google Sheets está acessível');
    console.log('   4. Execute npm install para garantir dependências');
    process.exit(1);
  }
}

// Verifica se foi chamado diretamente
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
