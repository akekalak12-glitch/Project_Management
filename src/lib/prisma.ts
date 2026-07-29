import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

let prismaInstance: any = null;

function getPrismaInstance(): PrismaClient {
  if (prismaInstance) return prismaInstance;

  // 1. Check if process.env.DB has the Cloudflare D1 database binding
  const d1 = (process.env as any).DB;
  if (d1) {
    try {
      const adapter = new PrismaD1(d1);
      prismaInstance = new PrismaClient({ adapter });
      return prismaInstance;
    } catch (err) {
      console.error('Failed to initialize PrismaD1 with process.env.DB:', err);
    }
  }

  // 2. Fallback to local SQLite client (development singleton running in Node.js)
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prismaInstance = globalForPrisma.prisma;
  return prismaInstance;
}

// Proxy wrapper delegates all operations dynamically to the resolved PrismaClient instance
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
