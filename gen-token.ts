
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'your_super_secret_key_here_min_32_chars'; // From .env

async function main() {
  const email = 'admin@example.com';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log('Creating admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SUPER_ADMIN' as any,
      }
    });
  }

  const payload = { sub: user.id, role: user.role, iss: 'diamond-market-api', aud: 'diamond-market-client' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  console.log('Admin Token:', token);
}

main().catch(console.error).finally(() => prisma.$disconnect());
