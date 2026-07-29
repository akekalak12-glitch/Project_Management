import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  try {
    const ctx = getRequestContext();
    if (ctx?.env?.DB) {
      if (!prismaInstance) {
        const adapter = new PrismaD1(ctx.env.DB);
        prismaInstance = new PrismaClient({ adapter } as any);
      }
      return prismaInstance;
    }
  } catch (e) {
    // Fallback when outside request context or local dev
  }

  // Local SQLite fallback
  const globalWithPrisma = globalThis as typeof globalThis & {
    prismaLocal?: PrismaClient;
  };
  if (!globalWithPrisma.prismaLocal) {
    globalWithPrisma.prismaLocal = new PrismaClient({ log: ['error', 'warn'] });
  }
  return globalWithPrisma.prismaLocal;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const instance = getPrisma();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
