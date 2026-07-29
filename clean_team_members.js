const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndFixTeamMembers() {
  console.log('🧹 Re-organizing project team memberships for POs, Scrum Masters, and Staff...');

  const users = await prisma.user.findMany({ include: { role: true, section: true } });
  const projects = await prisma.project.findMany({ include: { section: true } });

  // Map users by role key
  const poUsers = users.filter(u => u.role.key === 'PROJECT_OWNER');
  const smUsers = users.filter(u => u.role.key === 'SCRUM_MASTER');
  const staffUsers = users.filter(u => u.role.key === 'STAFF');

  console.log(`Found ${poUsers.length} POs, ${smUsers.length} SMs, ${staffUsers.length} Staff.`);

  // 1. Delete all existing ProjectMember records
  await prisma.projectMember.deleteMany({});
  console.log('Cleared old ProjectMember records.');

  // 2. Re-assign clean, realistic project memberships:
  // - Each Project has 1 PO as Owner (matching the project's section)
  // - Each Project has 1 Scrum Master as SM
  // - Each Project has 2-3 specific Staff as Members

  for (const prj of projects) {
    // Find PO belonging to this project's section
    const secPo = poUsers.find(u => u.sectionId === prj.sectionId) || poUsers[0];

    // Assign PO as OWNER
    await prisma.projectMember.create({
      data: {
        projectId: prj.id,
        userId: secPo.id,
        projectRole: 'OWNER',
      },
    });

    // Also update project.ownerId
    await prisma.project.update({
      where: { id: prj.id },
      data: { ownerId: secPo.id },
    });

    // Assign Scrum Master (distribute SMs if multiple, or use SM)
    const sm = smUsers[0];
    // Assign SM only to specific projects (e.g. DIGITAL and INFRA projects, not SEC projects)
    if (prj.section.code === 'DIGITAL' || prj.code.endsWith('01') || prj.code.endsWith('02')) {
      await prisma.projectMember.create({
        data: {
          projectId: prj.id,
          userId: sm.id,
          projectRole: 'SCRUM_MASTER',
        },
      });
    }

    // Assign 2-3 specific staff members from the same section
    const sectionStaff = staffUsers.filter(u => u.sectionId === prj.sectionId);
    // Take a small subset based on project code
    const projNum = parseInt(prj.code.slice(-2)) || 1;
    const startIndex = (projNum - 1) % Math.max(1, sectionStaff.length - 2);
    const assignedStaff = sectionStaff.slice(startIndex, startIndex + 3);

    for (const staffMember of assignedStaff) {
      await prisma.projectMember.create({
        data: {
          projectId: prj.id,
          userId: staffMember.id,
          projectRole: 'MEMBER',
        },
      });
    }
  }

  console.log('✅ Project team memberships successfully re-organized!');
}

cleanAndFixTeamMembers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
