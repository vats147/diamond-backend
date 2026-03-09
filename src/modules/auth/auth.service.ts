import bcrypt from 'bcrypt';
import prisma from '../../config/db';
import { signToken } from '../../config/jwt';
import { AdminLoginInput, OwnerLoginInput } from './auth.schema';

/**
 * Unified login that handles both SUPER_ADMIN and OWNER roles
 */
export const login = async (input: { email: string; password?: string }) => {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
        include: { business: { select: { id: true, slug: true, isActive: true } } }
    });

    if (!user) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    // Block login if the business is inactive
    if (user.role === 'OWNER' && user.business?.isActive === false) {
        throw Object.assign(new Error('This business account has been deactivated. Please contact support.'), { statusCode: 403 });
    }

    if (input.password) {
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
            throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
        }
    }

    const payload: any = { sub: user.id, role: user.role };
    if (user.role === 'OWNER' && user.businessId) {
        payload.businessId = user.businessId;
    }

    const token = signToken(payload);

    return {
        token,
        user: {
            id: user.id,
            role: user.role,
            email: user.email,
            ...(user.businessId && { businessId: user.businessId, businessSlug: user.business?.slug })
        }
    };
};

export const adminLogin = async (input: AdminLoginInput) => {
    return login(input);
};

export const ownerLogin = async (input: OwnerLoginInput) => {
    return login(input);
};
