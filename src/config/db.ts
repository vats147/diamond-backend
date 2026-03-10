import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './prisma-extension';

const prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const prisma = prismaClient.$extends(softDeleteExtension(prismaClient));

export default prisma;
