import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@wms.local' },
    update: {},
    create: {
      email: 'admin@wms.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Warehouse',
      role: 'ADMIN_WAREHOUSE',
    },
  });

  // Create a manager user
  const manager = await prisma.user.upsert({
    where: { email: 'manager@wms.local' },
    update: {},
    create: {
      email: 'manager@wms.local',
      passwordHash,
      firstName: 'Manager',
      lastName: 'Warehouse',
      role: 'WAREHOUSE_MANAGER',
    },
  });

  // Create a staff user
  const staff = await prisma.user.upsert({
    where: { email: 'staff@wms.local' },
    update: {},
    create: {
      email: 'staff@wms.local',
      passwordHash,
      firstName: 'Staff',
      lastName: 'Member',
      role: 'WAREHOUSE_STAFF',
    },
  });

  console.log('Users created:', { admin: admin.id, manager: manager.id, staff: staff.id });

  // Create sample catalog items
  const electronics = await prisma.catalogItem.upsert({
    where: { name_category: { name: 'Wireless Mouse', category: 'Electronics' } },
    update: {},
    create: {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with USB receiver',
      category: 'Electronics',
      unitOfMeasure: 'piece',
      createdBy: admin.id,
    },
  });

  const keyboard = await prisma.catalogItem.upsert({
    where: { name_category: { name: 'Mechanical Keyboard', category: 'Electronics' } },
    update: {},
    create: {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with Cherry MX switches',
      category: 'Electronics',
      unitOfMeasure: 'piece',
      createdBy: admin.id,
    },
  });

  console.log('Catalog items created:', { electronics: electronics.id, keyboard: keyboard.id });

  // Create SKUs with inventory
  const sku1 = await prisma.sku.upsert({
    where: { code: 'WM-BLK-001' },
    update: {},
    create: {
      catalogItemId: electronics.id,
      code: 'WM-BLK-001',
      color: 'Black',
      weight: 0.12,
    },
  });

  const sku2 = await prisma.sku.upsert({
    where: { code: 'WM-WHT-001' },
    update: {},
    create: {
      catalogItemId: electronics.id,
      code: 'WM-WHT-001',
      color: 'White',
      weight: 0.12,
    },
  });

  const sku3 = await prisma.sku.upsert({
    where: { code: 'KB-RGB-001' },
    update: {},
    create: {
      catalogItemId: keyboard.id,
      code: 'KB-RGB-001',
      size: 'Full',
      color: 'Black',
      weight: 1.2,
    },
  });

  console.log('SKUs created:', { sku1: sku1.id, sku2: sku2.id, sku3: sku3.id });

  // Create inventory records
  for (const sku of [sku1, sku2, sku3]) {
    await prisma.inventoryRecord.upsert({
      where: { skuId: sku.id },
      update: {},
      create: {
        skuId: sku.id,
        quantity: 50,
        location: 'Warehouse A - Shelf 1',
      },
    });
  }

  console.log('Inventory records created');
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
