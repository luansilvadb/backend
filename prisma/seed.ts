import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar tenant de exemplo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'loja-exemplo' },
    update: {},
    create: {
      name: 'Loja Exemplo',
      slug: 'loja-exemplo',
      email: 'contato@lojaexemplo.com',
      phone: '(11) 99999-9999',
      address: 'Rua Exemplo, 123 - São Paulo, SP',
      cnpj: '12.345.678/0001-90',
    },
  });

  console.log('✅ Tenant criado:', tenant.name);

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { 
      email_tenantId: {
        email: 'admin@lojaexemplo.com',
        tenantId: tenant.id
      }
    },
    update: {},
    create: {
      email: 'admin@lojaexemplo.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Usuário admin criado:', adminUser.email);

  // Criar categorias de exemplo
  const categories = await Promise.all([
    prisma.category.upsert({
      where: {
        name_tenantId: {
          name: 'Bebidas',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e águas',
        tenantId: tenant.id,
      },
    }),
    prisma.category.upsert({
      where: {
        name_tenantId: {
          name: 'Alimentação',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        name: 'Alimentação',
        description: 'Produtos alimentícios em geral',
        tenantId: tenant.id,
      },
    }),
    prisma.category.upsert({
      where: {
        name_tenantId: {
          name: 'Limpeza',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        name: 'Limpeza',
        description: 'Produtos de limpeza e higiene',
        tenantId: tenant.id,
      },
    }),
  ]);

  console.log('✅ Categorias criadas:', categories.length);

  // Criar produtos de exemplo
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Coca-Cola 350ml',
        description: 'Refrigerante Coca-Cola lata 350ml',
        barcode: '7894900011517',
        price: 4.50,
        cost: 2.80,
        tenantId: tenant.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pão de Açúcar',
        description: 'Pão de açúcar tradicional',
        barcode: '7891234567890',
        price: 6.90,
        cost: 4.20,
        tenantId: tenant.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Detergente Ypê',
        description: 'Detergente líquido Ypê 500ml',
        barcode: '7896098900123',
        price: 2.99,
        cost: 1.80,
        tenantId: tenant.id,
        categoryId: categories[2].id,
      },
    }),
  ]);

  console.log('✅ Produtos criados:', products.length);

  // Criar estoque para os produtos
  const inventory = await Promise.all(
    products.map(product =>
      prisma.inventory.create({
        data: {
          quantity: Math.floor(Math.random() * 100) + 10,
          minStock: 5,
          maxStock: 100,
          tenantId: tenant.id,
          productId: product.id,
        },
      })
    )
  );

  console.log('✅ Estoque criado para', inventory.length, 'produtos');

  // Criar cliente de exemplo
  const customer = await prisma.customer.create({
    data: {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 98765-4321',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 456 - São Paulo, SP',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Cliente criado:', customer.name);

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });