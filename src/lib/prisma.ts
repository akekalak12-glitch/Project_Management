import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
// Static import works in both Node.js and Edge runtimes;
// getRequestContext() itself only works inside a Cloudflare Workers request.
import { getRequestContext } from '@cloudflare/next-on-pages';

declare const globalThis: {
  prismaLocal: PrismaClient | undefined;
} & typeof global;

/**
 * Returns the Cloudflare D1 binding from the current Workers request context,
 * or null when running outside of a Cloudflare environment (local dev).
 */
function getD1Binding(): any {
  try {
    const ctx = getRequestContext();
    return ctx?.env?.DB ?? null;
  } catch {
    // Not in a Cloudflare Workers request context (e.g., local Next.js dev)
    return null;
  }
}

export function getPrisma(): PrismaClient {
  const d1 = getD1Binding();

  if (d1) {
    // Production: Cloudflare D1 via PrismaD1 adapter
    const adapter = new PrismaD1(d1);
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
