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
    { key: 'SUPER_ADMIN', title: 'ผู้อำนวยการกอง', permissionLevel: 100 },
    { key: 'ADVISOR', title: 'ผู้เชี่ยวชาญ', permissionLevel: 80 },
    { key: 'PROJECT_OWNER', title: 'ผู้อำนวยการส่วน', permissionLevel: 60 },
    { key: 'SCRUM_MASTER', title: 'หัวหน้าฝ่าย', permissionLevel: 40 },
    { key: 'STAFF', title: 'เจ้าหน้าที่ปฏิบัติงาน', permissionLevel: 20 },
  ];

  const rolesMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r });
    rolesMap[r.key] = role.id;
  }

  // 3. Create Sections
  const sectionsData = [
    { name: 'ส่วนนวัตกรรมดิจิทัล', code: 'DIGITAL', description: 'พัฒนานวัตกรรมและเทคโนโลยีดิจิทัลองค์กร' },
    { name: 'ส่วนโครงสร้างพื้นฐาน', code: 'INFRA', description: 'ดูแลระบบเครือข่าย คลาวด์ และฮาร์ดแวร์' },
    { name: 'ส่วนการจัดการข้อมูล', code: 'DATA', description: 'บริหารจัดการคลังข้อมูล Big Data และ AI' },
    { name: 'ส่วนความมั่นคงปลอดภัย', code: 'SEC', description: 'ดูแลไซเบอร์ซีเคียวริตี้ และการกำกับดูแล' },
  ];

  const sectionsMap: Record<string, string> = {};
  for (const s of sectionsData) {
    const sec = await prisma.section.create({ data: s });
    sectionsMap[s.code] = sec.id;
  }

  // 4. Create Users
  const users = [];
  const admin = await prisma.user.create({
    data: {
      name: 'ดร. สมชาย วิเศษกุล (ผอ.กอง)',
      email: 'somchai.director@organization.go.th',
      roleId: rolesMap['SUPER_ADMIN'],
      sectionId: sectionsMap['DIGITAL'],
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai',
    },
  });
  users.push(admin);

  const advisor = await prisma.user.create({
    data: {
      name: 'อาจารย์ วิทยา ปัญญาประเสริฐ (ผู้เชี่ยวชาญ)',
      email: 'wittaya.advisor@organization.go.th',
      roleId: rolesMap['ADVISOR'],
      sectionId: sectionsMap['DATA'],
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wittaya',
    },
  });
  users.push(advisor);

  const poNames = [
    { name: 'นาย ณรงค์ศักดิ์ สุขเจริญ (ผอ.ส่วนนวัตกรรม)', code: 'DIGITAL' },
    { name: 'นางสาว พิมลพรรณ วงศ์สว่าง (ผอ.ส่วนไอทีโครงสร้าง)', code: 'INFRA' },
    { name: 'นาย ชัยวัฒน์ รัตนมนตรี (ผอ.ส่วนข้อมูลองค์กร)', code: 'DATA' },
    { name: 'ดร. กรกช สุวรรณภูมิ (ผอ.ส่วนไซเบอร์ซีเคียวริตี้)', code: 'SEC' },
  ];
  const pos = [];
  for (let i = 0; i < poNames.length; i++) {
    const po = await prisma.user.create({
      data: {
        name: poNames[i].name,
        email: `po.${poNames[i].code.toLowerCase()}@organization.go.th`,
        roleId: rolesMap['PROJECT_OWNER'],
        sectionId: sectionsMap[poNames[i].code],
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=PO_${i}`,
      },
    });
    pos.push(po);
    users.push(po);
  }

  const sm = await prisma.user.create({
    data: {
      name: 'นาย ศุภชัย ตั้งใจมั่น (หัวหน้าฝ่าย/Scrum Master)',
      email: 'suphachai.sm@organization.go.th',
      roleId: rolesMap['SCRUM_MASTER'],
      sectionId: sectionsMap['DIGITAL'],
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suphachai',
    },
  });
  users.push(sm);

  const staffList = [];
  const secKeys = ['DIGITAL', 'INFRA', 'DATA', 'SEC'];
  for (let i = 1; i <= 53; i++) {
    const secCode = secKeys[(i - 1) % 4];
    const staff = await prisma.user.create({
      data: {
        name: `เจ้าหน้าที่ ${i} (เจ้าหน้าที่ ${secCode})`,
        email: `staff.${i}@organization.go.th`,
        roleId: rolesMap['STAFF'],
        sectionId: sectionsMap[secCode],
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Staff_${i}`,
      },
    });
    staffList.push(staff);
    users.push(staff);
  }

  // 5. Create Projects
  const projectTitles = [
    { name: 'โครงการพัฒนาระบบ Portal องค์กรยุคใหม่', code: 'PRJ-DIG-01', sec: 'DIGITAL', owner: pos[0] },
    { name: 'โครงการระบบ Smart Workflow & E-Document', code: 'PRJ-DIG-02', sec: 'DIGITAL', owner: pos[0] },
    { name: 'โครงการ AI Assistance สำหรับการบริการประชาชน', code: 'PRJ-DIG-03', sec: 'DIGITAL', owner: pos[0] },
    { name: 'โครงการระบบ Mobile App ให้บริการภายใน', code: 'PRJ-DIG-04', sec: 'DIGITAL', owner: pos[0] },
    { name: 'โครงการยกระดับ UX/UI ของระบบงานเดิม', code: 'PRJ-DIG-05', sec: 'DIGITAL', owner: pos[0] },

    { name: 'โครงการย้ายระบบงานเข้าสู่ Hybrid Cloud', code: 'PRJ-INF-01', sec: 'INFRA', owner: pos[1] },
    { name: 'โครงการปรับปรุงระบบเครือข่ายความเร็วสูง', code: 'PRJ-INF-02', sec: 'INFRA', owner: pos[1] },
    { name: 'โครงการจัดทำ Data Center สำรอง (DR Site)', code: 'PRJ-INF-03', sec: 'INFRA', owner: pos[1] },
    { name: 'โครงการติดตั้งระบบ Virtual Desktop (VDI)', code: 'PRJ-INF-04', sec: 'INFRA', owner: pos[1] },
    { name: 'โครงการจัดหาคอมพิวเตอร์และ Server ประจำปี', code: 'PRJ-INF-05', sec: 'INFRA', owner: pos[1] },

    { name: 'โครงการจัดทำ Enterprise Data Lakehouse', code: 'PRJ-DAT-01', sec: 'DATA', owner: pos[2] },
    { name: 'โครงการพัฒนา Dashboard ข้อมูลภาพรวมผู้บริหาร', code: 'PRJ-DAT-02', sec: 'DATA', owner: pos[2] },
    { name: 'โครงการวิเคราะห์ข้อมูลทำนายการใช้บริการ (Predictive Analytics)', code: 'PRJ-DAT-03', sec: 'DATA', owner: pos[2] },
    { name: 'โครงการธรรมาภิบาลข้อมูลองค์กร (Data Governance)', code: 'PRJ-DAT-04', sec: 'DATA', owner: pos[2] },
    { name: 'โครงการเชื่อมโยงข้อมูลระหว่างหน่วยงาน (API Gateway)', code: 'PRJ-DAT-05', sec: 'DATA', owner: pos[2] },

    { name: 'โครงการพัฒนาระบบ Zero Trust Architecture', code: 'PRJ-SEC-01', sec: 'SEC', owner: pos[3] },
    { name: 'โครงการทดสอบการเจาะระบบ (Penetration Testing)', code: 'PRJ-SEC-02', sec: 'SEC', owner: pos[3] },
    { name: 'โครงการยกระดับมาตรฐาน ISO 27001:2022', code: 'PRJ-SEC-03', sec: 'SEC', owner: pos[3] },
    { name: 'โครงการติดตั้งระบบ SOC 24/7 Monitoring', code: 'PRJ-SEC-04', sec: 'SEC', owner: pos[3] },
    { name: 'โครงการอบรม Cybersecurity Awareness ประจำปี', code: 'PRJ-SEC-05', sec: 'SEC', owner: pos[3] },
    { name: 'โครงการจัดการสิทธิ์การเข้าถึงแบบ IAM Enterprise', code: 'PRJ-SEC-06', sec: 'SEC', owner: pos[3] },
  ];

  const createdProjects = [];
  for (const pt of projectTitles) {
    const prj = await prisma.project.create({
      data: {
        name: pt.name,
        code: pt.code,
        description: `รายละเอียดงานของ ${pt.name} มุ่งเน้นการเพิ่มประสิทธิภาพระดับองค์กร`,
        sectionId: sectionsMap[pt.sec],
        ownerId: pt.owner.id,
        status: pt.code.endsWith('01') || pt.code.endsWith('02') ? 'IN_PROGRESS' : 'PLANNING',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    createdProjects.push(prj);

    await prisma.projectMember.create({ data: { projectId: prj.id, userId: pt.owner.id, projectRole: 'OWNER' } });
    await prisma.projectMember.create({ data: { projectId: prj.id, userId: sm.id, projectRole: 'SCRUM_MASTER' } });

    const sectionStaff = staffList.filter((s) => s.sectionId === sectionsMap[pt.sec]);
    for (const staffMember of sectionStaff.slice(0, 4)) {
      await prisma.projectMember.create({ data: { projectId: prj.id, userId: staffMember.id, projectRole: 'MEMBER' } });
    }
  }

  // 6. Create Sprints (Weekly & Monthly)
  const mainProject = createdProjects[0];

  // Weekly Sprint
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

  // Monthly Sprint
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

  // Tasks for Weekly Sprint
  const weeklyTasks = [
    { title: 'ออกแบบ Wireframe หน้า Sprint Board รายสัปดาห์', status: 'DONE', priority: 'HIGH', cat: 'DONE' },
    { title: 'พัฒนา Filter ปุ่มสลับ Sprint รายสัปดาห์ / รายเดือน', status: 'IN_PROGRESS', priority: 'URGENT', cat: 'TODAY' },
    { title: 'ทดสอบ Drag and Drop บน Weekly Sprint Board', status: 'TODO', priority: 'MEDIUM', cat: 'THIS_WEEK' },
  ];

  for (let i = 0; i < weeklyTasks.length; i++) {
    const t = weeklyTasks[i];
    await prisma.task.create({
      data: {
        sprintId: weeklySprint.id,
        projectId: mainProject.id,
        title: `[Weekly] ${t.title}`,
        status: t.status,
        priority: t.priority,
        myTaskCategory: t.cat,
        assigneeId: staffList[i % staffList.length].id,
        reporterId: sm.id,
      },
    });
  }

  // Tasks for Monthly Sprint
  const monthlyTasks = [
    { title: 'สรุปภาพรวมแผนงานประจำเดือนสิงหาคม (Monthly Milestone)', status: 'DONE', priority: 'HIGH', cat: 'DONE' },
    { title: 'ปรับปรุงประสิทธิภาพฐานข้อมูลรองรับ 20+ โครงการ', status: 'IN_PROGRESS', priority: 'URGENT', cat: 'TODAY' },
    { title: 'ประเมินความเสี่ยงและทบทวน OKRs ประจำเดือน', status: 'IN_REVIEW', priority: 'MEDIUM', cat: 'THIS_WEEK' },
  ];

  for (let i = 0; i < monthlyTasks.length; i++) {
    const t = monthlyTasks[i];
    await prisma.task.create({
      data: {
        sprintId: monthlySprint.id,
        projectId: mainProject.id,
        title: `[Monthly] ${t.title}`,
        status: t.status,
        priority: t.priority,
        myTaskCategory: t.cat,
        assigneeId: staffList[(i + 3) % staffList.length].id,
        reporterId: sm.id,
      },
    });
  }

  console.log('Seeding completed successfully with Weekly & Monthly Sprints!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
