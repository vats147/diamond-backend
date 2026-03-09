import bcrypt from 'bcrypt';
import prisma from '../../config/db';
import { uploadToCloudinary } from '../../config/cloudinary';
import { slugify } from '../../utils/slugify';
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
            logoUrl: true,
            font: true,
            theme: true,
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
        throw Object.assign(new Error('Business with that name or email already exists'), { statusCode: 409 });
    }

    let logoUrl: string | undefined;
    if (logoBuffer) {
        logoUrl = await uploadToCloudinary(logoBuffer, 'businesses/logos');
    }

    const business = await prisma.business.create({
        data: {
            name: input.name,
            slug,
            contactNumber: input.contactNumber,
            ownerName: input.ownerName,
            email: input.email,
            whatsappNumber: input.whatsappNumber,
            font: input.font,
            logoUrl,
        },
    });

    // auto-create owner account
    const passwordHash = await bcrypt.hash(input.ownerPassword, 12);
    await prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            role: 'OWNER',
            businessId: business.id,
        },
    });

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
    return prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            role: 'OWNER',
            businessId,
        },
        select: { id: true, email: true, role: true, businessId: true, createdAt: true },
    });
};
