const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      role: true
    }
  });
  console.log('--- LOCAL USERS ---');
  users.forEach(u => {
    console.log(`- Email: ${u.email}, Name: ${u.name}, Role: ${u.role?.key}`);
  });
  console.log('-------------------');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
});
