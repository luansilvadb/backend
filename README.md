# 📊 Dashboard Backend API

🏗️ **Nova Arquitetura SaaS**
- **Persistência**: Google Sheets como banco de dados
- **Multi-usuário**: Cada usuário tem suas próprias configurações

## 🔐 Endpoints de Autenticação

- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login e geração de token JWT
- `GET /api/auth/me` - Dados do usuário autenticado
- `POST /api/auth/logout` - Logout

## 🔧 Endpoints de Configuração

- `POST /api/config/init` - Inicializa planilha de configuração
- `POST /api/config/redmine` - Salva configuração Redmine
- `GET /api/config/redmine` - Obter config Redmine do usuário logado
- `POST /api/config/redmine/test` - Testar conexão Redmine do usuário logado

## 📋 Endpoints de Filtros - CRUD Completo

- `POST /api/filtros` - Criar novo filtro
- `GET /api/filtros` - Listar filtros do usuário logado
- `GET /api/filtros/{filtroId}/detalhes` - Obter detalhes de um filtro
- `PUT /api/filtros/{filtroId}` - Atualizar filtro existente
- `DELETE /api/filtros/{filtroId}` - Excluir filtro

## 📊 Endpoints de Exportação

- `GET /api/exportacoes` - Histórico de exportações do usuário logado
- `POST /api/export/por-filtro/{filtroId}` - Exportar usando filtro salvo

## ⏰ Endpoints de Jobs Agendados

- `POST /api/jobs` - Criar job agendado
- `GET /api/jobs` - Listar jobs do usuário logado
- `PUT /api/jobs/{jobId}` - Atualizar job existente
- `DELETE /api/jobs/{jobId}` - Cancelar job
- `POST /api/jobs/executar-agora/{jobId}` - Executar job manualmente
- `GET /api/jobs/{jobId}/logs` - Ver logs de execução

## 📋 Endpoints Google Sheets (Compatibilidade)

- `GET /api/sheets/{id}/abas` - Lista abas
- `POST /api/sheets/criar-aba` - Cria nova aba
- `POST /api/sheets/salvar-dados` - Salva dados

## 🚀 Fluxo de Uso SaaS

1. **Autenticar**: `POST /api/auth/register` ou `POST /api/auth/login`
2. **Inicializar**: `POST /api/config/init`
3. **Configurar Redmine**: `POST /api/config/redmine`
4. **Criar Filtros**: `POST /api/filtros` (usando nomes legíveis)
5. **Exportar**: `POST /api/export/por-filtro/{filtroId}`
6. **Agendar Jobs**: `POST /api/jobs` (sincronização automática)
7. **Ver Histórico**: `GET /api/exportacoes`

## 🔐 Exemplo de Registro/Login

### Registro:
```json
POST /api/auth/register
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "minhasenha123"
}
```

### Login:
```json
POST /api/auth/login
{
  "email": "joao@empresa.com",
  "password": "minhasenha123"
}
```

### Usar Token (Header):
```
Authorization: Bearer <token_jwt>
```

## 📝 Exemplo de Filtro com Nomes Legíveis

```json
{
  "user_id": "usuario123",
  "nome": "Issues Abertas do Projeto XYZ",
  "projeto": "Projeto XYZ",
  "status": "Aberto",
  "assignedTo": "João Silva",
  "priority": "Alta",
  "tracker": "Bug",
  "data_inicio": "2024-01-01",
  "data_fim": "2024-12-31"
}
```

**Nota**: O backend fará o mapeamento automático dos nomes para IDs do Redmine.

## 🎯 Exemplo Completo de Uso

### 1. Configurar Redmine:
```json
POST /api/config/redmine
{
  "redmine_url": "https://meuredmine.com",
  "api_key": "sua_api_key_aqui"
}
```

### 2. Criar Filtro com Nomes Legíveis:
```json
POST /api/filtros
{
  "nome": "Bugs Críticos do Projeto XYZ",
  "projeto": "Projeto XYZ",
  "status": "Novo",
  "priority": "Imediato",
  "tracker": "Bug",
  "data_inicio": "2024-01-01"
}
```

### 3. Exportar Usando o Filtro:
```json
POST /api/export/por-filtro/filtro_1234567890
{
}
```

✨ **Vantagem**: Você trabalha com nomes legíveis no frontend, e o backend faz todo o mapeamento para IDs automaticamente!

## 💾 Estrutura de Dados (Google Sheets)

A aplicação usa as seguintes abas na planilha de configuração:

- **config_redmine**: Configurações de conexão Redmine por usuário
- **config_sheets**: Configurações de planilhas por usuário
- **filtros**: Filtros salvos por usuário (com nomes legíveis)
- **exportacoes_logs**: Histórico de exportações com estatísticas

## 📋 Como Usar o Endpoint /api/sheets/salvar-dados

### Exemplo de Payload:
```json
{
  "spreadsheetId": "1uJiR89WOl6-JpVxNeirhopcPFoSN_KObWT-XSdOq0UI",
  "nomeAba": "Dados2024",
  "Nome": "João Silva",
  "Email": "joao@email.com",
  "Telefone": "(11) 99999-9999",
  "Empresa": "Minha Empresa LTDA",
  "Cargo": "Desenvolvedor"
}
```

### 📝 Regras:
- **Campos obrigatórios**: `spreadsheetId`, `nomeAba`
- **Campos dinâmicos**: Qualquer outro campo será mapeado para as colunas da planilha
- **Mapeamento**: O nome do campo deve corresponder exatamente ao cabeçalho da coluna
- **Flexibilidade**: Você pode enviar quantos campos quiser

## 🔗 Links

- 📖 [Documentação Swagger UI interativa](https://backend-n3uuykxw7-luandevuxs-projects.vercel.app/api-docs)
- 📄 [Swagger JSON](https://backend-n3uuykxw7-luandevuxs-projects.vercel.app/api-docs.json) - Use no Swagger Editor
- 🧪 Use Postman, Insomnia ou outras ferramentas de teste de API
- 📖 Interface interativa diretamente em `/api-docs`

## ✅ Boas Práticas Implementadas

- ✅ Separação de responsabilidades (MVC)
- ✅ Validação de dados robusta
- ✅ Tratamento de erros padronizado
- ✅ Tipagem TypeScript completa
- ✅ Verificação de integridade (aba existe?)
- ✅ Mapeamento dinâmico de colunas
- ✅ Endpoints RESTful organizados
- ✅ **Rate Limiting**: Proteção contra abuse de API
- ✅ **Operações em Batch**: Redução de requisições ao Google Sheets
- ✅ **Controle de Quota**: Gerenciamento inteligente da API do Google

## ⚡ Rate Limits

- **API Geral**: 100 requisições por 15 minutos
- **Google Sheets**: 30 requisições por minuto
- **Redmine**: 20 requisições por minuto
- **Exportações**: 5 exportações por 5 minutos

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
