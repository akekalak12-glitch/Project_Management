import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

let globalPrisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (globalPrisma) return globalPrisma;

  let dbBinding: any = null;
  try {
    const ctx = getRequestContext();
    if (ctx && ctx.env && ctx.env.DB) {
      dbBinding = ctx.env.DB;
    }
  } catch (e) {
    // Request context unavailable or in Node.js environment
  }

  if (dbBinding) {
    const adapter = new PrismaD1(dbBinding);
    globalPrisma = new PrismaClient({ adapter } as any);
    return globalPrisma;
  }

  // Fallback for local development using SQLite
  const globalWithPrisma = globalThis as typeof globalThis & {
    prismaLocal?: PrismaClient;
  };
  if (!globalWithPrisma.prismaLocal) {
    globalWithPrisma.prismaLocal = new PrismaClient();
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
