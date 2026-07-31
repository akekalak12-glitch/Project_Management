import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const globalWithPrisma = globalThis as typeof globalThis & {
  prismaLocal?: PrismaClient;
};

/**
 * Returns a PrismaClient for the current runtime.
 * - On Cloudflare Workers (via @opennextjs/cloudflare), creates a fresh
 *   client per request bound to the D1 database through the driver
 *   adapter (per OpenNext's guidance: don't reuse a client across
 *   requests, since D1 access is request-scoped).
 * - On local Node.js dev (`next dev`), always falls back to a cached
 *   singleton against the local SQLite file (prisma/dev.db) instead of
 *   attempting the D1 driver adapter. Miniflare's local D1 emulation
 *   (used by initOpenNextCloudflareForDev()) has a known incompatibility
 *   with @prisma/adapter-d1 that crashes the query engine ("Object
 *   property 'transactionContext' type mismatch... Undefined"), so we
 *   only use the real D1 adapter in the actual deployed Workers runtime
 *   (NODE_ENV === 'production'), where it's confirmed to work correctly.
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (process.env.NODE_ENV === 'production') {
    try {
      const { env } = getCloudflareContext();
      if (env && (env as unknown as { DB?: unknown }).DB) {
        const adapter = new PrismaD1((env as unknown as { DB: never }).DB);
        return new PrismaClient({ adapter });
      }
    } catch {
      // getCloudflareContext() throws when there's no active Cloudflare
      // context — fall through to the local singleton below.
    }
  }

  if (!globalWithPrisma.prismaLocal) {
    globalWithPrisma.prismaLocal = new PrismaClient();
  }
  return globalWithPrisma.prismaLocal;
}
