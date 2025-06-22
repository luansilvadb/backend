/**
 * @swagger
 * components:
 *   examples:
 *     LoginExample:
 *       summary: Exemplo de login
 *       value:
 *         email: "admin@lojaexemplo.com"
 *         password: "admin123"
 *         tenantSlug: "loja-exemplo"
 *     
 *     ProductExample:
 *       summary: Exemplo de produto
 *       value:
 *         name: "Coca-Cola 350ml"
 *         description: "Refrigerante Coca-Cola lata 350ml"
 *         barcode: "7894900011517"
 *         price: 4.50
 *         cost: 2.80
 *         categoryId: "550e8400-e29b-41d4-a716-446655440000"
 *     
 *     SaleExample:
 *       summary: Exemplo de venda
 *       value:
 *         paymentMethod: "CASH"
 *         discount: 0
 *         tax: 0
 *         notes: "Venda balcão"
 *         items:
 *           - productId: "550e8400-e29b-41d4-a716-446655440000"
 *             quantity: 2
 *             unitPrice: 4.50
 *           - productId: "550e8400-e29b-41d4-a716-446655440001"
 *             quantity: 1
 *             unitPrice: 6.90
 *     
 *     CustomerExample:
 *       summary: Exemplo de cliente
 *       value:
 *         name: "João Silva"
 *         email: "joao@email.com"
 *         phone: "(11) 98765-4321"
 *         cpf: "123.456.789-00"
 *         address: "Rua das Flores, 456 - São Paulo, SP"
 *     
 *     CategoryExample:
 *       summary: Exemplo de categoria
 *       value:
 *         name: "Bebidas"
 *         description: "Refrigerantes, sucos e águas"
 *     
 *     InventoryUpdateExample:
 *       summary: Exemplo de atualização de estoque
 *       value:
 *         quantity: 50
 *         minStock: 10
 *         maxStock: 100
 */

export {};