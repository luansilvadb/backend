// Sistema de Permissões RBAC (Role-Based Access Control)

export enum Permission {
  // Gestão de Usuários
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // Gestão de Produtos
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_LIST = 'product:list',

  // Gestão de Categorias
  CATEGORY_CREATE = 'category:create',
  CATEGORY_READ = 'category:read',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',
  CATEGORY_LIST = 'category:list',

  // Gestão de Estoque
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_READ = 'inventory:read',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_DELETE = 'inventory:delete',
  INVENTORY_LIST = 'inventory:list',
  INVENTORY_REPORT = 'inventory:report',

  // Gestão de Clientes
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  CUSTOMER_LIST = 'customer:list',

  // Gestão de Vendas
  SALE_CREATE = 'sale:create',
  SALE_READ = 'sale:read',
  SALE_UPDATE = 'sale:update',
  SALE_DELETE = 'sale:delete',
  SALE_LIST = 'sale:list',
  SALE_CANCEL = 'sale:cancel',
  SALE_REFUND = 'sale:refund',
  SALE_REPORT = 'sale:report',

  // Relatórios e Analytics
  REPORT_SALES = 'report:sales',
  REPORT_INVENTORY = 'report:inventory',
  REPORT_FINANCIAL = 'report:financial',
  REPORT_USERS = 'report:users',

  // Configurações do Sistema
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_LOGS = 'system:logs',

  // Gestão de Tenant
  TENANT_UPDATE = 'tenant:update',
  TENANT_CONFIG = 'tenant:config',

  // Sessões e Segurança
  SESSION_MANAGE = 'session:manage',
  SECURITY_AUDIT = 'security:audit',

  // Perfil próprio (todos os usuários)
  PROFILE_READ = 'profile:read',
  PROFILE_UPDATE = 'profile:update',
}

// Definição de Papéis e suas Permissões
export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    // Administrador tem todas as permissões
    ...Object.values(Permission)
  ],

  MANAGER: [
    // Gestão de Usuários (limitada)
    Permission.USER_READ,
    Permission.USER_LIST,
    Permission.USER_CREATE, // Pode criar apenas CASHIER

    // Gestão completa de Produtos
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_LIST,

    // Gestão completa de Categorias
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.CATEGORY_LIST,

    // Gestão completa de Estoque
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_LIST,
    Permission.INVENTORY_REPORT,

    // Gestão completa de Clientes
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    Permission.CUSTOMER_LIST,

    // Gestão de Vendas (incluindo cancelamento e estorno)
    Permission.SALE_CREATE,
    Permission.SALE_READ,
    Permission.SALE_UPDATE,
    Permission.SALE_DELETE,
    Permission.SALE_LIST,
    Permission.SALE_CANCEL,
    Permission.SALE_REFUND,
    Permission.SALE_REPORT,

    // Relatórios
    Permission.REPORT_SALES,
    Permission.REPORT_INVENTORY,
    Permission.REPORT_FINANCIAL,

    // Configurações limitadas
    Permission.TENANT_CONFIG,

    // Sessões próprias
    Permission.SESSION_MANAGE,

    // Perfil próprio
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
  ],

  CASHIER: [
    // Leitura de Produtos e Categorias
    Permission.PRODUCT_READ,
    Permission.PRODUCT_LIST,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_LIST,

    // Leitura de Estoque
    Permission.INVENTORY_READ,
    Permission.INVENTORY_LIST,

    // Gestão básica de Clientes
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_LIST,

    // Operações de Venda
    Permission.SALE_CREATE,
    Permission.SALE_READ,
    Permission.SALE_LIST,

    // Perfil próprio
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,

    // Sessões próprias
    Permission.SESSION_MANAGE,
  ]
};

// Permissões especiais que requerem verificações adicionais
export const SpecialPermissions = {
  // Gerentes só podem criar usuários CASHIER
  USER_CREATE_ROLE_RESTRICTION: {
    MANAGER: ['CASHIER']
  },

  // Usuários só podem gerenciar suas próprias sessões
  SESSION_SELF_ONLY: true,

  // Vendedores só podem ver suas próprias vendas (exceto MANAGER e ADMIN)
  SALE_OWNERSHIP: {
    CASHIER: 'self_only'
  }
};

// Função para verificar se um papel tem uma permissão
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = RolePermissions[userRole];
  return rolePermissions ? rolePermissions.includes(permission) : false;
}

// Função para obter todas as permissões de um papel
export function getRolePermissions(userRole: string): Permission[] {
  return RolePermissions[userRole] || [];
}

// Função para verificar permissões múltiplas
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Função para verificar se tem todas as permissões
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Mapeamento de recursos para permissões
export const ResourcePermissions = {
  // Rotas de usuários
  'POST /api/auth/users': [Permission.USER_CREATE],
  'GET /api/auth/users': [Permission.USER_LIST],
  'GET /api/auth/users/:id': [Permission.USER_READ],
  'PUT /api/auth/users/:id': [Permission.USER_UPDATE],
  'DELETE /api/auth/users/:id': [Permission.USER_DELETE],

  // Rotas de produtos
  'POST /api/products': [Permission.PRODUCT_CREATE],
  'GET /api/products': [Permission.PRODUCT_LIST],
  'GET /api/products/:id': [Permission.PRODUCT_READ],
  'PUT /api/products/:id': [Permission.PRODUCT_UPDATE],
  'DELETE /api/products/:id': [Permission.PRODUCT_DELETE],

  // Rotas de categorias
  'POST /api/categories': [Permission.CATEGORY_CREATE],
  'GET /api/categories': [Permission.CATEGORY_LIST],
  'GET /api/categories/:id': [Permission.CATEGORY_READ],
  'PUT /api/categories/:id': [Permission.CATEGORY_UPDATE],
  'DELETE /api/categories/:id': [Permission.CATEGORY_DELETE],

  // Rotas de estoque
  'POST /api/inventory': [Permission.INVENTORY_CREATE],
  'GET /api/inventory': [Permission.INVENTORY_LIST],
  'GET /api/inventory/:id': [Permission.INVENTORY_READ],
  'PUT /api/inventory/:id': [Permission.INVENTORY_UPDATE],
  'DELETE /api/inventory/:id': [Permission.INVENTORY_DELETE],
  'GET /api/inventory/reports': [Permission.INVENTORY_REPORT],

  // Rotas de clientes
  'POST /api/customers': [Permission.CUSTOMER_CREATE],
  'GET /api/customers': [Permission.CUSTOMER_LIST],
  'GET /api/customers/:id': [Permission.CUSTOMER_READ],
  'PUT /api/customers/:id': [Permission.CUSTOMER_UPDATE],
  'DELETE /api/customers/:id': [Permission.CUSTOMER_DELETE],

  // Rotas de vendas
  'POST /api/sales': [Permission.SALE_CREATE],
  'GET /api/sales': [Permission.SALE_LIST],
  'GET /api/sales/:id': [Permission.SALE_READ],
  'PUT /api/sales/:id': [Permission.SALE_UPDATE],
  'DELETE /api/sales/:id': [Permission.SALE_DELETE],
  'POST /api/sales/:id/cancel': [Permission.SALE_CANCEL],
  'POST /api/sales/:id/refund': [Permission.SALE_REFUND],
  'GET /api/sales/reports': [Permission.SALE_REPORT],

  // Rotas de relatórios
  'GET /api/reports/sales': [Permission.REPORT_SALES],
  'GET /api/reports/inventory': [Permission.REPORT_INVENTORY],
  'GET /api/reports/financial': [Permission.REPORT_FINANCIAL],
  'GET /api/reports/users': [Permission.REPORT_USERS],

  // Rotas de configuração
  'GET /api/system/config': [Permission.SYSTEM_CONFIG],
  'PUT /api/system/config': [Permission.SYSTEM_CONFIG],
  'GET /api/system/logs': [Permission.SYSTEM_LOGS],
  'POST /api/system/backup': [Permission.SYSTEM_BACKUP],

  // Rotas de tenant
  'PUT /api/tenant': [Permission.TENANT_UPDATE],
  'GET /api/tenant/config': [Permission.TENANT_CONFIG],
  'PUT /api/tenant/config': [Permission.TENANT_CONFIG],

  // Rotas de perfil (sempre permitidas para o próprio usuário)
  'GET /api/auth/profile': [Permission.PROFILE_READ],
  'PUT /api/auth/profile': [Permission.PROFILE_UPDATE],

  // Rotas de sessão
  'GET /api/auth/sessions': [Permission.SESSION_MANAGE],
  'DELETE /api/auth/sessions/:id': [Permission.SESSION_MANAGE],
  'POST /api/auth/logout-all': [Permission.SESSION_MANAGE],

  // Rotas de auditoria
  'GET /api/audit': [Permission.SECURITY_AUDIT],
  'GET /api/audit/stats': [Permission.SECURITY_AUDIT],
  'GET /api/audit/export': [Permission.SECURITY_AUDIT],
  'POST /api/audit/cleanup': [Permission.SYSTEM_CONFIG],
};

// Função para obter permissões necessárias para uma rota
export function getRoutePermissions(method: string, path: string): Permission[] {
  const routeKey = `${method.toUpperCase()} ${path}`;
  
  // Procurar correspondência exata primeiro
  const exactMatch = (ResourcePermissions as Record<string, Permission[]>)[routeKey];
  if (exactMatch) {
    return exactMatch;
  }

  // Procurar correspondência com parâmetros
  for (const [route, permissions] of Object.entries(ResourcePermissions)) {
    const routePattern = route.replace(/:[\w]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    
    if (regex.test(routeKey)) {
      return permissions;
    }
  }

  return [];
}
