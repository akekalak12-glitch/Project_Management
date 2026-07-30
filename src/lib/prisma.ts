import { PrismaClient } from '@prisma/client';

const globalWithPrisma = globalThis as typeof globalThis & {
  prismaLocal?: PrismaClient;
};

async function createEdgePrisma(): Promise<PrismaClient> {
  // Cloudflare Pages/Workers (edge runtime): bind Prisma to the D1 database
  // for this request via the driver adapter. The edge-targeted client
  // (generated with runtime = "workerd", see prisma/schema.prisma) has no
  // native query engine and never touches Node-only APIs like fs.readdir,
  // which the default client does at init time and which Workers doesn't
  // implement — that mismatch is what caused the raw, non-JSON
  // "Internal Server Error" on every DB-backed API route in production.
  const [{ getRequestContext }, { PrismaD1 }, { PrismaClient: EdgePrismaClient }] = await Promise.all([
    import('@cloudflare/next-on-pages'),
    import('@prisma/adapter-d1'),
    import('../generated/prisma-edge/client'),
  ]);
  const ctx = getRequestContext() as unknown as { env: { DB: unknown } };
  const adapter = new PrismaD1(ctx.env.DB as never);
  return new EdgePrismaClient({ adapter } as never) as unknown as PrismaClient;
}

/**
 * Returns a PrismaClient for the current runtime.
 * - On Cloudflare's edge runtime, builds a fresh client bound to this
 *   request's D1 binding (env.DB) via @prisma/adapter-d1, using the
 *   workerd-targeted generated client (src/generated/prisma-edge).
 * - On local Node.js dev, reuses a cached singleton (default generated
 *   client) against the local SQLite file (prisma/dev.db).
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
