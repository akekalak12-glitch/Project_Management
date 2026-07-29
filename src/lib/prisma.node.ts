// Local Node.js development version — SQLite via Prisma
// This file is swapped in by webpack alias for non-edge (local dev) builds.
import { PrismaClient } from '@prisma/client';

declare const globalThis: { prismaLocal: PrismaClient | undefined } & typeof global;

if (!globalThis.prismaLocal) {
  globalThis.prismaLocal = new PrismaClient({ log: ['error', 'warn'] });
}

export const prisma = globalThis.prismaLocal;
export function getPrisma() { return globalThis.prismaLocal!; }
