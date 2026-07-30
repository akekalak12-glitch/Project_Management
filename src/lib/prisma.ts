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
 * - On local Node.js dev without Cloudflare bindings available, falls
 *   back to a cached singleton against the local SQLite file
 *   (prisma/dev.db).
 */
export async function getPrisma(): Promise<PrismaClient> {
  try {
    const { env } = getCloudflareContext();
    if (env && (env as unknown as { DB?: unknown }).DB) {
      const adapter = new PrismaD1((env as unknown as { DB: never }).DB);
      return new PrismaClient({ adapter });
    }
  } catch {
    // getCloudflareContext() throws when there's no active Cloudflare
    // context (e.g. plain `next dev` without initOpenNextCloudflareForDev
    // bindings) — fall through to the local singleton below.
  }

  if (!globalWithPrisma.prismaLocal) {
    globalWithPrisma.prismaLocal = new PrismaClient();
  }
  return globalWithPrisma.prismaLocal;
}
