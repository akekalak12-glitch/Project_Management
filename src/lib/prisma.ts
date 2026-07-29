// Edge runtime version — Cloudflare Workers + D1 ONLY
// This file must NOT import any Node.js-specific code.
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getPrisma(): PrismaClient {
  const { env } = getRequestContext();
  if (!env.DB) throw new Error('D1 binding "DB" not available');
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter } as any);
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const instance = getPrisma();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
