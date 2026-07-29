import { SEED_USERS, SEED_SECTIONS, SEED_ROLES, SEED_PROJECTS, SEED_SPRINTS, SEED_BACKLOGS, SEED_TASKS } from './data-store';

const STORAGE_KEYS = {
  USERS: 'pm_local_users_v1',
  SECTIONS: 'pm_local_sections_v1',
  PROJECTS: 'pm_local_projects_v1',
  SPRINTS: 'pm_local_sprints_v1',
  BACKLOGS: 'pm_local_backlogs_v1',
  TASKS: 'pm_local_tasks_v1',
};

// Helper for browser local storage persistence
export const LocalStorageManager = {
  getUsers: () => {
    if (typeof window === 'undefined') return SEED_USERS;
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : SEED_USERS;
  },
  setUsers: (users: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  getSections: () => {
    if (typeof window === 'undefined') return SEED_SECTIONS;
    const saved = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    return saved ? JSON.parse(saved) : SEED_SECTIONS;
  },
  setSections: (sections: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    }
  },

  getProjects: () => {
    if (typeof window === 'undefined') return SEED_PROJECTS;
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return saved ? JSON.parse(saved) : SEED_PROJECTS;
  },
  setProjects: (projects: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }
  },

  getSprints: () => {
    if (typeof window === 'undefined') return SEED_SPRINTS;
    const saved = localStorage.getItem(STORAGE_KEYS.SPRINTS);
    return saved ? JSON.parse(saved) : SEED_SPRINTS;
  },
  setSprints: (sprints: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
    }
  },

  getBacklogs: () => {
    if (typeof window === 'undefined') return SEED_BACKLOGS;
    const saved = localStorage.getItem(STORAGE_KEYS.BACKLOGS);
    return saved ? JSON.parse(saved) : SEED_BACKLOGS;
  },
  setBacklogs: (backlogs: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BACKLOGS, JSON.stringify(backlogs));
    }
  },

  getTasks: () => {
    if (typeof window === 'undefined') return SEED_TASKS;
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    return saved ? JSON.parse(saved) : SEED_TASKS;
  },
  setTasks: (tasks: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  },

  resetAll: () => {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    }
  },
};
