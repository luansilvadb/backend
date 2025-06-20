# 📊 Dashboard Backend API

Plataforma SaaS para integração entre **Redmine** e **Google Sheets** com agendamento automático de sincronizações.

## 🎯 Funcionalidades

- ✅ **Autenticação JWT** - Sistema completo de usuários
- ✅ **Configuração Redmine** - Integração via API Key
- ✅ **Configuração Google Sheets** - Service Account
- ✅ **Filtros Personalizados** - CRUD completo com nomes legíveis
- ✅ **Exportação de Issues** - Do Redmine para Sheets
- ✅ **Jobs Agendados** - Sincronização automática com CRON
- ✅ **Logs e Histórico** - Auditoria completa
- ✅ **Rate Limiting** - Proteção contra abuse
- ✅ **Validações** - Entrada de dados segura
- ✅ **Documentação Swagger** - API totalmente documentada

## 🚀 Início Rápido

### 1. Instalação
```bash
npm install
```

### 2. Configuração
Copie `.env.example` para `.env` e configure:
```bash
CONFIG_SPREADSHEET_ID=sua_planilha_de_configuracao_id
JWT_SECRET=sua_chave_secreta_jwt
PORT=3000
```

### 3. Credenciais Google Sheets
Coloque o arquivo `credentials.json` da Service Account na raiz do projeto.

### 4. Executar
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### 5. Acessar
- **API**: http://localhost:3000
- **Documentação**: http://localhost:3000/api-docs
- **Swagger UI**: Interface completa com exemplos

## 🧪 Testes

```bash
# Executar testes básicos
npm test

# Para testes manuais completos
npm run test:manual
```

💡 **Dica**: Explore a documentação interativa em `/api-docs` para testar todos os endpoints!

## Estrutura
- `index.js`: Código principal do backend
- `.env`: Variáveis de ambiente (não versionado)

## Futuro
- Integração com frontend
- Validação de dados
- Autenticação
