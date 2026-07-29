const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { role: true } });
  console.log('=== USERS ===');
  users.forEach(u => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role.key}`);
  });

  const projects = await prisma.project.findMany({
    include: {
      owner: true,
      members: { include: { user: true } }
    }
  });

  console.log('\n=== PROJECTS ===');
  projects.forEach(p => {
    console.log(`\nProject ID: ${p.id} | Name: ${p.name} (${p.code}) | Owner: ${p.owner?.name} (ID: ${p.ownerId})`);
    console.log('  Members count:', p.members.length);
    p.members.forEach(m => {
      console.log(`    - Member User ID: ${m.userId} | Name: ${m.user?.name} | Role: ${m.projectRole}`);
    });
  });
}

main().finally(() => prisma.$disconnect());
