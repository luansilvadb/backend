import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { swaggerDescription } from './swagger-description';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema PDV Multitenant API',
      version: '1.0.0',
      description: swaggerDescription
    },
    servers: [
      {
        url: 'http://localhost:3000/',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.pdv.luansilva.com.br/',
        description: 'Servidor de Produção'
      },
      
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint de login'
        }
      },
      schemas: {
        // --- AUTH ---
        LoginRequest: {
          type: 'object',
          required: ['email', 'password', 'tenantSlug'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@empresa.com' },
            password: { type: 'string', example: 'MinhaSenh@123' },
            tenantSlug: { type: 'string', example: 'minha-empresa' }
          }
        },
        // --- CUSTOMER ---
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            phone: { type: 'string', nullable: true },
            cpf: { type: 'string', nullable: true },
            cnpj: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateCustomerRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            cpf: { type: 'string' },
            cnpj: { type: 'string' },
            address: { type: 'string' }
          }
        },
        UpdateCustomerRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            cpf: { type: 'string' },
            cnpj: { type: 'string' },
            address: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        // --- PRODUCT ---
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            sku: { type: 'string' },
            barcode: { type: 'string', nullable: true },
            price: { type: 'number' },
            cost: { type: 'number' },
            unit: { type: 'string', enum: ['UNIT','KG','G','L','ML','M','CM','M2','M3','PACK','BOX','DOZEN'] },
            categoryId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateProductRequest: {
          type: 'object',
          required: ['name', 'sku', 'price', 'cost', 'categoryId'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            sku: { type: 'string' },
            barcode: { type: 'string' },
            price: { type: 'number' },
            cost: { type: 'number' },
            unit: { type: 'string', enum: ['UNIT','KG','G','L','ML','M','CM','M2','M3','PACK','BOX','DOZEN'] },
            categoryId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' }
          }
        },
        UpdateProductRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            sku: { type: 'string' },
            barcode: { type: 'string' },
            price: { type: 'number' },
            cost: { type: 'number' },
            unit: { type: 'string', enum: ['UNIT','KG','G','L','ML','M','CM','M2','M3','PACK','BOX','DOZEN'] },
            categoryId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' }
          }
        },
        // --- CATEGORY ---
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            parentId: { type: 'string', format: 'uuid', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            parentId: { type: 'string', format: 'uuid' }
          }
        },
        UpdateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            parentId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' }
          }
        },
        // --- SALE ---
        Sale: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            saleNumber: { type: 'string' },
            total: { type: 'number' },
            discount: { type: 'number' },
            tax: { type: 'number' },
            paymentMethod: { type: 'string', enum: ['CASH','CREDIT_CARD','DEBIT_CARD','PIX','CHECK'] },
            status: { type: 'string', enum: ['PENDING','COMPLETED','CANCELLED','REFUNDED'] },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            customerId: { type: 'string', format: 'uuid', nullable: true },
            userId: { type: 'string', format: 'uuid' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/SaleItem' }
            }
          }
        },
        SaleItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number' },
            total: { type: 'number' }
          }
        },
        CreateSaleRequest: {
          type: 'object',
          required: ['paymentMethod', 'items'],
          properties: {
            customerId: { type: 'string', format: 'uuid' },
            paymentMethod: { type: 'string', enum: ['CASH','CREDIT_CARD','DEBIT_CARD','PIX','CHECK'] },
            discount: { type: 'number' },
            tax: { type: 'number' },
            notes: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productId', 'quantity', 'unitPrice'],
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer' },
                  unitPrice: { type: 'number' }
                }
              }
            }
          }
        },
        // --- INVENTORY ---
        Inventory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            minStock: { type: 'integer' },
            maxStock: { type: 'integer', nullable: true },
            productId: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        // --- INVENTORY MOVEMENT ---
        InventoryMovement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            type: { type: 'string', enum: ['ENTRADA','SAIDA','AJUSTE','VENDA','DEVOLUCAO','PERDA','TRANSFERENCIA'] },
            reason: { type: 'string', nullable: true },
            reference: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            tenantId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' }
          }
        },
        // --- STOCK ALERT ---
        StockAlert: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            alertType: { type: 'string', enum: ['LOW_STOCK','OUT_OF_STOCK','OVERSTOCK','EXPIRED'] },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            isResolved: { type: 'boolean' },
            resolvedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            tenantId: { type: 'string', format: 'uuid' }
          }
        },
        // --- USER ---
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN','MANAGER','CASHIER'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // --- TENANT ---
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            cnpj: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // --- STORE SETTINGS ---
        StoreSettings: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            address: { type: 'string', nullable: true },
            cnpj: { type: 'string', nullable: true },
            logoUrl: { type: 'string', nullable: true },
            taxes: { type: 'object', nullable: true },
            businessRules: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        // --- API RESPONSE ---
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {},
            message: { type: 'string' },
            error: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/docs/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'PDV Multitenant API - Documentação Oficial',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 0,
      displayOperationId: false,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        req.headers['X-API-Version'] = '1.0.0';
        return req;
      },
      responseInterceptor: (res: any) => {
        return res;
      }
    }
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at: http://localhost:3000/api-docs');
};

export default specs;
