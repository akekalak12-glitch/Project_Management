import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

declare const globalThis: {
  prismaLocal: PrismaClient | undefined;
} & typeof global;

/**
 * Get the Cloudflare D1 binding from the request context.
 * Works only when running inside @cloudflare/next-on-pages edge runtime.
 */
function getD1Binding(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext();
    return ctx?.env?.DB ?? null;
  } catch {
    return null;
  }
}

export function getPrisma(): PrismaClient {
  // On Cloudflare Pages / Workers: use D1 adapter
  const d1 = getD1Binding();
  if (d1) {
    const adapter = new PrismaD1(d1);
    // Per-request client is fine on edge (no long-lived singleton needed)
    return new PrismaClient({ adapter } as any);
  }

  // Local development: reuse a global singleton to avoid too many connections
  if (!globalThis.prismaLocal) {
    globalThis.prismaLocal = new PrismaClient({ log: ['error', 'warn'] });
  }
  return globalThis.prismaLocal;
}

// Proxy so callers can keep using `prisma.user.findMany()` etc.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const instance = getPrisma();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
