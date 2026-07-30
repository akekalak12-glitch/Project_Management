import { PrismaClient } from '@prisma/client';

const globalWithPrisma = globalThis as typeof globalThis & {
  prismaLocal?: PrismaClient;
};

async function createEdgePrisma(): Promise<PrismaClient> {
  // Cloudflare Pages/Workers (edge runtime): bind Prisma to the D1 database
  // for this request via the driver adapter. A plain `new PrismaClient()`
  // cannot initialize under the edge runtime without Driver Adapters or
  // Accelerate configured, so this path is required for production.
  const [{ getRequestContext }, { PrismaD1 }] = await Promise.all([
    import('@cloudflare/next-on-pages'),
    import('@prisma/adapter-d1'),
  ]);
  const ctx = getRequestContext() as unknown as { env: { DB: unknown } };
  const adapter = new PrismaD1(ctx.env.DB as never);
  return new PrismaClient({ adapter } as never);
}

/**
 * Returns a PrismaClient for the current runtime.
 * - On Cloudflare's edge runtime, builds a fresh client bound to this
 *   request's D1 binding (env.DB) via @prisma/adapter-d1.
 * - On local Node.js dev, reuses a cached singleton against the local
 *   SQLite file (prisma/dev.db).
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return createEdgePrisma();
  }
  if (!globalWithPrisma.prismaLocal) {
    globalWithPrisma.prismaLocal = new PrismaClient();
  }
  return globalWithPrisma.prismaLocal;
}
