import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.business.count();
    console.log(`TOTAL_BUSINESS_COUNT: ${count}`);
    
    if (count > 0) {
      const lastBusiness = await prisma.business.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      console.log('LATEST_BUSINESS_DETAILS:', JSON.stringify(lastBusiness, null, 2));
    }
  } catch (error) {
    console.error('Error counting businesses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
