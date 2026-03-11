import bcrypt from 'bcrypt';
import prisma from './src/config/db';

async function main() {
  const password = 'Demo@123';
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Reset demo@yopmail.com
  await prisma.user.update({
    where: { email: 'demo@yopmail.com' },
    data: { passwordHash }
  });
  console.log('Password reset for demo@yopmail.com');

  // Reset testowner@diamond.com
  await prisma.user.update({
    where: { email: 'testowner@diamond.com' },
    data: { passwordHash }
  });
  console.log('Password reset for testowner@diamond.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
