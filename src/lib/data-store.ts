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

const rolesMap = new Map(SEED_ROLES.map((r) => [r.id, r]));
const sectionsMap = new Map(SEED_SECTIONS.map((s) => [s.id, s]));

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
    _count: { tasks: 5 },
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
    _count: { tasks: 2 },
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
    _count: { tasks: 4 },
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
    _count: { tasks: 1 },
  },
];

export const SEED_SPRINTS = [
  {
    id: 'sprint-01',
    name: 'Sprint 1: ออกแบบโครงสร้างและฐานข้อมูล',
    goal: 'ออกแบบและติดตั้งระบบฐานข้อมูลรองรับงานประเมินราคา',
    cadence: 'WEEKLY' as const,
    startDate: '2026-07-01',
    endDate: '2026-07-28',
    status: 'ACTIVE',
    projectId: 'prj-01',
    project: SEED_PROJECTS[0],
    backlogItems: [],
  },
  {
    id: 'sprint-02',
    name: 'Sprint 2: พัฒนาระบบค้นหาและรายงานผล',
    goal: 'เปิดใช้งานส่วนค้นหาและออกรายงานราคาประเมิน',
    cadence: 'MONTHLY' as const,
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    projectId: 'prj-04',
    project: SEED_PROJECTS[3],
    backlogItems: [],
  },
];

export const SEED_BACKLOGS = [
  {
    id: 'backlog-01',
    sprintId: 'sprint-01',
    title: 'ออกแบบ ER-Diagram ฐานข้อมูลราคาทรัพย์สิน',
    description: 'รวบรวมฟิลด์และออกแบบความสัมพันธ์ระหว่างตาราง',
    priority: 'HIGH',
    status: 'SUCCESS' as const,
    startDate: '2026-07-01',
    endDate: '2026-07-07',
  },
  {
    id: 'backlog-02',
    sprintId: 'sprint-01',
    title: 'พัฒนา API สำหรับดึงข้อมูลแปลงที่ดินและราคาประเมิน',
    description: 'สร้าง RESTful API ดึงข้อมูลความเร็วสูง',
    priority: 'HIGH',
    status: 'IN_PROGRESS' as const,
    startDate: '2026-07-08',
    endDate: '2026-07-21',
  },
];

export const SEED_TASKS = [
  {
    id: 'task-01',
    title: 'สอบทาน Schema ตาราง User และ Section',
    description: 'ตรวจสอบความถูกต้องของ Foreign Keys',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    projectId: 'prj-01',
    sprintId: 'sprint-01',
    backlogItemId: 'backlog-01',
    assigneeId: SEED_USERS[0].id,
    assignee: SEED_USERS[0],
  },
  {
    id: 'task-02',
    title: 'ทดสอบประสิทธิภาพการ Query บน Cloudflare D1',
    description: 'ทดสอบ Query ความเร็วและ Indexing',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    projectId: 'prj-01',
    sprintId: 'sprint-01',
    backlogItemId: 'backlog-02',
    assigneeId: SEED_USERS[0].id,
    assignee: SEED_USERS[0],
  },
];
