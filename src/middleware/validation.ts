import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// --- SCHEMAS ---

export const customerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, ''),
  cpf: Joi.string()
    .pattern(/^\d{11}$/)
    .message('CPF deve conter apenas 11 dígitos numéricos')
    .optional()
    .allow(null, ''),
  cnpj: Joi.string().optional().allow(null, ''),
  address: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional()
});

export const createCustomerSchema = customerSchema;
export const updateCustomerSchema = customerSchema.fork(['name'], (schema) => schema.optional());

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  tenantSlug: Joi.string().required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  password: Joi.string().min(8).required(),
  tenantSlug: Joi.string().required(),
  inviteCode: Joi.string().optional()
});

export const registerWithTenantSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  password: Joi.string().min(8).required(),
  tenantName: Joi.string().required(),
  tenantSlug: Joi.string().required(),
  tenantEmail: Joi.string().email().required(),
  tenantPhone: Joi.string().optional(),
  tenantAddress: Joi.string().optional(),
  tenantCnpj: Joi.string().optional()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'CASHIER').optional()
});

export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(null, ''),
  sku: Joi.string().required(),
  barcode: Joi.string().optional().allow(null, ''),
  price: Joi.number().required(),
  cost: Joi.number().required(),
  unit: Joi.string().valid('UNIT','KG','G','L','ML','M','CM','M2','M3','PACK','BOX','DOZEN').required(),
  categoryId: Joi.string().required(),
  isActive: Joi.boolean().optional()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(null, ''),
  sku: Joi.string().optional(),
  barcode: Joi.string().optional().allow(null, ''),
  price: Joi.number().optional(),
  cost: Joi.number().optional(),
  unit: Joi.string().valid('UNIT','KG','G','L','ML','M','CM','M2','M3','PACK','BOX','DOZEN').optional(),
  categoryId: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(null, ''),
  parentId: Joi.string().optional().allow(null, '')
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(null, ''),
  parentId: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional()
});

export const createSaleSchema = Joi.object({
  customerId: Joi.string().optional().allow(null, ''),
  paymentMethod: Joi.string().valid('CASH','CREDIT_CARD','DEBIT_CARD','PIX','CHECK').required(),
  discount: Joi.number().optional(),
  tax: Joi.number().optional(),
  notes: Joi.string().optional().allow(null, ''),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().required()
    })
  ).min(1).required()
});

export const updateInventorySchema = Joi.object({
  quantity: Joi.number().integer().required(),
  minStock: Joi.number().integer().optional(),
  maxStock: Joi.number().integer().optional()
});

// --- VALIDATION MIDDLEWARE ---
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details.map((d) => d.message)
      });
    }
    next();
  };
}

// --- EXPORTAÇÃO DE SCHEMAS ---
export const schemas = {
  customer: customerSchema,
  createCustomer: createCustomerSchema,
  updateCustomer: updateCustomerSchema,
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  register: registerSchema,
  registerWithTenant: registerWithTenantSchema,
  changePassword: changePasswordSchema,
  createUser: createUserSchema,
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,
  createCategory: createCategorySchema,
  updateCategory: updateCategorySchema,
  createSale: createSaleSchema,
  updateInventory: updateInventorySchema
};
