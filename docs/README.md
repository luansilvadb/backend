# 🏪 Sistema PDV Multitenant

Sistema completo de Ponto de Venda com arquitetura multitenant.

## 📁 Estrutura do Projeto

```
📦 backend/
├── 📁 src/                 # Código fonte da aplicação
├── 📁 prisma/              # Schema e migrações do banco
├── 📁 postman/             # Documentação e testes Postman
├── 📁 scripts/             # Scripts utilitários
├── 📁 docs/                # Documentação do projeto
├── 📄 package.json         # Dependências do projeto
├── 📄 tsconfig.json        # Configurações TypeScript
└── 📄 .env.example         # Variáveis de ambiente exemplo
```

## 🚀 Como usar

1. **Instalar dependências:** `npm install`
2. **Configurar ambiente:** Copie `.env.example` para `.env`
3. **Executar migrações:** `npm run migrate`
4. **Iniciar servidor:** `npm run dev`

## 📋 Documentação

- **API:** Importe `postman/postman-collection.json` no Postman
- **Ambiente:** Importe `postman/postman-environment.json` no Postman

## 🔧 Scripts disponíveis

- **Scripts utilitários:** Pasta `scripts/`
- **Desenvolvimento:** `npm run dev`
- **Build:** `npm run build`
- **Testes:** Scripts na pasta `scripts/`
