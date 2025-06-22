// 🧪 Demonstração prática do Health Check
const http = require('http');

console.log('🏥 Demonstração: Por que Health Check é importante\n');

// Função para fazer requisição
function checkHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(data)
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Simular monitoramento contínuo
async function monitorApp() {
  console.log('🔍 Iniciando monitoramento automático...\n');
  
  let consecutiveFailures = 0;
  let totalChecks = 0;
  let successfulChecks = 0;
  
  const interval = setInterval(async () => {
    totalChecks++;
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      const result = await checkHealth();
      
      if (result.status === 200) {
        consecutiveFailures = 0;
        successfulChecks++;
        
        console.log(`✅ [${timestamp}] API Saudável - Resposta: ${result.data.responseTime}`);
        
        // Mostrar estatísticas a cada 5 checks
        if (totalChecks % 5 === 0) {
          const uptime = result.data.uptime;
          const dbResponse = result.data.database.responseTime;
          console.log(`📊 Stats: Uptime: ${uptime}, DB: ${dbResponse}, Success Rate: ${Math.round((successfulChecks/totalChecks)*100)}%\n`);
        }
        
      } else {
        consecutiveFailures++;
        console.log(`⚠️  [${timestamp}] API com problemas - Status: ${result.status}`);
        
        if (consecutiveFailures >= 3) {
          console.log('🚨 ALERTA: 3 falhas consecutivas detectadas!');
          console.log('📱 Em produção, isso dispararia:');
          console.log('   - Notificação no Slack/Email');
          console.log('   - Restart automático do container');
          console.log('   - Redirecionamento de tráfego');
          console.log('   - Escalação para equipe de plantão\n');
        }
      }
      
    } catch (error) {
      consecutiveFailures++;
      console.log(`❌ [${timestamp}] API Indisponível - ${error.message}`);
      
      if (consecutiveFailures === 1) {
        console.log('🔧 Primeira falha detectada - iniciando procedimentos...');
      }
      
      if (consecutiveFailures >= 3) {
        console.log('🚨 CRÍTICO: API completamente indisponível!');
        console.log('🚀 Ações automáticas que seriam executadas:');
        console.log('   1. Restart do container/serviço');
        console.log('   2. Failover para servidor backup');
        console.log('   3. Página de manutenção ativada');
        console.log('   4. Equipe de emergência notificada\n');
      }
    }
    
  }, 3000); // Check a cada 3 segundos
  
  // Parar após 30 segundos
  setTimeout(() => {
    clearInterval(interval);
    console.log('\n📊 Resumo do Monitoramento:');
    console.log(`   Total de verificações: ${totalChecks}`);
    console.log(`   Sucessos: ${successfulChecks}`);
    console.log(`   Falhas: ${totalChecks - successfulChecks}`);
    console.log(`   Taxa de sucesso: ${Math.round((successfulChecks/totalChecks)*100)}%`);
    console.log('\n🎯 Isso é o que o Health Check faz 24/7 em produção!');
  }, 30000);
}

// Verificar se API está rodando
checkHealth()
  .then(() => {
    console.log('🎯 API detectada! Iniciando demonstração...\n');
    monitorApp();
  })
  .catch(() => {
    console.log('❌ API não está rodando.');
    console.log('💡 Execute: npm run dev');
    console.log('📍 Depois execute: node health-check-demo.js');
  });