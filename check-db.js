const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Check if default-user exists
    const user = await prisma.user.findUnique({
      where: { id: 'default-user' }
    });
    console.log('User "default-user":', user ? 'EXISTS' : 'DOES NOT EXIST');

    // Check all bank accounts
    const accounts = await prisma.bankAccount.findMany();
    console.log('\nTotal bank accounts in database:', accounts.length);
    
    if (accounts.length > 0) {
      console.log('\nAccounts:');
      accounts.forEach(acc => {
        console.log(`- ${acc.name} (${acc.mask}) - User: ${acc.userId}`);
      });
    }

    // Check for any users
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    console.log('\nTotal users:', users.length);
    if (users.length > 0) {
      console.log('Users:');
      users.forEach(u => console.log(`- ${u.id} (${u.email})`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();