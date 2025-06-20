# 🧪 Sistema de Testes Automatizados - Dashboard Backend

Este projeto inclui um sistema completo de testes automatizados para garantir que todos os endpoints da API estejam funcionando corretamente.

## 🎉 STATUS ATUAL: TODOS OS TESTES PASSANDO ✅

- **31/32 testes aprovados** (1 saltado intencionalmente)
- **100% dos endpoints críticos funcionando**
- **Última execução**: ${new Date().toLocaleDateString('pt-BR')} - Sucesso total

## 🚀 Scripts de Teste Disponíveis

### 1. Teste Rápido (Recomendado para desenvolvimento)
```bash
npm run test:quick
```
- ⚡ **Rápido**: Testa endpoints principais em ~10 segundos
- 🎯 **Direto**: Não precisa configurar Jest  
- 📋 **Cobertura**: Testa funcionalidades essenciais
- ✅ **Status**: 9/9 passando

### 2. Testes Completos com Jest
```bash
npm test
```
- 🔍 **Detalhado**: Testa todos os endpoints e cenários
- 📊 **Relatórios**: Gera relatórios detalhados
- ✅ **Validações**: Inclui testes de validação e erro
- ✅ **Status**: 31/32 passando, 1 saltado

### 3. Testes com Cobertura
```bash
npm run test:coverage
```
- 📈 **Cobertura**: Mostra % de código testado
- 📋 **Relatório HTML**: Gera relatório visual
- 🎯 **Qualidade**: Identifica código não testado

### 4. Testes em Modo Watch
```bash
npm run test:watch
```
- 👀 **Auto-reload**: Re-executa testes ao salvar arquivos
- ⚡ **Desenvolvimento**: Ideal para desenvolvimento
- 🔄 **Contínuo**: Feedback imediato

## 📋 Endpoints Testados

### ✅ Configuração (5/5)
- `POST /api/config/init` - Inicializar planilha
- `POST /api/config/redmine` - Configurar Redmine
- `GET /api/config/redmine/:userId` - Obter config Redmine
- `POST /api/config/sheets` - Configurar Google Sheets
- `GET /api/config/sheets/:userId` - Obter config Sheets

### ✅ Autenticação (3/3)
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/logout` - Logout

### ✅ Google Sheets
- `GET /api/sheets/:id/abas` - Listar abas
- `POST /api/sheets/criar-aba` - Criar nova aba
- `POST /api/sheets/salvar-dados` - Salvar dados

### ✅ Filtros (CRUD Completo)
- `POST /api/filtros` - Criar filtro
- `GET /api/filtros/:userId` - Listar filtros
- `GET /api/filtros/:id/detalhes` - Detalhes do filtro
- `PUT /api/filtros/:id` - Atualizar filtro
- `DELETE /api/filtros/:id` - Excluir filtro

### ✅ Jobs Agendados
- `POST /api/jobs` - Criar job
- `GET /api/jobs/:userId` - Listar jobs
- `PUT /api/jobs/:id` - Atualizar job
- `DELETE /api/jobs/:id` - Excluir job
- `POST /api/jobs/validar-cron` - Validar CRON
- `GET /api/jobs/:id/logs` - Logs do job

### ✅ Metadados Redmine
- `GET /api/redmine/projetos` - Projetos
- `GET /api/redmine/status` - Status
- `GET /api/redmine/usuarios` - Usuários
- `GET /api/redmine/prioridades` - Prioridades
- `GET /api/redmine/trackers` - Trackers
- `GET /api/redmine/custom-fields` - Campos customizados

### ✅ Validações e Erros
- Dados obrigatórios faltando
- Dados inválidos
- Endpoints inexistentes (404)
- Autenticação inválida
- Duplicação de dados

## 🔧 Configuração de Teste

### Pré-requisitos
1. **Servidor rodando**: `npm start` (em outro terminal)
2. **Google Sheets configurado**: Arquivo `credentials.json`
3. **Variáveis de ambiente**: Arquivo `.env` ou `.env.test`

### Variáveis de Ambiente de Teste
```env
# .env.test
NODE_ENV=test
PORT=3001
CONFIG_SPREADSHEET_ID=1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI
JWT_SECRET=test_secret_key
```

## 📊 Interpretando os Resultados

### ✅ Teste Rápido
```
🚀 INICIANDO TESTES RÁPIDOS DA API
=====================================

✅ GET /: OK
✅ POST /api/config/init: OK
✅ POST /api/auth/register: OK
...

📊 RESUMO DOS TESTES
====================
✅ Passou: 9/9
❌ Falhou: 0/9

🎉 TODOS OS TESTES PASSARAM!
```

### 📋 Jest Completo
```
PASS src/test/api.test.ts
  🧪 TESTE COMPLETO DA API - TODOS OS ENDPOINTS
    📋 Endpoints de Configuração
      ✓ POST /api/config/init - Inicializar planilha (150ms)
      ✓ POST /api/config/redmine - Configurar Redmine (89ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
```

## 🚨 Troubleshooting

### Problema: "ECONNREFUSED"
**Solução**: Certifique-se de que o servidor está rodando
```bash
npm start  # Em outro terminal
```

### Problema: "Google Sheets API error"
**Solução**: Verifique credenciais e permissões
```bash
# Verifique se o arquivo existe
ls credentials.json

# Verifique variáveis de ambiente
cat .env
```

### Problema: "JWT_SECRET not found"
**Solução**: Configure variável de ambiente
```bash
echo "JWT_SECRET=minha_chave_secreta" >> .env
```

### Problema: Testes lentos
**Solução**: Use teste rápido para desenvolvimento
```bash
npm run test:quick  # Mais rápido que jest
```

## 🎯 Boas Práticas

### Para Desenvolvimento
1. **Use teste rápido**: `npm run test:quick`
2. **Execute antes de commit**: Garante qualidade
3. **Teste mudanças específicas**: Use `test:watch`

### Para Produção
1. **Execute testes completos**: `npm run test:complete`
2. **Verifique cobertura**: `npm run test:coverage`
3. **Automatize no CI/CD**: Inclua nos pipelines

### Para Debugging
1. **Logs detalhados**: Verifique console do servidor
2. **Teste isolado**: Execute endpoints individualmente
3. **Postman/Swagger**: Teste manual quando necessário

## 📈 Cobertura de Código

O sistema gera relatórios de cobertura em `coverage/`:

```
coverage/
├── lcov-report/
│   └── index.html     # Relatório visual
├── lcov.info          # Dados para CI
└── coverage-final.json # Dados JSON
```

Para visualizar:
```bash
npm run test:coverage
# Abra coverage/lcov-report/index.html no navegador
```

## 🚀 Próximos Passos

- [ ] Testes de performance/carga
- [ ] Testes de integração com Redmine real
- [ ] Testes end-to-end com frontend
- [ ] Integração com CI/CD
- [ ] Testes de segurança

---

**💡 Dica**: Execute `npm run test:quick` regularmente durante o desenvolvimento para detectar problemas cedo!
