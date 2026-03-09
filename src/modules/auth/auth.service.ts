import bcrypt from 'bcrypt';
import prisma from '../../config/db';
import { signToken } from '../../config/jwt';
import { AdminLoginInput, OwnerLoginInput } from './auth.schema';

export const adminLogin = async (input: AdminLoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });
    if (!user || user.role !== 'SUPER_ADMIN') {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const token = signToken({ sub: user.id, role: 'SUPER_ADMIN' });
    return { token, user: { id: user.id, role: user.role } };
};

export const ownerLogin = async (input: OwnerLoginInput) => {
    const business = await prisma.business.findUnique({
        where: { slug: input.businessSlug },
    });
    if (!business) {
        throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    }

    const user = await prisma.user.findFirst({
        where: { email: input.email, businessId: business.id, role: 'OWNER' },
    });
    if (!user) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const token = signToken({ sub: user.id, role: 'OWNER', businessId: business.id });
    return {
        token,
        user: { id: user.id, role: user.role, businessId: business.id },
    };
};
