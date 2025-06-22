# 🎯 GUIA MESTRE - MÁXIMA QUALIDADE DE CÓDIGO E RESTRIÇÕES ABSOLUTAS

## 🚨 PROIBIÇÕES CRÍTICAS E INEGOCIÁVEIS

### ❌ VIOLAÇÕES QUE CAUSAM FALHA IMEDIATA

**CÓDIGO E DOCUMENTAÇÃO:**
- **NUNCA** omitir código com `// ...`, `// resto igual`, `// continuação`
- **NUNCA** usar placeholders como `// TODO`, `// FIXME` em produção
- **NUNCA** deixar imports não utilizados
- **NUNCA** usar `any` em TypeScript (exceto casos extremos documentados)
- **NUNCA** hardcodar valores (usar constantes/env vars)
- **NUNCA** deixar console.log em produção
- **NUNCA** usar `var` (apenas `const`/`let`)

**ARQUITETURA:**
- **NUNCA** misturar responsabilidades em uma classe/função
- **NUNCA** criar dependências circulares
- **NUNCA** acessar banco diretamente do controller
- **NUNCA** retornar senhas ou dados sensíveis em APIs
- **NUNCA** usar bibliotecas desatualizadas com vulnerabilidades

**PRISMA/BANCO:**
- **NUNCA** omitir modelos com comentários `// ... (outros modelos)`
- **NUNCA** deixar relacionamentos sem foreign keys
- **NUNCA** usar CASCADE sem análise de impacto
- **NUNCA** criar índices desnecessários ou duplicados

**CODE REVIEW/ALTERAÇÕES:**
- **SEMPRE** ler a versão anterior completa do arquivo (antes da alteração) para restaurar todos o código que estavam lá
- **SEMPRE** fazer a alteração apenas mantendo o restante do código intacto
- **NUNCA** omitir partes existentes do código durante updates/refactoring

---

## 🏆 PADRÕES DE EXCELÊNCIA OBRIGATÓRIOS

### 1️⃣ QUALIDADE DE CÓDIGO - NÍVEL ENTERPRISE

**ESTRUTURA DE ARQUIVOS:**
```
src/
├── controllers/     # APENAS lógica de requisição/resposta
├── services/        # TODA lógica de negócio
├── repositories/    # APENAS acesso a dados
├── middlewares/     # Interceptadores e validações
├── validators/      # Schemas de validação
├── types/          # Tipos TypeScript personalizados
├── utils/          # Funções utilitárias puras
├── constants/      # Constantes da aplicação
└── tests/          # Testes unitários e integração
```

**NOMENCLATURA OBRIGATÓRIA:**
- **Classes:** PascalCase (`UserService`, `ProductController`)
- **Métodos/Funções:** camelCase (`createUser`, `validateInput`)
- **Constantes:** SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Arquivos:** kebab-case (`user-service.ts`, `product-controller.ts`)
- **Interfaces:** PascalCase com prefixo I (`IUserRepository`)

### 2️⃣ TYPESCRIPT - TIPAGEM RIGOROSA

**CONFIGURAÇÃO OBRIGATÓRIA (tsconfig.json):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**REGRAS DE TIPAGEM:**
- **SEMPRE** tipar parâmetros de função
- **SEMPRE** tipar retornos de função
- **SEMPRE** usar interfaces para objetos complexos
- **SEMPRE** usar enums para valores fixos
- **SEMPRE** usar generics quando apropriado

### 3️⃣ VALIDAÇÃO E TRATAMENTO DE ERROS

**VALIDAÇÃO OBRIGATÓRIA:**
- Joi/Zod para validação de entrada
- Middleware de validação em todas as rotas
- Sanitização de dados de entrada
- Rate limiting implementado

**TRATAMENTO DE ERROS:**
```typescript
class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### 4️⃣ SEGURANÇA - NÍVEL BANCÁRIO

**AUTENTICAÇÃO/AUTORIZAÇÃO:**
- JWT com refresh tokens
- Rate limiting por usuário/IP
- Validação de CORS rigorosa
- Headers de segurança (helmet.js)

**DADOS SENSÍVEIS:**
- Criptografia para dados em repouso
- Hashing seguro de senhas (bcrypt/argon2)
- Logs sem informações sensíveis
- Sanitização contra XSS/SQL Injection

---

## 🔍 AUDITORIA AUTOMÁTICA OBRIGATÓRIA

### 5️⃣ LINTING E FORMATAÇÃO

**ESLint - Configuração Máxima:**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "airbnb-typescript/base"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "error"
  }
}
```

**Prettier - Formatação Consistente:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 6️⃣ TESTES - COBERTURA MÍNIMA 90%

**ESTRUTURA DE TESTES:**
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@test.com' };
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const userData = { name: 'John', email: 'invalid-email' };
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

**TIPOS DE TESTE OBRIGATÓRIOS:**
- **Unitários:** Cada função/método isoladamente
- **Integração:** Fluxos completos da API
- **E2E:** Cenários de usuário real
- **Carga:** Performance sob stress

---

## 📊 MÉTRICAS DE QUALIDADE - GATES OBRIGATÓRIOS

### 7️⃣ QUALITY GATES - NENHUM CÓDIGO PASSA SEM

**MÉTRICAS MÍNIMAS:**
- ✅ Cobertura de testes: ≥ 90%
- ✅ Complexidade ciclomática: ≤ 10 por função
- ✅ Linhas por função: ≤ 50
- ✅ Parâmetros por função: ≤ 5
- ✅ Duplicação de código: ≤ 3%
- ✅ Vulnerabilidades de segurança: 0

**FERRAMENTAS DE ANÁLISE:**
- SonarQube para análise estática
- CodeClimate para maintainability
- Snyk para vulnerabilidades
- Lighthouse para performance

### 8️⃣ PERFORMANCE - BENCHMARKS RIGOROSOS

**TEMPOS DE RESPOSTA MÁXIMOS:**
- GET simples: ≤ 100ms
- POST/PUT/DELETE: ≤ 200ms
- Consultas complexas: ≤ 500ms
- Relatórios: ≤ 2s

**OTIMIZAÇÕES OBRIGATÓRIAS:**
- Índices otimizados no banco
- Cache em múltiplas camadas
- Paginação em todas as listagens
- Compressão gzip habilitada

---

## 🔧 PADRÕES DE IMPLEMENTAÇÃO AVANÇADOS

### 9️⃣ DESIGN PATTERNS OBRIGATÓRIOS

**Repository Pattern:**
```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(user: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}
```

**Service Layer Pattern:**
```typescript
class UserService {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    // Validação
    this.validateUserData(data);
    
    // Regra de negócio
    const hashedPassword = await this.hashPassword(data.password);
    
    // Persistência
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword
    });

    // Efeito colateral
    await this.emailService.sendWelcomeEmail(user.email);

    return user;
  }
}
```

**Factory Pattern para Validators:**
```typescript
class ValidatorFactory {
  static create(type: 'user' | 'product' | 'order'): IValidator {
    switch (type) {
      case 'user': return new UserValidator();
      case 'product': return new ProductValidator();
      case 'order': return new OrderValidator();
      default: throw new Error(`Validator for ${type} not found`);
    }
  }
}
```

### 🔟 DOCUMENTAÇÃO SWAGGER - ENTERPRISE LEVEL

**SCHEMA COMPONENTS:**
```yaml
components:
  schemas:
    ApiResponse:
      type: object
      required: [success, message]
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: "Operation completed successfully"
        data:
          type: object

    ErrorResponse:
      type: object
      required: [success, error]
      properties:
        success:
          type: boolean
          example: false
        error:
          $ref: '#/components/schemas/ErrorDetail'

    ErrorDetail:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          example: "VALIDATION_ERROR"
        message:
          type: string
          example: "Invalid input parameters"
        details:
          type: array
          items:
            $ref: '#/components/schemas/ValidationError'

    ValidationError:
      type: object
      required: [field, message]
      properties:
        field:
          type: string
          example: "email"
        message:
          type: string
          example: "Invalid email format"
        value:
          type: string
          example: "invalid-email"

    PaginatedResponse:
      type: object
      required: [data, pagination]
      properties:
        data:
          type: array
          items: {}
        pagination:
          $ref: '#/components/schemas/PaginationInfo'

    PaginationInfo:
      type: object
      required: [page, limit, total, totalPages]
      properties:
        page:
          type: integer
          minimum: 1
          example: 1
        limit:
          type: integer
          minimum: 1
          maximum: 100
          example: 10
        total:
          type: integer
          minimum: 0
          example: 150
        totalPages:
          type: integer
          minimum: 0
          example: 15
```

---

## ⚡ PROTOCOLO DE REVIEW - ZERO TOLERÂNCIA

### 1️⃣1️⃣ CHECKLIST PRÉ-COMMIT OBRIGATÓRIO

**AUTOMÁTICO (Git Hooks):**
- ☑️ ESLint passou sem warnings
- ☑️ Prettier formatou código
- ☑️ Testes unitários passaram
- ☑️ Cobertura ≥ 90%
- ☑️ Build produção sucesso
- ☑️ Análise de segurança passou

**MANUAL (Code Review):**
- ☑️ Arquitetura SOLID respeitada
- ☑️ Padrões de nomenclatura seguidos
- ☑️ Documentação atualizada
- ☑️ Performance analisada
- ☑️ Segurança validada
- ☑️ Testes adequados implementados

### 1️⃣2️⃣ PIPELINE CI/CD - GATES RIGOROSOS

**ETAPAS OBRIGATÓRIAS:**
1. **Lint & Format** → Falha = Block
2. **Unit Tests** → Cobertura < 90% = Block
3. **Integration Tests** → Qualquer falha = Block
4. **Security Scan** → Vulnerabilidade HIGH = Block
5. **Performance Test** → Degradação > 10% = Block
6. **E2E Tests** → Cenários críticos = Block

---

## 🎯 RESULTADO FINAL - CÓDIGO ENTERPRISE

### CARACTERÍSTICAS DO CÓDIGO APROVADO:

- ✅ Zero warnings/errors no linting
- ✅ 100% tipado em TypeScript
- ✅ Cobertura de testes ≥ 90%
- ✅ Performance otimizada
- ✅ Segurança enterprise
- ✅ Documentação completa
- ✅ Padrões SOLID aplicados
- ✅ Monitoramento implementado
- ✅ Logs estruturados
- ✅ Tratamento de erros robusto

### ZERO TOLERÂNCIA PARA:

- ❌ Código não tipado
- ❌ Testes insuficientes
- ❌ Vulnerabilidades de segurança
- ❌ Performance inadequada
- ❌ Documentação incompleta
- ❌ Violações de padrões
- ❌ Código duplicado
- ❌ Hardcoding de valores
- ❌ Dependências circulares
- ❌ Responsabilidades misturadas

### PROTOCOLO DE VIOLAÇÃO:

1. **BLOQUEIO IMEDIATO** do merge
2. **CORREÇÃO OBRIGATÓRIA** antes de prosseguir
3. **RE-REVIEW COMPLETO** após correção
4. **VALIDAÇÃO** de todos os gates novamente
5. **APROVAÇÃO** somente após conformidade 100%