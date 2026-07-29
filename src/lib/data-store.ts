import d1Seed from './d1-seed-data.json';

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

// Build relational lookup maps from exported D1 seed data
const rolesMap = new Map(d1Seed.roles.map((r: any) => [r.id, r]));
const sectionsMap = new Map(d1Seed.sections.map((s: any) => [s.id, s]));

export const SEED_SECTIONS: Section[] = d1Seed.sections as Section[];

export const SEED_ROLES: UserRole[] = d1Seed.roles as UserRole[];

export const SEED_USERS: UserProfile[] = d1Seed.users.map((u: any) => ({
  ...u,
  role: rolesMap.get(u.roleId) || { id: u.roleId, key: 'STAFF', title: 'เจ้าหน้าที่', permissionLevel: 10 },
  section: u.sectionId ? sectionsMap.get(u.sectionId) : undefined,
}));

export const SEED_PROJECTS = d1Seed.projects.map((p: any) => ({
  ...p,
  section: sectionsMap.get(p.sectionId) || { id: p.sectionId, name: 'ส่วนงาน', code: 'SEC' },
  owner: SEED_USERS.find((u) => u.id === p.ownerId) || SEED_USERS[0],
  members: [],
  sprints: [],
  _count: { tasks: 0 },
}));

export const SEED_SPRINTS = d1Seed.sprints;
export const SEED_BACKLOGS = d1Seed.backlogs;
export const SEED_TASKS = d1Seed.tasks;
