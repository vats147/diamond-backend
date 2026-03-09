import bcrypt from 'bcrypt';
import prisma from './config/db';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Run once to seed the initial Super Admin account.
 * Usage: npx ts-node src/seed.ts
 */
const seed = async () => {
    const email = process.env.ADMIN_EMAIL || 'admin@diamond.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@1234';

    const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existing) {
        console.log('Super Admin already exists:', existing.email);
        await prisma.$disconnect();
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
        data: { email, passwordHash, role: 'SUPER_ADMIN' },
    });

    console.log('Super Admin seeded successfully!');
    console.log('  Email   :', admin.email);
    console.log('  Password:', password);
    console.log('  WARNING: Change this password immediately after first login!');

    await prisma.$disconnect();
};

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
