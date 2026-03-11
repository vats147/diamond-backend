import prisma from './src/config/db';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@diamond.com' } });
  console.log('User:', user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
