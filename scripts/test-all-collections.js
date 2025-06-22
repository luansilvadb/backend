// scripts/test-all-collections.js
//
// Executa todos os arquivos .postman_collection.json da pasta postman/collections/
// usando Newman, com o ambiente postman/postman-environment.json.
// Gera relatórios CLI e HTML para cada execução em postman/reports/.
//
// Como usar:
// 1. Instale o Newman e o reporter HTML (caso não tenha):
//    npm install --save-dev newman newman-reporter-html
// 2. Execute o script:
//    node scripts/test-all-collections.js
//
// Os relatórios serão salvos em postman/reports/
//
// Requer Node.js >=14

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const collectionsDir = path.join(__dirname, '../postman/collections');
const environment = path.join(__dirname, '../postman/postman-environment.json');
const reportsDir = path.join(__dirname, '../postman/reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const files = fs.readdirSync(collectionsDir)
  .filter(f => f.endsWith('.postman_collection.json'));

// Ordem explícita para garantir autenticação antes dos testes protegidos
const executionOrder = [
  'auth.postman_collection.json',
  // Adicione aqui outras collections que precisam rodar antes das protegidas
];

// Adiciona as demais collections que não estão na ordem explícita
const orderedFiles = [
  ...executionOrder.filter(f => files.includes(f)),
  ...files.filter(f => !executionOrder.includes(f)),
];

if (orderedFiles.length === 0) {
  console.error('Nenhuma collection encontrada em postman/collections/');
  process.exit(1);
}

function runCollectionsSequentially(collectionFiles) {
  for (const file of collectionFiles) {
    const collectionPath = path.join(collectionsDir, file);
    const baseName = path.basename(file, '.postman_collection.json');
    const htmlReport = path.join(reportsDir, `${baseName}.html`);
    const cliReport = path.join(reportsDir, `${baseName}.cli.txt`);

    console.log(`Executando collection: ${file}`);

    try {
      // Executa o Newman e salva saída CLI e HTML
      execSync(
        `npx newman run "${collectionPath}" -e "${environment}" --reporters cli,html --reporter-html-export "${htmlReport}"`,
        { stdio: ['ignore', fs.openSync(cliReport, 'w'), fs.openSync(cliReport, 'w')] }
      );
      console.log(`Relatórios gerados: ${htmlReport} (HTML), ${cliReport} (CLI)`);
    } catch (err) {
      console.error(`Erro ao executar ${file}. Veja o relatório CLI para detalhes.`);
    }
  }
}

runCollectionsSequentially(orderedFiles);

console.log('\nExecução concluída. Relatórios disponíveis em postman/reports/');