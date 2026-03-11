import prisma from './src/config/db';

async function main() {
  const slug = 'test-diamond-co';
  const business = await prisma.business.findUnique({
    where: { slug },
    include: { users: true }
  });
  console.log('Business and its Users:', JSON.stringify(business, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
