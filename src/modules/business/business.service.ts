import bcrypt from 'bcrypt';
import prisma from '../../config/db';
import { uploadToCloudinary } from '../../config/cloudinary';
import { slugify } from '../../utils/slugify';
import { sendInvitationEmail, sendPasswordResetNotification } from '../../utils/email';
import {
    CreateBusinessInput,
    UpdateBusinessInput,
    ThemeInput,
    CreateOwnerUserInput,
} from './business.schema';

export const listBusinesses = async () => {
    return prisma.business.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            slug: true,
            ownerName: true,
            email: true,
            contactNumber: true,
            whatsappNumber: true,
            address: true,
            gstNo: true,
            tagline: true,
            logoUrl: true,
            font: true,
            theme: true,
            planType: true,
            trialEndsAt: true,
            planEndsAt: true,
            isActive: true,
            createdAt: true,
            _count: { select: { diamonds: true } },
        },
    });
};

export const getBusinessById = async (id: string) => {
    const business = await prisma.business.findUnique({
        where: { id },
        include: { _count: { select: { diamonds: true, inquiries: true } } },
    });
    if (!business) throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return business;
};

export const getBusinessBySlug = async (slug: string) => {
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return business;
};

export const createBusiness = async (
    input: CreateBusinessInput,
    logoBuffer?: Buffer
) => {
    const slug = slugify(input.name);

    // check duplicate slug/email
    const existing = await prisma.business.findFirst({
        where: { OR: [{ slug }, { email: input.email }] },
    });
    if (existing) {
        const error: any = new Error('Business with that name or email already exists');
        error.statusCode = 409;
        error.details = [{
            field: existing.email === input.email ? 'email' : 'name',
            message: 'Already in use'
        }];
        throw error;
    }

    let logoUrl: string | undefined;
    if (logoBuffer) {
        logoUrl = await uploadToCloudinary(logoBuffer, 'businesses/logos');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const business = await prisma.business.create({
        data: {
            name: input.name,
            slug,
            contactNumber: input.contactNumber,
            ownerName: input.ownerName,
            email: input.email,
            whatsappNumber: input.whatsappNumber,
            address: input.address,
            gstNo: input.gstNo,
            tagline: input.tagline,
            font: input.font,
            theme: (input as any).theme,
            logoUrl,
            planType: 'TRIAL',
            trialEndsAt,
            isActive: true,
        },
    });

    // auto-create owner account
    const passwordHash = await bcrypt.hash(input.ownerPassword, 12);
    await prisma.user.create({
        data: {
            name: input.ownerName,
            email: input.email,
            passwordHash,
            role: 'OWNER',
            businessId: business.id,
        },
    });

    // Send invitation email
    await sendInvitationEmail({
        email: input.email,
        password: input.ownerPassword,
        role: 'OWNER',
        ownerName: input.ownerName,
        businessName: input.name,
    }).catch(err => console.error('Failed to send business invitation email:', err));

    return business;
};

export const updateBusiness = async (
    id: string,
    input: UpdateBusinessInput,
    logoBuffer?: Buffer
) => {
    await getBusinessById(id);

    let logoUrl: string | undefined;
    if (logoBuffer) {
        logoUrl = await uploadToCloudinary(logoBuffer, 'businesses/logos');
    }

    return prisma.business.update({
        where: { id },
        data: { ...input, ...(logoUrl && { logoUrl }) },
    });
};

export const deleteBusiness = async (id: string) => {
    await getBusinessById(id);
    // cascade: inquiries, diamonds, users
    await prisma.inquiry.deleteMany({ where: { businessId: id } });
    await prisma.diamond.deleteMany({ where: { businessId: id } });
    await prisma.user.deleteMany({ where: { businessId: id } });
    await prisma.business.delete({ where: { id } });
};

export const setTheme = async (id: string, theme: ThemeInput) => {
    await getBusinessById(id);
    return prisma.business.update({ where: { id }, data: { theme, font: theme.font } });
};

export const getBranding = async (slug: string) => {
    const business = await prisma.business.findUnique({
        where: { slug },
        select: { name: true, logoUrl: true, font: true, theme: true, whatsappNumber: true },
    });
    if (!business) throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return business;
};

export const createOwnerUser = async (businessId: string, input: CreateOwnerUserInput) => {
    await getBusinessById(businessId);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw Object.assign(new Error('User with that email already exists'), { statusCode: 409 });
    const passwordHash = await bcrypt.hash(input.password, 12);

    const newUser = await prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: 'OWNER',
            isActive: true,
            businessId,
        },
        select: { id: true, name: true, email: true, role: true, businessId: true, isActive: true, createdAt: true },
    });

    // Send invitation email
    await sendInvitationEmail({
        email: input.email,
        password: input.password,
        role: 'OWNER',
        // We could fetch business name here if needed, but for now we use a generic template if ownerName/businessName is missing
    }).catch(err => console.error('Failed to send user invitation email:', err));

    return newUser;
};

export const getBusinessUsers = async (businessId: string) => {
    const users = await prisma.user.findMany({
        where: { businessId },
        select: { id: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true }
    });
    return users;
};

export const removeUser = async (businessId: string, userId: string, actingUser: any) => {
    // Basic authorization checking
    if (actingUser.role !== 'SUPER_ADMIN') {
        if (actingUser.businessId !== businessId || actingUser.role !== 'OWNER') {
            throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
        }
    }

    // Check if the business has at least one other OWNER user to prevent locking out
    const ownerCount = await prisma.user.count({ where: { businessId, role: 'OWNER' } });

    // Check if the user being removed is the last owner
    const targetUser = await prisma.user.findUnique({ where: { id: userId, businessId } });
    if (!targetUser) {
        throw Object.assign(new Error('User not found in this business'), { statusCode: 404 });
    }

    if (ownerCount <= 1 && targetUser.role === 'OWNER') {
        throw Object.assign(new Error('Cannot remove the last owner of a business'), { statusCode: 400 });
    }

    await prisma.user.delete({ where: { id: userId, businessId } });
};

export const toggleUserStatus = async (businessId: string, userId: string, isActive: boolean, actingUser: any) => {
    if (actingUser.role !== 'SUPER_ADMIN' && actingUser.businessId !== businessId) {
        throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
    }

    // Prevent blocking the last owner (TEMPORARILY DISABLED FOR TESTING)
    /*
    if (!isActive) {
        const targetUser = await prisma.user.findUnique({ where: { id: userId, businessId } });
        if (targetUser?.role === 'OWNER') {
            const ownerCount = await prisma.user.count({ where: { businessId, role: 'OWNER', isActive: true } });
            if (ownerCount <= 1) {
                throw Object.assign(new Error('Cannot deactivate the last active owner of a business'), { statusCode: 400 });
            }
        }
    }
    */

    return prisma.user.update({
        where: { id: userId, businessId },
        data: { isActive },
        select: { id: true, email: true, isActive: true }
    });
};

export const resetUserPassword = async (businessId: string, userId: string, newPassword: string, actingUser: any) => {
    if (actingUser.role !== 'SUPER_ADMIN' && actingUser.businessId !== businessId) {
        throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
    }

    const targetUser = await prisma.user.findUnique({
        where: { id: userId, businessId },
        include: { business: true }
    });

    if (!targetUser) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: userId, businessId },
        data: { passwordHash }
    });

    // Send password reset notification
    await sendPasswordResetNotification({
        email: targetUser.email,
        newPassword,
        businessName: targetUser.business?.name || 'Diamond Market',
    }).catch(err => console.error('Failed to send password reset email:', err));

    return { success: true };
};

export const checkSlugAvailability = async (slug: string) => {
    const existing = await prisma.business.findFirst({ where: { slug } });
    return !existing;
};
