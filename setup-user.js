const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDefaultUser() {
  try {
    // Create or update default user
    const user = await prisma.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        email: 'default@example.com',
        name: 'Default User',
      }
    });
    
    console.log('✅ Default user created/updated:', user.id);
    
    // Check for bank accounts
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: 'default-user' }
    });
    
    console.log(`Found ${accounts.length} bank accounts for default user`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDefaultUser();