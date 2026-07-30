import { PrismaClient } from '@prisma/client';

const globalWithPrisma = globalThis as typeof globalThis & {
  prismaLocal?: PrismaClient;
};

export const prisma = globalWithPrisma.prismaLocal || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prismaLocal = prisma;
}
