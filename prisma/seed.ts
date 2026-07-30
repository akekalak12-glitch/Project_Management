import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database for Enterprise Project & OKR System...');

  // 1. Clean existing data
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprintBacklogItem.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.oKR.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.section.deleteMany();
  await prisma.role.deleteMany();

  // 2. Create Roles with static IDs matching data-store.ts
  const rolesData = [
    { id: '227edd5c-4bd0-4d2c-b804-82f04fda667f', key: 'SUPER_ADMIN', title: 'ผู้อำนวยการกอง', permissionLevel: 100 },
    { id: '3b18d23b-06c4-4bad-87d7-599e49146a89', key: 'ADVISOR', title: 'ผู้เชี่ยวชาญ', permissionLevel: 90 },
    { id: '3e5286ff-6c56-4a40-af31-5a29ccf3b98e', key: 'PROJECT_OWNER', title: 'ผู้อำนวยการส่วน', permissionLevel: 70 },
    { id: '1f7d4b43-4ccf-4126-a661-e5e6331121aa', key: 'SCRUM_MASTER', title: 'หัวหน้างาน / SM', permissionLevel: 50 },
    { id: '732ce5ba-a573-4dd4-9543-a8989554c69a', key: 'STAFF', title: 'เจ้าหน้าที่', permissionLevel: 10 },
  ];

  for (const r of rolesData) {
    await prisma.role.create({ data: r });
  }

  // 3. Create Sections with static IDs matching data-store.ts
  const sectionsData = [
    { id: '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22', name: 'ส่วนจัดการฐานข้อมูล', code: 'จฐ', description: 'บริหารจัดการฐานข้อมูล' },
    { id: 'b9ae7cbd-e2b1-436a-86d8-8656716ef176', name: 'ส่วนเลขานุการคณะกรรมการประเมินราคาทรัพย์สินเพื่อประโยชน์แห่งรัฐ', code: 'ลป', description: 'งานเลขานุการและประเมินราคาทรัพย์สิน' },
    { id: 'f01452e1-e9c9-4454-be82-28771e9f37d4', name: 'ส่วนวิจัยและพัฒนามาตรฐานการประเมินราคาทรัพย์สิน', code: 'วป', description: 'งานวิจัยและพัฒนามาตรฐาน' },
    { id: 'b053e534-2b22-475f-81f8-f2da5e575e30', name: 'ศูนย์บริหารจัดการราคาประเมินทรัพย์สินแห่งชาติ', code: 'ศป', description: 'บริหารจัดการราคาประเมินแห่งชาติ' },
    { id: 'e22d3585-fee2-4db2-954c-a3505d5436b8', name: 'ฝ่ายบริหารงานทั่วไป', code: 'บป', description: 'งานสารบรรณและบริหารงานทั่วไป' },
  ];

  for (const s of sectionsData) {
    await prisma.section.create({ data: s });
  }

  // 4. Create Users (60 users with static IDs matching data-store.ts)
  const users = [];
  const admin = await prisma.user.create({
    data: {
      id: '8b1f19e0-959c-4c6f-9f4e-fcc4ee8466d4',
      name: 'นายเอกลักษณ์ เฉลิมชีพ',
      email: 'akekalakch@treasury.go.th',
      roleId: '227edd5c-4bd0-4d2c-b804-82f04fda667f',
      sectionId: '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
    },
  });
  users.push(admin);

  for (let i = 1; i < 60; i++) {
    const sec = sectionsData[i % sectionsData.length];
    const role = rolesData[(i % (rolesData.length - 1)) + 1];
    const u = await prisma.user.create({
      data: {
        id: `user-gen-${i}`,
        name: `เจ้าหน้าที่ ${sec.name} ท่านที่ ${i}`,
        email: `staff.${i}@treasury.go.th`,
        roleId: role.id,
        sectionId: sec.id,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`,
      },
    });
    users.push(u);
  }

  // 5. Create 5 Projects matching data-store.ts exactly
  const projectsData = [
    {
      id: 'prj-01',
      name: 'ระบบบริหารจัดการฐานข้อมูลราคาทรัพย์สินดิจิทัล',
      code: 'PRJ-DATA-01',
      description: 'โครงการพัฒนาระบบบริหารจัดการและรวบรวมฐานข้อมูลราคาประเมินทรัพย์สินดิจิทัล',
      sectionId: '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22',
      ownerId: '8b1f19e0-959c-4c6f-9f4e-fcc4ee8466d4',
      status: 'IN_PROGRESS',
    },
    {
      id: 'prj-02',
      name: 'ระบบสารสนเทศส่วนเลขานุการประเมินราคาแห่งรัฐ',
      code: 'PRJ-SEC-02',
      description: 'โครงการระบบสารสนเทศสนับสนุนคณะกรรมการประเมินราคาทรัพย์สินเพื่อประโยชน์แห่งรัฐ',
      sectionId: 'b9ae7cbd-e2b1-436a-86d8-8656716ef176',
      ownerId: 'user-gen-1',
      status: 'IN_PROGRESS',
    },
    {
      id: 'prj-03',
      name: 'ระบบวิจัยโมเดลประเมินราคาที่ดินอัตโนมัติ (AI Valuation)',
      code: 'PRJ-AI-03',
      description: 'โครงการวิจัยและพัฒนามาตรฐานประเมินราคาทรัพย์สินด้วยปัญญาประดิษฐ์',
      sectionId: 'f01452e1-e9c9-4454-be82-28771e9f37d4',
      ownerId: 'user-gen-2',
      status: 'PLANNING',
    },
    {
      id: 'prj-04',
      name: 'ระบบศูนย์กลางให้บริการราคาประเมินทรัพย์สินแห่งชาติ (Portal)',
      code: 'PRJ-PORTAL-04',
      description: 'พัฒนา Web Portal บริการประชาชนและหน่วยงานภาครัฐสำหรับค้นหาราคาประเมิน',
      sectionId: 'b053e534-2b22-475f-81f8-f2da5e575e30',
      ownerId: 'user-gen-3',
      status: 'IN_PROGRESS',
    },
    {
      id: 'prj-05',
      name: 'โครงการยกระดับงานสารบรรณอิเล็กทรอนิกส์และฝ่ายบริหารทั่วไป',
      code: 'PRJ-ADMIN-05',
      description: 'โครงการปรับปรุงและพัฒนาระบบเอกสารอิเล็กทรอนิกส์ภายในฝ่ายบริหารงานทั่วไป',
      sectionId: 'e22d3585-fee2-4db2-954c-a3505d5436b8',
      ownerId: 'user-gen-4',
      status: 'COMPLETED',
    },
  ];

  for (const pData of projectsData) {
    const prj = await prisma.project.create({
      data: {
        id: pData.id,
        name: pData.name,
        code: pData.code,
        description: pData.description,
        sectionId: pData.sectionId,
        ownerId: pData.ownerId,
        status: pData.status,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });

    await prisma.projectMember.create({ data: { projectId: prj.id, userId: pData.ownerId, projectRole: 'OWNER' } });
  }

  // 6. Create Sprints matching data-store.ts
  const sprintsData = [
    { id: 'sprint-01-w', projectId: 'prj-01', name: 'Sprint 31 (รายสัปดาห์) - W1 ส.ค. 2026', goal: 'ออกแบบโครงสร้างและฐานข้อมูลระบบประเมินราคา', cadence: 'WEEKLY' },
    { id: 'sprint-01-m', projectId: 'prj-01', name: 'Sprint Q3/August (รายเดือน) - ส.ค. 2026', goal: 'เป้าหมายใหญ่ประจำเดือน: พัฒนา Portal และ API ดึงข้อมูล', cadence: 'MONTHLY' },

    { id: 'sprint-02-w', projectId: 'prj-02', name: 'Sprint 31 (รายสัปดาห์) - งานวาระประชุมคณะกรรมการ', goal: 'พัฒนาระบบวาระประชุมและการลงมติออนไลน์', cadence: 'WEEKLY' },
    { id: 'sprint-02-m', projectId: 'prj-02', name: 'Sprint Q3/August (รายเดือน) - ระบบงานสารสนเทศ', goal: 'ปรับปรุงกระบวนการจัดเก็บรายงานคณะกรรมการแห่งรัฐ', cadence: 'MONTHLY' },

    { id: 'sprint-03-w', projectId: 'prj-03', name: 'Sprint 31 (รายสัปดาห์) - AI Valuation Model Training', goal: 'ทดสอบอัลกอริทึมประเมินราคาทรัพย์สินด้วย Machine Learning', cadence: 'WEEKLY' },
    { id: 'sprint-03-m', projectId: 'prj-03', name: 'Sprint Q3/August (รายเดือน) - AI Model Fine-tuning', goal: 'ปรับแต่งและทดสอบความแม่นยำโมเดลประเมินราคา', cadence: 'MONTHLY' },

    { id: 'sprint-04-w', projectId: 'prj-04', name: 'Sprint 31 (รายสัปดาห์) - Public Portal UI/UX', goal: 'เปิดใช้งานส่วนค้นหาและออกรายงานราคาประเมิน', cadence: 'WEEKLY' },
    { id: 'sprint-04-m', projectId: 'prj-04', name: 'Sprint Q3/August (รายเดือน) - GIS Integration', goal: 'เชื่อมโยงข้อมูลผังเมืองและราคาประเมินผ่าน GIS', cadence: 'MONTHLY' },

    { id: 'sprint-05-w', projectId: 'prj-05', name: 'Sprint 31 (รายสัปดาห์) - E-Document Standardizing', goal: 'ยกระดับระบบเอกสารอิเล็กทรอนิกส์ลายมือชื่อดิจิทัล', cadence: 'WEEKLY' },
    { id: 'sprint-05-m', projectId: 'prj-05', name: 'Sprint Q3/August (รายเดือน) - E-Document Full Rollout', goal: 'เปิดใช้งานระบบสารบรรณอิเล็กทรอนิกส์เต็มรูปแบบ', cadence: 'MONTHLY' },
  ];

  for (const sData of sprintsData) {
    await prisma.sprint.create({
      data: {
        id: sData.id,
        projectId: sData.projectId,
        name: sData.name,
        goal: sData.goal,
        cadence: sData.cadence,
        startDate: new Date('2026-08-01'),
        endDate: new Date(sData.cadence === 'WEEKLY' ? '2026-08-07' : '2026-08-31'),
        isActive: true,
        status: 'ACTIVE',
      },
    });
  }

  // 7. Create Backlog Items matching data-store.ts
  const backlogsData = [
    { id: 'backlog-01-1', sprintId: 'sprint-01-w', title: 'ออกแบบ ER-Diagram ฐานข้อมูลราคาทรัพย์สินดิจิทัล', status: 'SUCCESS', priority: 'HIGH' },
    { id: 'backlog-01-2', sprintId: 'sprint-01-w', title: 'พัฒนา RESTful API สำหรับดึงข้อมูลแปลงที่ดินและราคาประเมิน', status: 'IN_PROGRESS', priority: 'HIGH' },
    { id: 'backlog-01-3', sprintId: 'sprint-01-m', title: 'ปรับปรุงโครงสร้างสถาปัตยกรรมคลาวด์และกระจายโหลด', status: 'PLANNED', priority: 'HIGH' },

    { id: 'backlog-02-1', sprintId: 'sprint-02-w', title: 'ออกแบบหน้าจอระเบียบวาระการประชุมคณะกรรมการแห่งรัฐ', status: 'SUCCESS', priority: 'HIGH' },
    { id: 'backlog-02-2', sprintId: 'sprint-02-w', title: 'พัฒนาระบบบันทึกมติคณะกรรมการและส่งต่อการปฏิบัติงาน', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { id: 'backlog-02-3', sprintId: 'sprint-02-m', title: 'จัดทำระบบคลังเอกสารและรายงานการประชุมย้อนหลัง', status: 'PLANNED', priority: 'MEDIUM' },

    { id: 'backlog-03-1', sprintId: 'sprint-03-w', title: 'รวบรวม Dataset ราคาซื้อขายทรัพย์สินย้อนหลัง 5 ปี', status: 'SUCCESS', priority: 'HIGH' },
    { id: 'backlog-03-2', sprintId: 'sprint-03-w', title: 'ทดสอบความแม่นยำโมเดลประเมินราคาที่ดินรายแปลง (Regression Model)', status: 'IN_PROGRESS', priority: 'HIGH' },
    { id: 'backlog-03-3', sprintId: 'sprint-03-m', title: 'ปรับแต่ง Hyperparameters และสอบทานผลประเมิน AI', status: 'PLANNED', priority: 'HIGH' },

    { id: 'backlog-04-1', sprintId: 'sprint-04-w', title: 'พัฒนาฟังก์ชั่นค้นหาราคาประเมินตามเลขที่โฉนดและพิกัด GIS', status: 'SUCCESS', priority: 'HIGH' },
    { id: 'backlog-04-2', sprintId: 'sprint-04-w', title: 'จัดทำ PDF Export รายงานหนังสือรับรองราคาประเมินทางการ', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { id: 'backlog-04-3', sprintId: 'sprint-04-m', title: 'เชื่อมต่อ Payment Gateway รองรับการชำระค่าธรรมเนียมออนไลน์', status: 'PLANNED', priority: 'HIGH' },

    { id: 'backlog-05-1', sprintId: 'sprint-05-w', title: 'เชื่อมต่อระบบ Digital Signature ลายมือชื่ออิเล็กทรอนิกส์', status: 'SUCCESS', priority: 'HIGH' },
    { id: 'backlog-05-2', sprintId: 'sprint-05-w', title: 'พัฒนาระบบรับส่งและติดตามสถานะหนังสือสารบรรณภายใน', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    { id: 'backlog-05-3', sprintId: 'sprint-05-m', title: 'อบรมเจ้าหน้าที่และเปิดใช้งานระบบสารบรรณอิเล็กทรอนิกส์', status: 'PLANNED', priority: 'MEDIUM' },
  ];

  for (const bData of backlogsData) {
    await prisma.sprintBacklogItem.create({
      data: {
        id: bData.id,
        sprintId: bData.sprintId,
        title: bData.title,
        status: bData.status,
        priority: bData.priority,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-07'),
      },
    });
  }

  // 8. Create Tasks matching data-store.ts
  const tasksData = [
    { id: 'task-01-1', projectId: 'prj-01', sprintId: 'sprint-01-w', backlogItemId: 'backlog-01-1', title: 'สอบทาน Schema ตาราง User และ Section ฐานข้อมูล', status: 'DONE', priority: 'HIGH', assigneeId: '8b1f19e0-959c-4c6f-9f4e-fcc4ee8466d4' },
    { id: 'task-01-2', projectId: 'prj-01', sprintId: 'sprint-01-w', backlogItemId: 'backlog-01-2', title: 'พัฒนา REST API Controller สำหรับดึงราคาแปลงที่ดิน', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: 'user-gen-1' },
    { id: 'task-01-3', projectId: 'prj-01', sprintId: 'sprint-01-m', backlogItemId: 'backlog-01-3', title: 'วางสถาปัตยกรรม Load Balancer บน Hybrid Cloud', status: 'TODO', priority: 'MEDIUM', assigneeId: 'user-gen-2' },

    { id: 'task-02-1', projectId: 'prj-02', sprintId: 'sprint-02-w', backlogItemId: 'backlog-02-1', title: 'ออกแบบ UI Layout หน้าจัดระเบียบวาระประชุม', status: 'DONE', priority: 'HIGH', assigneeId: 'user-gen-3' },
    { id: 'task-02-2', projectId: 'prj-02', sprintId: 'sprint-02-w', backlogItemId: 'backlog-02-2', title: 'เขียน Logic สรุปมติและส่ง Email แจ้งเตือนมติประชุม', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: 'user-gen-4' },
    { id: 'task-02-3', projectId: 'prj-02', sprintId: 'sprint-02-m', backlogItemId: 'backlog-02-3', title: 'สร้าง Search Index สำหรับค้นหารายงานการประชุมย้อนหลัง', status: 'TODO', priority: 'MEDIUM', assigneeId: 'user-gen-5' },

    { id: 'task-03-1', projectId: 'prj-03', sprintId: 'sprint-03-w', backlogItemId: 'backlog-03-1', title: 'Clean ข้อมูลราคาซื้อขายที่ดินและเติมค่าที่ขาดหาย', status: 'DONE', priority: 'HIGH', assigneeId: 'user-gen-6' },
    { id: 'task-03-2', projectId: 'prj-03', sprintId: 'sprint-03-w', backlogItemId: 'backlog-03-2', title: 'เขียนสคริปต์ Train Model Random Forest สำหรับราคาประเมิน', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: 'user-gen-7' },
    { id: 'task-03-3', projectId: 'prj-03', sprintId: 'sprint-03-m', backlogItemId: 'backlog-03-3', title: 'ทำ Validation Test เปรียบเทียบผลประเมิน AI กับราคาตลาด', status: 'IN_REVIEW', priority: 'HIGH', assigneeId: 'user-gen-8' },

    { id: 'task-04-1', projectId: 'prj-04', sprintId: 'sprint-04-w', backlogItemId: 'backlog-04-1', title: 'เชื่อมต่อ Map Component กับ GIS API แสดงขอบเขตที่ดิน', status: 'DONE', priority: 'HIGH', assigneeId: 'user-gen-9' },
    { id: 'task-04-2', projectId: 'prj-04', sprintId: 'sprint-04-w', backlogItemId: 'backlog-04-2', title: 'สร้าง PDF Template สำหรับหนังสือรับรองราคาประเมิน', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: 'user-gen-10' },
    { id: 'task-04-3', projectId: 'prj-04', sprintId: 'sprint-04-m', backlogItemId: 'backlog-04-3', title: 'ทดสอบระบบรับชำระเงิน PromptPay และบัตรเครดิต', status: 'TODO', priority: 'HIGH', assigneeId: 'user-gen-11' },

    { id: 'task-05-1', projectId: 'prj-05', sprintId: 'sprint-05-w', backlogItemId: 'backlog-05-1', title: 'ทดสอบความถูกต้องของใบรับรองอิเล็กทรอนิกส์ Root CA', status: 'DONE', priority: 'HIGH', assigneeId: 'user-gen-12' },
    { id: 'task-05-2', projectId: 'prj-05', sprintId: 'sprint-05-w', backlogItemId: 'backlog-05-2', title: 'พัฒนาระบบรับส่งและออกเลขหนังสือราชการอัตโนมัติ', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: 'user-gen-13' },
    { id: 'task-05-3', projectId: 'prj-05', sprintId: 'sprint-05-m', backlogItemId: 'backlog-05-3', title: 'จัดทำสื่อการสอนและสไลด์คู่มือการใช้งานระบบสารบรรณ', status: 'TODO', priority: 'MEDIUM', assigneeId: 'user-gen-14' },
  ];

  for (const tData of tasksData) {
    await prisma.task.create({
      data: tData,
    });
  }

  console.log('Seeding completed successfully with 100% unified IDs across SQLite and data-store.ts!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
