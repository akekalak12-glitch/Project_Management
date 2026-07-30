export interface UserRole {
  id: string;
  key: 'SUPER_ADMIN' | 'ADVISOR' | 'PROJECT_OWNER' | 'SCRUM_MASTER' | 'STAFF';
  title: string;
  permissionLevel: number;
  menuPermissions?: string;
}

export interface Section {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  roleId: string;
  role: UserRole;
  sectionId?: string;
  section?: Section;
}

export const SEED_ROLES: UserRole[] = [
  { id: '227edd5c-4bd0-4d2c-b804-82f04fda667f', key: 'SUPER_ADMIN', title: 'ผู้อำนวยการกอง', permissionLevel: 100 },
  { id: '3b18d23b-06c4-4bad-87d7-599e49146a89', key: 'ADVISOR', title: 'ผู้เชี่ยวชาญ', permissionLevel: 90 },
  { id: '3e5286ff-6c56-4a40-af31-5a29ccf3b98e', key: 'PROJECT_OWNER', title: 'ผู้อำนวยการส่วน', permissionLevel: 70 },
  { id: '1f7d4b43-4ccf-4126-a661-e5e6331121aa', key: 'SCRUM_MASTER', title: 'หัวหน้างาน / SM', permissionLevel: 50 },
  { id: '732ce5ba-a573-4dd4-9543-a8989554c69a', key: 'STAFF', title: 'เจ้าหน้าที่', permissionLevel: 10 },
];

export const SEED_SECTIONS: Section[] = [
  { id: '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22', name: 'ส่วนจัดการฐานข้อมูล', code: 'จฐ', description: 'บริหารจัดการฐานข้อมูล' },
  { id: 'b9ae7cbd-e2b1-436a-86d8-8656716ef176', name: 'ส่วนเลขานุการคณะกรรมการประเมินราคาทรัพย์สินเพื่อประโยชน์แห่งรัฐ', code: 'ลป', description: 'งานเลขานุการและประเมินราคาทรัพย์สิน' },
  { id: 'f01452e1-e9c9-4454-be82-28771e9f37d4', name: 'ส่วนวิจัยและพัฒนามาตรฐานการประเมินราคาทรัพย์สิน', code: 'วป', description: 'งานวิจัยและพัฒนามาตรฐาน' },
  { id: 'b053e534-2b22-475f-81f8-f2da5e575e30', name: 'ศูนย์บริหารจัดการราคาประเมินทรัพย์สินแห่งชาติ', code: 'ศป', description: 'บริหารจัดการราคาประเมินแห่งชาติ' },
  { id: 'e22d3585-fee2-4db2-954c-a3505d5436b8', name: 'ฝ่ายบริหารงานทั่วไป', code: 'บป', description: 'งานสารบรรณและบริหารงานทั่วไป' },
];

// Generate 60 users with proper names, roles, and sections
export const SEED_USERS: UserProfile[] = Array.from({ length: 60 }).map((_, i) => {
  if (i === 0) {
    return {
      id: '8b1f19e0-959c-4c6f-9f4e-fcc4ee8466d4',
      name: 'นายเอกลักษณ์ เฉลิมชีพ',
      email: 'akekalakch@treasury.go.th',
      password: '123456',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
      roleId: '227edd5c-4bd0-4d2c-b804-82f04fda667f',
      role: SEED_ROLES[0],
      sectionId: '87eddf4e-7d77-4caf-acc5-9e4e1e2d5f22',
      section: SEED_SECTIONS[0],
    };
  }
  const sec = SEED_SECTIONS[i % SEED_SECTIONS.length];
  const role = SEED_ROLES[(i % (SEED_ROLES.length - 1)) + 1];
  return {
    id: `user-gen-${i}`,
    name: `เจ้าหน้าที่ ${sec.name} ท่านที่ ${i}`,
    email: `staff.${i}@treasury.go.th`,
    password: '123456',
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`,
    roleId: role.id,
    role,
    sectionId: sec.id,
    section: sec,
  };
});

export const SEED_PROJECTS = [
  {
    id: 'prj-01',
    name: 'ระบบบริหารจัดการฐานข้อมูลราคาทรัพย์สินดิจิทัล',
    code: 'PRJ-DATA-01',
    description: 'โครงการพัฒนาระบบบริหารจัดการและรวบรวมฐานข้อมูลราคาประเมินทรัพย์สินดิจิทัล',
    sectionId: SEED_SECTIONS[0].id,
    section: SEED_SECTIONS[0],
    ownerId: SEED_USERS[0].id,
    owner: SEED_USERS[0],
    status: 'IN_PROGRESS',
    members: [],
    sprints: [],
    _count: { tasks: 3 },
  },
  {
    id: 'prj-02',
    name: 'ระบบสารสนเทศส่วนเลขานุการประเมินราคาแห่งรัฐ',
    code: 'PRJ-SEC-02',
    description: 'โครงการระบบสารสนเทศสนับสนุนคณะกรรมการประเมินราคาทรัพย์สินเพื่อประโยชน์แห่งรัฐ',
    sectionId: SEED_SECTIONS[1].id,
    section: SEED_SECTIONS[1],
    ownerId: SEED_USERS[1]?.id || SEED_USERS[0].id,
    owner: SEED_USERS[1] || SEED_USERS[0],
    status: 'IN_PROGRESS',
    members: [],
    sprints: [],
    _count: { tasks: 3 },
  },
  {
    id: 'prj-03',
    name: 'ระบบวิจัยโมเดลประเมินราคาที่ดินอัตโนมัติ (AI Valuation)',
    code: 'PRJ-AI-03',
    description: 'โครงการวิจัยและพัฒนามาตรฐานประเมินราคาทรัพย์สินด้วยปัญญาประดิษฐ์',
    sectionId: SEED_SECTIONS[2].id,
    section: SEED_SECTIONS[2],
    ownerId: SEED_USERS[2]?.id || SEED_USERS[0].id,
    owner: SEED_USERS[2] || SEED_USERS[0],
    status: 'PLANNING',
    members: [],
    sprints: [],
    _count: { tasks: 3 },
  },
  {
    id: 'prj-04',
    name: 'ระบบศูนย์กลางให้บริการราคาประเมินทรัพย์สินแห่งชาติ (Portal)',
    code: 'PRJ-PORTAL-04',
    description: 'พัฒนา Web Portal บริการประชาชนและหน่วยงานภาครัฐสำหรับค้นหาราคาประเมิน',
    sectionId: SEED_SECTIONS[3].id,
    section: SEED_SECTIONS[3],
    ownerId: SEED_USERS[3]?.id || SEED_USERS[0].id,
    owner: SEED_USERS[3] || SEED_USERS[0],
    status: 'IN_PROGRESS',
    members: [],
    sprints: [],
    _count: { tasks: 3 },
  },
  {
    id: 'prj-05',
    name: 'โครงการยกระดับงานสารบรรณอิเล็กทรอนิกส์และฝ่ายบริหารทั่วไป',
    code: 'PRJ-ADMIN-05',
    description: 'โครงการปรับปรุงและพัฒนาระบบเอกสารอิเล็กทรอนิกส์ภายในฝ่ายบริหารงานทั่วไป',
    sectionId: SEED_SECTIONS[4].id,
    section: SEED_SECTIONS[4],
    ownerId: SEED_USERS[4]?.id || SEED_USERS[0].id,
    owner: SEED_USERS[4] || SEED_USERS[0],
    status: 'COMPLETED',
    members: [],
    sprints: [],
    _count: { tasks: 3 },
  },
];

export const SEED_SPRINTS = [
  // Project 1
  {
    id: 'sprint-01-w',
    name: 'Sprint 31 (รายสัปดาห์) - W1 ส.ค. 2026',
    goal: 'ออกแบบโครงสร้างและฐานข้อมูลระบบประเมินราคา',
    cadence: 'WEEKLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    status: 'ACTIVE',
    projectId: 'prj-01',
    project: SEED_PROJECTS[0],
    backlogItems: [],
  },
  {
    id: 'sprint-01-m',
    name: 'Sprint Q3/August (รายเดือน) - ส.ค. 2026',
    goal: 'เป้าหมายใหญ่ประจำเดือน: พัฒนา Portal และ API ดึงข้อมูล',
    cadence: 'MONTHLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    projectId: 'prj-01',
    project: SEED_PROJECTS[0],
    backlogItems: [],
  },

  // Project 2
  {
    id: 'sprint-02-w',
    name: 'Sprint 31 (รายสัปดาห์) - งานวาระประชุมคณะกรรมการ',
    goal: 'พัฒนาระบบวาระประชุมและการลงมติออนไลน์',
    cadence: 'WEEKLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    status: 'ACTIVE',
    projectId: 'prj-02',
    project: SEED_PROJECTS[1],
    backlogItems: [],
  },
  {
    id: 'sprint-02-m',
    name: 'Sprint Q3/August (รายเดือน) - ระบบงานสารสนเทศ',
    goal: 'ปรับปรุงกระบวนการจัดเก็บรายงานคณะกรรมการแห่งรัฐ',
    cadence: 'MONTHLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    projectId: 'prj-02',
    project: SEED_PROJECTS[1],
    backlogItems: [],
  },

  // Project 3
  {
    id: 'sprint-03-w',
    name: 'Sprint 31 (รายสัปดาห์) - AI Valuation Model Training',
    goal: 'ทดสอบอัลกอริทึมประเมินราคาทรัพย์สินด้วย Machine Learning',
    cadence: 'WEEKLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    status: 'ACTIVE',
    projectId: 'prj-03',
    project: SEED_PROJECTS[2],
    backlogItems: [],
  },
  {
    id: 'sprint-03-m',
    name: 'Sprint Q3/August (รายเดือน) - AI Model Fine-tuning',
    goal: 'ปรับแต่งและทดสอบความแม่นยำโมเดลประเมินราคา',
    cadence: 'MONTHLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    projectId: 'prj-03',
    project: SEED_PROJECTS[2],
    backlogItems: [],
  },

  // Project 4
  {
    id: 'sprint-04-w',
    name: 'Sprint 31 (รายสัปดาห์) - Public Portal UI/UX',
    goal: 'เปิดใช้งานส่วนค้นหาและออกรายงานราคาประเมิน',
    cadence: 'WEEKLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    status: 'ACTIVE',
    projectId: 'prj-04',
    project: SEED_PROJECTS[3],
    backlogItems: [],
  },
  {
    id: 'sprint-04-m',
    name: 'Sprint Q3/August (รายเดือน) - GIS Integration',
    goal: 'เชื่อมโยงข้อมูลผังเมืองและราคาประเมินผ่าน GIS',
    cadence: 'MONTHLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    projectId: 'prj-04',
    project: SEED_PROJECTS[3],
    backlogItems: [],
  },

  // Project 5
  {
    id: 'sprint-05-w',
    name: 'Sprint 31 (รายสัปดาห์) - E-Document Standardizing',
    goal: 'ยกระดับระบบเอกสารอิเล็กทรอนิกส์ลายมือชื่อดิจิทัล',
    cadence: 'WEEKLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    status: 'ACTIVE',
    projectId: 'prj-05',
    project: SEED_PROJECTS[4],
    backlogItems: [],
  },
  {
    id: 'sprint-05-m',
    name: 'Sprint Q3/August (รายเดือน) - E-Document Full Rollout',
    goal: 'เปิดใช้งานระบบสารบรรณอิเล็กทรอนิกส์เต็มรูปแบบ',
    cadence: 'MONTHLY' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    projectId: 'prj-05',
    project: SEED_PROJECTS[4],
    backlogItems: [],
  },
];

export const SEED_BACKLOGS = [
  // Project 1 Backlogs
  {
    id: 'backlog-01-1',
    sprintId: 'sprint-01-w',
    title: 'ออกแบบ ER-Diagram ฐานข้อมูลราคาทรัพย์สินดิจิทัล',
    description: 'รวบรวมฟิลด์และออกแบบความสัมพันธ์ระหว่างตาราง',
    priority: 'HIGH',
    status: 'SUCCESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-01-2',
    sprintId: 'sprint-01-w',
    title: 'พัฒนา RESTful API สำหรับดึงข้อมูลแปลงที่ดินและราคาประเมิน',
    description: 'สร้าง API สำหรับดึงข้อมูลแปลงที่ดินด้วยความเร็วสูง',
    priority: 'HIGH',
    status: 'IN_PROGRESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-01-3',
    sprintId: 'sprint-01-m',
    title: 'ปรับปรุงโครงสร้างสถาปัตยกรรมคลาวด์และกระจายโหลด',
    description: 'เพิ่มประสิทธิภาพ Load Balancer รองรับผู้ใช้ 10,000 คนพร้อมกัน',
    priority: 'HIGH',
    status: 'PLANNED' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  },

  // Project 2 Backlogs
  {
    id: 'backlog-02-1',
    sprintId: 'sprint-02-w',
    title: 'ออกแบบหน้าจอระเบียบวาระการประชุมคณะกรรมการแห่งรัฐ',
    description: 'สร้าง UI สำหรับจัดระเบียบวาระประชุม',
    priority: 'HIGH',
    status: 'SUCCESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-02-2',
    sprintId: 'sprint-02-w',
    title: 'พัฒนาระบบบันทึกมติคณะกรรมการและส่งต่อการปฏิบัติงาน',
    description: 'บันทึกมติการประชุมอิเล็กทรอนิกส์',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-02-3',
    sprintId: 'sprint-02-m',
    title: 'จัดทำระบบคลังเอกสารและรายงานการประชุมย้อนหลัง',
    description: 'ระบบค้นหาและดาวน์โหลดเอกสารการประชุม',
    priority: 'MEDIUM',
    status: 'PLANNED' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  },

  // Project 3 Backlogs
  {
    id: 'backlog-03-1',
    sprintId: 'sprint-03-w',
    title: 'รวบรวม Dataset ราคาซื้อขายทรัพย์สินย้อนหลัง 5 ปี',
    description: 'จัดทำ Cleaned Data สำหรับ Train Model AI',
    priority: 'HIGH',
    status: 'SUCCESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-03-2',
    sprintId: 'sprint-03-w',
    title: 'ทดสอบความแม่นยำโมเดลประเมินราคาที่ดินรายแปลง (Regression Model)',
    description: 'คำนวณค่า R2 Score และ Mean Absolute Error',
    priority: 'HIGH',
    status: 'IN_PROGRESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-03-3',
    sprintId: 'sprint-03-m',
    title: 'ปรับแต่ง Hyperparameters และสอบทานผลประเมิน AI',
    description: 'เทียบผลประเมิน AI กับราคาประเมินจริง',
    priority: 'HIGH',
    status: 'PLANNED' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  },

  // Project 4 Backlogs
  {
    id: 'backlog-04-1',
    sprintId: 'sprint-04-w',
    title: 'พัฒนาฟังก์ชั่นค้นหาราคาประเมินตามเลขที่โฉนดและพิกัด GIS',
    description: 'เชื่อมต่อแผนที่ GIS แสดงตำแหน่งแปลงที่ดิน',
    priority: 'HIGH',
    status: 'SUCCESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-04-2',
    sprintId: 'sprint-04-w',
    title: 'จัดทำ PDF Export รายงานหนังสือรับรองราคาประเมินทางการ',
    description: 'ออกหนังสือรับรองราคาประเมินอิเล็กทรอนิกส์',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-04-3',
    sprintId: 'sprint-04-m',
    title: 'เชื่อมต่อ Payment Gateway รองรับการชำระค่าธรรมเนียมออนไลน์',
    description: 'ระบบรับชำระเงินค่าธรรมเนียมประเมินราคา',
    priority: 'HIGH',
    status: 'PLANNED' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  },

  // Project 5 Backlogs
  {
    id: 'backlog-05-1',
    sprintId: 'sprint-05-w',
    title: 'เชื่อมต่อระบบ Digital Signature ลายมือชื่ออิเล็กทรอนิกส์',
    description: 'ตรวจสอบมาตรฐานรองรับ PKI',
    priority: 'HIGH',
    status: 'SUCCESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-05-2',
    sprintId: 'sprint-05-w',
    title: 'พัฒนาระบบรับส่งและติดตามสถานะหนังสือสารบรรณภายใน',
    description: 'ติดตามสถานะหนังสือราชการ',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  },
  {
    id: 'backlog-05-3',
    sprintId: 'sprint-05-m',
    title: 'อบรมเจ้าหน้าที่และเปิดใช้งานระบบสารบรรณอิเล็กทรอนิกส์',
    description: 'จัดอบรมบุคลากรทั้งองค์กร',
    priority: 'MEDIUM',
    status: 'PLANNED' as const,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  },
];

export const SEED_TASKS = [
  // Project 1 Tasks
  {
    id: 'task-01-1',
    title: 'สอบทาน Schema ตาราง User และ Section ฐานข้อมูล',
    description: 'ตรวจสอบความถูกต้องของ Foreign Keys และ Indexing',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-01',
    sprintId: 'sprint-01-w',
    backlogItemId: 'backlog-01-1',
    assigneeId: SEED_USERS[0].id,
    assignee: SEED_USERS[0],
  },
  {
    id: 'task-01-2',
    title: 'พัฒนา REST API Controller สำหรับดึงราคาแปลงที่ดิน',
    description: 'เขียน Endpoint /api/land-valuation',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-01',
    sprintId: 'sprint-01-w',
    backlogItemId: 'backlog-01-2',
    assigneeId: SEED_USERS[1].id,
    assignee: SEED_USERS[1],
  },
  {
    id: 'task-01-3',
    title: 'วางสถาปัตยกรรม Load Balancer บน Hybrid Cloud',
    description: 'ตั้งค่า Auto Scaling และ Nginx Proxy',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    projectId: 'prj-01',
    sprintId: 'sprint-01-m',
    backlogItemId: 'backlog-01-3',
    assigneeId: SEED_USERS[2].id,
    assignee: SEED_USERS[2],
  },

  // Project 2 Tasks
  {
    id: 'task-02-1',
    title: 'ออกแบบ UI Layout หน้าจัดระเบียบวาระประชุม',
    description: 'ทำ Mockup หน้าจอการเพิ่มวาระประชุม',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-02',
    sprintId: 'sprint-02-w',
    backlogItemId: 'backlog-02-1',
    assigneeId: SEED_USERS[3].id,
    assignee: SEED_USERS[3],
  },
  {
    id: 'task-02-2',
    title: 'เขียน Logic สรุปมติและส่ง Email แจ้งเตือนมติประชุม',
    description: 'ส่งแจ้งเตือนมติกรรมการให้ผู้เกี่ยวข้อง',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    projectId: 'prj-02',
    sprintId: 'sprint-02-w',
    backlogItemId: 'backlog-02-2',
    assigneeId: SEED_USERS[4].id,
    assignee: SEED_USERS[4],
  },
  {
    id: 'task-02-3',
    title: 'สร้าง Search Index สำหรับค้นหารายงานการประชุมย้อนหลัง',
    description: 'ทำ Full-text search บนรายงานการประชุม',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    projectId: 'prj-02',
    sprintId: 'sprint-02-m',
    backlogItemId: 'backlog-02-3',
    assigneeId: SEED_USERS[5].id,
    assignee: SEED_USERS[5],
  },

  // Project 3 Tasks
  {
    id: 'task-03-1',
    title: 'Clean ข้อมูลราคาซื้อขายที่ดินและเติมค่าที่ขาดหาย',
    description: 'ทำ Data Cleansing ด้วย Python Pandas',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-03',
    sprintId: 'sprint-03-w',
    backlogItemId: 'backlog-03-1',
    assigneeId: SEED_USERS[6].id,
    assignee: SEED_USERS[6],
  },
  {
    id: 'task-03-2',
    title: 'เขียนสคริปต์ Train Model Random Forest สำหรับราคาประเมิน',
    description: 'ใช้ Scikit-learn ทำ Model Training',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-03',
    sprintId: 'sprint-03-w',
    backlogItemId: 'backlog-03-2',
    assigneeId: SEED_USERS[7].id,
    assignee: SEED_USERS[7],
  },
  {
    id: 'task-03-3',
    title: 'ทำ Validation Test เปรียบเทียบผลประเมิน AI กับราคาตลาด',
    description: 'ประเมินค่า Error Metrics',
    status: 'IN_REVIEW' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-03',
    sprintId: 'sprint-03-m',
    backlogItemId: 'backlog-03-3',
    assigneeId: SEED_USERS[8].id,
    assignee: SEED_USERS[8],
  },

  // Project 4 Tasks
  {
    id: 'task-04-1',
    title: 'เชื่อมต่อ Map Component กับ GIS API แสดงขอบเขตที่ดิน',
    description: 'ใช้ Leaflet/Mapbox แสดง Layer โฉนดที่ดิน',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-04',
    sprintId: 'sprint-04-w',
    backlogItemId: 'backlog-04-1',
    assigneeId: SEED_USERS[9].id,
    assignee: SEED_USERS[9],
  },
  {
    id: 'task-04-2',
    title: 'สร้าง PDF Template สำหรับหนังสือรับรองราคาประเมิน',
    description: 'จัด Layout PDF พร้อมตราครุฑและ QR Code',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    projectId: 'prj-04',
    sprintId: 'sprint-04-w',
    backlogItemId: 'backlog-04-2',
    assigneeId: SEED_USERS[10].id,
    assignee: SEED_USERS[10],
  },
  {
    id: 'task-04-3',
    title: 'ทดสอบระบบรับชำระเงิน PromptPay และบัตรเครดิต',
    description: 'ทดสอบ Sandbox Payment Gateway',
    status: 'TODO' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-04',
    sprintId: 'sprint-04-m',
    backlogItemId: 'backlog-04-3',
    assigneeId: SEED_USERS[11].id,
    assignee: SEED_USERS[11],
  },

  // Project 5 Tasks
  {
    id: 'task-05-1',
    title: 'ทดสอบความถูกต้องของใบรับรองอิเล็กทรอนิกส์ Root CA',
    description: 'ตรวจสอบความปลอดภัย Digital Certificate',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-05',
    sprintId: 'sprint-05-w',
    backlogItemId: 'backlog-05-1',
    assigneeId: SEED_USERS[12].id,
    assignee: SEED_USERS[12],
  },
  {
    id: 'task-05-2',
    title: 'พัฒนาระบบรับส่งและออกเลขหนังสือราชการอัตโนมัติ',
    description: 'ออกเลขรหัสหนังสือสารบรรณ',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    projectId: 'prj-05',
    sprintId: 'sprint-05-w',
    backlogItemId: 'backlog-05-2',
    assigneeId: SEED_USERS[13].id,
    assignee: SEED_USERS[13],
  },
  {
    id: 'task-05-3',
    title: 'จัดทำสื่อการสอนและสไลด์คู่มือการใช้งานระบบสารบรรณ',
    description: 'คู่มือสำหรับเจ้าหน้าที่ปฏิบัติงาน',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    projectId: 'prj-05',
    sprintId: 'sprint-05-m',
    backlogItemId: 'backlog-05-3',
    assigneeId: SEED_USERS[14].id,
    assignee: SEED_USERS[14],
  },
];
