import prisma from '../../config/db';
import { sendInquiryEmail } from '../../utils/email';
import { notifyInquiryReceived } from '../../utils/whatsapp';
import { CreateInquiryInput } from './inquiry.schema';

export const createInquiry = async (input: CreateInquiryInput) => {
    const business = await prisma.business.findUnique({ where: { id: input.businessId } });
    if (!business) throw Object.assign(new Error('Business not found'), { statusCode: 404 });

    let diamondInfo: string | undefined;
    if (input.diamondId) {
        const diamond = await prisma.diamond.findUnique({ where: { id: input.diamondId } });
        if (diamond) {
            diamondInfo = `${diamond.shape} ${diamond.carat}ct ${diamond.color} ${diamond.clarity} — $${diamond.price}`;
        }
    }

    const inquiry = await prisma.inquiry.create({
        data: {
            businessId: input.businessId,
            diamondId: input.diamondId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            message: input.message,
        },
    });

    // Fire-and-forget notifications
    sendInquiryEmail({
        ownerEmail: business.email,
        inquirerName: input.name,
        inquirerEmail: input.email,
        inquirerPhone: input.phone,
        message: input.message,
        businessName: business.name,
        diamondInfo,
    }).catch(() => { });

    notifyInquiryReceived(
        business.whatsappNumber,
        business.name,
        input.name,
        input.message
    ).catch(() => { });

    return inquiry;
};

export const listInquiries = async (
    query: Record<string, string>,
    userRole: string,
    userBusinessId?: string
) => {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '20'), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Owners can only see their own business inquiries
    if (userRole === 'OWNER') {
        where.businessId = userBusinessId;
    } else if (query.businessId) {
        where.businessId = query.businessId;
    }

    if (query.diamondId) where.diamondId = query.diamondId;

    const [inquiries, total] = await Promise.all([
        prisma.inquiry.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { diamond: { select: { shape: true, carat: true, color: true, clarity: true } } },
        }),
        prisma.inquiry.count({ where }),
    ]);

    return { inquiries, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getInquiryById = async (
    id: string,
    userRole: string,
    userBusinessId?: string
) => {
    const inquiry = await prisma.inquiry.findUnique({
        where: { id },
        include: {
            diamond: true,
            business: { select: { name: true, slug: true } },
        },
    });
    if (!inquiry) throw Object.assign(new Error('Inquiry not found'), { statusCode: 404 });
    if (userRole === 'OWNER' && inquiry.businessId !== userBusinessId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
    return inquiry;
};
