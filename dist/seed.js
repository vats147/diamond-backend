"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Run once to seed the initial Super Admin account.
 * Usage: npx ts-node src/seed.ts
 */
const seed = async () => {
    const email = process.env.ADMIN_EMAIL || 'admin@diamond.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const existing = await db_1.default.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existing) {
        console.log('Super Admin already exists:', existing.email);
        await db_1.default.$disconnect();
        return;
    }
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    const admin = await db_1.default.user.create({
        data: { email, passwordHash, role: 'SUPER_ADMIN' },
    });
    console.log('Super Admin seeded successfully!');
    console.log('  Email   :', admin.email);
    console.log('  Password:', password);
    console.log('  WARNING: Change this password immediately after first login!');
    await db_1.default.$disconnect();
};
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
