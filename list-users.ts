import prisma from './src/config/db';

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { email: true, role: true, businessId: true, isActive: true }
  });
  console.log('Recent Users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
