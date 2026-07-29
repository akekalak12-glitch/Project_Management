import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getPrisma(): PrismaClient {
  try {
    const ctx = getRequestContext();
    if (ctx && ctx.env && ctx.env.DB) {
      const adapter = new PrismaD1(ctx.env.DB);
      return new PrismaClient({ adapter } as any);
    }
  } catch (e) {
    // Cloudflare Workers request context not active or binding unavailable
  }

  try {
    const globalWithPrisma = globalThis as typeof globalThis & {
      prismaLocal?: PrismaClient;
    };
    if (!globalWithPrisma.prismaLocal) {
      globalWithPrisma.prismaLocal = new PrismaClient();
    }
    return globalWithPrisma.prismaLocal;
  } catch (e) {
    return {} as PrismaClient;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const instance = getPrisma();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
