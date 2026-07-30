import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database for Enterprise Project & OKR System...');

  // 1. Clean existing data
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.oKR.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.section.deleteMany();
  await prisma.role.deleteMany();

  // 2. Create Roles
  const rolesData = [
    { id: '227edd5c-4bd0-4d2c-b804-82f04fda667f', key: 'SUPER_ADMIN', title: 'ผู้อำนวยการกอง', permissionLevel: 100 },
    { id: '3b18d23b-06c4-4bad-87d7-599e49146a89', key: 'ADVISOR', title: 'ผู้เชี่ยวชาญ', permissionLevel: 80 },
    { id: '3e5286ff-6c56-4a40-af31-5a29ccf3b98e', key: 'PROJECT_OWNER', title: 'ผู้อำนวยการส่วน', permissionLevel: 60 },
    { id: '1f7d4b43-4ccf-4126-a661-e5e6331121aa', key: 'SCRUM_MASTER', title: 'หัวหน้าฝ่าย', permissionLevel: 40 },
    { id: '732ce5ba-a573-4dd4-9543-a8989554c69a', key: 'STAFF', title: 'เจ้าหน้าที่ปฏิบัติงาน', permissionLevel: 20 },
  ];

  const rolesMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r });
    rolesMap[r.key] = role.id;
  }

  // 3. Create Sections matching data-store.ts / Master Data 100%
  const sectionsData = [
    { id: '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22', name: 'ส่วนจัดการฐานข้อมูล', code: 'จฐ', description: 'บริหารจัดการฐานข้อมูล' },
    { id: 'b9ae7cbd-e2b1-436a-86d8-8656716ef176', name: 'ส่วนเลขานุการคณะกรรมการประเมินราคาทรัพย์สินเพื่อประโยชน์แห่งรัฐ', code: 'ลป', description: 'งานเลขานุการและประเมินราคาทรัพย์สิน' },
    { id: 'f01452e1-e9c9-4454-be82-28771e9f37d4', name: 'ส่วนวิจัยและพัฒนามาตรฐานการประเมินราคาทรัพย์สิน', code: 'วป', description: 'งานวิจัยและพัฒนามาตรฐาน' },
    { id: 'b053e534-2b22-475f-81f8-f2da5e575e30', name: 'ศูนย์บริหารจัดการราคาประเมินทรัพย์สินแห่งชาติ', code: 'ศป', description: 'บริหารจัดการราคาประเมินแห่งชาติ' },
    { id: 'e22d3585-fee2-4db2-954c-a3505d5436b8', name: 'ฝ่ายบริหารงานทั่วไป', code: 'บป', description: 'งานสารบรรณและบริหารงานทั่วไป' },
  ];

  const sectionsList: any[] = [];
  for (const s of sectionsData) {
    const sec = await prisma.section.create({ data: s });
    sectionsList.push(sec);
  }

  // 4. Create Users
  const users = [];
  const admin = await prisma.user.create({
    data: {
      id: '8b1f19e0-959c-4c6f-9f4e-fcc4ee8466d4',
      name: 'นายเอกลักษณ์ เฉลิมชีพ (ผอ.กอง)',
      email: 'akekalakch@treasury.go.th',
      roleId: rolesMap['SUPER_ADMIN'],
      sectionId: sectionsList[0].id,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
    },
  });
  users.push(admin);

  const advisor = await prisma.user.create({
    data: {
      name: 'อาจารย์ วิทยา ปัญญาประเสริฐ (ผู้เชี่ยวชาญ)',
      email: 'wittaya.advisor@organization.go.th',
      roleId: rolesMap['ADVISOR'],
      sectionId: sectionsList[2].id,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wittaya',
    },
  });
  users.push(advisor);

  const poNames = [
    { name: 'นาย ณรงค์ศักดิ์ สุขเจริญ (ผอ.ส่วนจัดการฐานข้อมูล)', secId: sectionsList[0].id },
    { name: 'นางสาว พิมลพรรณ วงศ์สว่าง (ผอ.ส่วนเลขานุการฯ)', secId: sectionsList[1].id },
    { name: 'นาย ชัยวัฒน์ รัตนมนตรี (ผอ.ส่วนวิจัยและพัฒนาฯ)', secId: sectionsList[2].id },
    { name: 'ดร. กรกช สุวรรณภูมิ (ผอ.ศูนย์บริหารจัดการฯ)', secId: sectionsList[3].id },
  ];
  const pos = [];
  for (let i = 0; i < poNames.length; i++) {
    const po = await prisma.user.create({
      data: {
        name: poNames[i].name,
        email: `po.${i}@treasury.go.th`,
        roleId: rolesMap['PROJECT_OWNER'],
        sectionId: poNames[i].secId,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=PO_${i}`,
      },
    });
    pos.push(po);
    users.push(po);
  }

  const sm = await prisma.user.create({
    data: {
      name: 'นาย ศุภชัย ตั้งใจมั่น (หัวหน้าฝ่าย/Scrum Master)',
      email: 'suphachai.sm@treasury.go.th',
      roleId: rolesMap['SCRUM_MASTER'],
      sectionId: sectionsList[0].id,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suphachai',
    },
  });
  users.push(sm);

  const staffList = [];
  for (let i = 1; i <= 53; i++) {
    const targetSec = sectionsList[(i - 1) % sectionsList.length];
    const staff = await prisma.user.create({
      data: {
        name: `เจ้าหน้าที่ ${i} (${targetSec.name})`,
        email: `staff.${i}@treasury.go.th`,
        roleId: rolesMap['STAFF'],
        sectionId: targetSec.id,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Staff_${i}`,
      },
    });
    staffList.push(staff);
    users.push(staff);
  }

  // 5. Create Projects
  const projectTitles = [
    { name: 'ระบบบริหารจัดการฐานข้อมูลราคาทรัพย์สินดิจิทัล', code: 'PRJ-DATA-01', secId: sectionsList[0].id, owner: pos[0] },
    { name: 'ระบบสารสนเทศส่วนเลขานุการประเมินราคาแห่งรัฐ', code: 'PRJ-SEC-02', secId: sectionsList[1].id, owner: pos[1] },
    { name: 'ระบบวิจัยโมเดลประเมินราคาที่ดินอัตโนมัติ (AI Valuation)', code: 'PRJ-AI-03', secId: sectionsList[2].id, owner: pos[2] },
    { name: 'ระบบศูนย์กลางให้บริการราคาประเมินทรัพย์สินแห่งชาติ (Portal)', code: 'PRJ-PORTAL-04', secId: sectionsList[3].id, owner: pos[3] },
    { name: 'โครงการยกระดับงานสารบรรณอิเล็กทรอนิกส์และฝ่ายบริหารทั่วไป', code: 'PRJ-ADMIN-05', secId: sectionsList[4].id, owner: pos[0] },
  ];

  const createdProjects = [];
  for (const pt of projectTitles) {
    const prj = await prisma.project.create({
      data: {
        name: pt.name,
        code: pt.code,
        description: `รายละเอียดงานของ ${pt.name}`,
        sectionId: pt.secId,
        ownerId: pt.owner.id,
        status: pt.code.endsWith('01') || pt.code.endsWith('02') ? 'IN_PROGRESS' : 'PLANNING',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    createdProjects.push(prj);

    await prisma.projectMember.create({ data: { projectId: prj.id, userId: pt.owner.id, projectRole: 'OWNER' } });
    await prisma.projectMember.create({ data: { projectId: prj.id, userId: sm.id, projectRole: 'SCRUM_MASTER' } });

    const secStaff = staffList.filter((s) => s.sectionId === pt.secId);
    for (const staffMember of secStaff.slice(0, 4)) {
      await prisma.projectMember.create({ data: { projectId: prj.id, userId: staffMember.id, projectRole: 'MEMBER' } });
    }
  }

  // 6. Create Sprints (Weekly & Monthly)
  const mainProject = createdProjects[0];

  const weeklySprint = await prisma.sprint.create({
    data: {
      projectId: mainProject.id,
      name: 'Sprint 31 (รายสัปดาห์) - W1 ส.ค. 2026',
      goal: 'ส่งมอบฟีเจอร์ UI/UX และซิงค์ข้อมูลประจำสัปดาห์',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-07'),
      cadence: 'WEEKLY',
      isActive: true,
      status: 'ACTIVE',
    },
  });

  const monthlySprint = await prisma.sprint.create({
    data: {
      projectId: mainProject.id,
      name: 'Sprint Q3/August (รายเดือน) - ส.ค. 2026',
      goal: 'เป้าหมายใหญ่ประจำเดือน: ปรับปรุงโครงสร้างระบบ Portal และเชื่อมต่อ API',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
      cadence: 'MONTHLY',
      isActive: true,
      status: 'ACTIVE',
    },
  });

  // 7. Create Sprint Backlog Items
  const b1 = await prisma.sprintBacklogItem.create({
    data: {
      sprintId: weeklySprint.id,
      title: 'ออกแบบ ER-Diagram ฐานข้อมูลราคาทรัพย์สิน',
      description: 'รวบรวมฟิลด์และออกแบบความสัมพันธ์ระหว่างตาราง',
      priority: 'HIGH',
      status: 'SUCCESS',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-07'),
    },
  });

  const b2 = await prisma.sprintBacklogItem.create({
    data: {
      sprintId: weeklySprint.id,
      title: 'พัฒนา RESTful API สำหรับดึงข้อมูลแปลงที่ดินและราคาประเมิน',
      description: 'สร้าง RESTful API ดึงข้อมูลความเร็วสูง',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-07'),
    },
  });

  // 8. Create Tasks
  await prisma.task.create({
    data: {
      projectId: mainProject.id,
      sprintId: weeklySprint.id,
      backlogItemId: b1.id,
      title: 'สอบทาน Schema ตาราง User และ Section',
      description: 'ตรวจสอบความถูกต้องของ Foreign Keys',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: users[0].id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: mainProject.id,
      sprintId: weeklySprint.id,
      backlogItemId: b2.id,
      title: 'ทดสอบประสิทธิภาพการ Query บน Cloudflare D1',
      description: 'ทดสอบ Query ความเร็วและ Indexing',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: users[0].id,
    },
  });

  console.log('Seeding completed successfully with Master Data Sections 100% matched!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
