const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`;
  }
  if (val instanceof Date) {
    return `'${val.toISOString()}'`;
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  return val;
}

async function dump() {
  console.log('Dumping database...');
  const sqlLines = [];

  // Helper to dump table
  async function dumpTable(modelName, tableName, columns) {
    const rows = await prisma[modelName].findMany();
    console.log(`Dumping ${tableName} (${rows.length} rows)`);
    sqlLines.push(`-- Data for ${tableName}`);
    for (const row of rows) {
      const vals = columns.map(col => escape(row[col]));
      sqlLines.push(`INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});`);
    }
    sqlLines.push('');
  }

  try {
    // Order matters to respect foreign key constraints
    await dumpTable('role', 'Role', ['id', 'key', 'title', 'permissionLevel', 'menuPermissions']);
    await dumpTable('section', 'Section', ['id', 'name', 'code', 'description']);
    await dumpTable('user', 'User', ['id', 'name', 'email', 'password', 'avatarUrl', 'roleId', 'sectionId', 'createdAt', 'updatedAt']);
    await dumpTable('project', 'Project', ['id', 'name', 'code', 'description', 'sectionId', 'ownerId', 'status', 'startDate', 'endDate', 'createdAt', 'updatedAt']);
    await dumpTable('projectMember', 'ProjectMember', ['id', 'projectId', 'userId', 'projectRole']);
    await dumpTable('oKR', 'OKR', ['id', 'objective', 'keyResult', 'targetValue', 'currentValue', 'unit', 'projectId', 'sectionId', 'progress', 'status', 'createdAt', 'updatedAt']);
    await dumpTable('sprint', 'Sprint', ['id', 'projectId', 'name', 'goal', 'startDate', 'endDate', 'isActive', 'status', 'cadence', 'createdAt', 'updatedAt']);
    await dumpTable('sprintBacklogItem', 'SprintBacklogItem', ['id', 'sprintId', 'title', 'description', 'priority', 'status', 'startDate', 'endDate', 'assigneeId', 'createdAt', 'updatedAt']);
    await dumpTable('task', 'Task', ['id', 'sprintId', 'backlogItemId', 'projectId', 'title', 'description', 'assigneeId', 'reporterId', 'status', 'priority', 'myTaskCategory', 'orderIndex', 'dueDate', 'createdAt', 'updatedAt']);
    await dumpTable('taskAssignee', 'TaskAssignee', ['taskId', 'userId']);
    await dumpTable('taskComment', 'TaskComment', ['id', 'taskId', 'userId', 'content', 'createdAt']);

    fs.writeFileSync(path.join(__dirname, 'seed.sql'), sqlLines.join('\n'));
    console.log('Dump completed successfully to prisma/seed.sql');
  } catch (error) {
    console.error('Dump failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

dump();
