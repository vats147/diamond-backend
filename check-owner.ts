import prisma from './src/config/db';

async function main() {
  const email = 'demo@yopmail.com';
  const slug = 'test-diamond-co';
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { business: true }
  });
  
  const businessBySlug = await prisma.business.findUnique({
    where: { slug }
  });

  console.log('User Found:', JSON.stringify(user, null, 2));
  console.log('Business by Slug Found:', JSON.stringify(businessBySlug, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
