
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './src/config/prisma-extension';

const rawPrisma = new PrismaClient();
const extendedPrisma = rawPrisma.$extends(softDeleteExtension);

async function main() {
  console.log('--- DB Check Starting ---');
  
  const rawCount = await rawPrisma.business.count();
  console.log('Raw Prisma count:', rawCount);

  const extendedCount = await extendedPrisma.business.count();
  console.log('Extended Prisma count:', extendedCount);

  const rawMany = await rawPrisma.business.findMany();
  console.log('Raw findMany result count:', rawMany.length);

  const extendedMany = await extendedPrisma.business.findMany();
  console.log('Extended findMany result count:', extendedMany.length);

  if (rawMany.length > 0) {
    console.log('Sample raw item deletedAt value:', rawMany[0].deletedAt);
  }

  console.log('--- DB Check Finished ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
