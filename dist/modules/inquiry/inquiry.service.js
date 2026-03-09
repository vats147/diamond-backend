"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInquiryById = exports.listInquiries = exports.createInquiry = void 0;
const db_1 = __importDefault(require("../../config/db"));
const email_1 = require("../../utils/email");
const whatsapp_1 = require("../../utils/whatsapp");
const createInquiry = async (input) => {
    const business = await db_1.default.business.findUnique({ where: { id: input.businessId } });
    if (!business)
        throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    let diamondInfo;
    if (input.diamondId) {
        const diamond = await db_1.default.diamond.findUnique({ where: { id: input.diamondId } });
        if (diamond) {
            diamondInfo = `${diamond.shape} ${diamond.carat}ct ${diamond.color} ${diamond.clarity} — $${diamond.price}`;
        }
    }
    const inquiry = await db_1.default.inquiry.create({
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
    (0, email_1.sendInquiryEmail)({
        ownerEmail: business.email,
        inquirerName: input.name,
        inquirerEmail: input.email,
        inquirerPhone: input.phone,
        message: input.message,
        businessName: business.name,
        diamondInfo,
    }).catch(() => { });
    (0, whatsapp_1.notifyInquiryReceived)(business.whatsappNumber, business.name, input.name, input.message).catch(() => { });
    return inquiry;
};
exports.createInquiry = createInquiry;
const listInquiries = async (query, userRole, userBusinessId) => {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '20'), 100);
    const skip = (page - 1) * limit;
    const where = {};
    // Owners can only see their own business inquiries
    if (userRole === 'OWNER') {
        where.businessId = userBusinessId;
    }
    else if (query.businessId) {
        where.businessId = query.businessId;
    }
    if (query.diamondId)
        where.diamondId = query.diamondId;
    const [inquiries, total] = await Promise.all([
        db_1.default.inquiry.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { diamond: { select: { shape: true, carat: true, color: true, clarity: true } } },
        }),
        db_1.default.inquiry.count({ where }),
    ]);
    return { inquiries, total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.listInquiries = listInquiries;
const getInquiryById = async (id, userRole, userBusinessId) => {
    const inquiry = await db_1.default.inquiry.findUnique({
        where: { id },
        include: {
            diamond: true,
            business: { select: { name: true, slug: true } },
        },
    });
    if (!inquiry)
        throw Object.assign(new Error('Inquiry not found'), { statusCode: 404 });
    if (userRole === 'OWNER' && inquiry.businessId !== userBusinessId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
    return inquiry;
};
exports.getInquiryById = getInquiryById;
