"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSlugAvailability = exports.removeUser = exports.createOwnerUser = exports.getBranding = exports.setTheme = exports.deleteBusiness = exports.updateBusiness = exports.createBusiness = exports.getBusinessBySlug = exports.getBusinessById = exports.listBusinesses = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../../config/db"));
const cloudinary_1 = require("../../config/cloudinary");
const slugify_1 = require("../../utils/slugify");
const listBusinesses = async () => {
    return db_1.default.business.findMany({
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
exports.listBusinesses = listBusinesses;
const getBusinessById = async (id) => {
    const business = await db_1.default.business.findUnique({
        where: { id },
        include: { _count: { select: { diamonds: true, inquiries: true } } },
    });
    if (!business)
        throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return business;
};
exports.getBusinessById = getBusinessById;
const getBusinessBySlug = async (slug) => {
    const business = await db_1.default.business.findUnique({ where: { slug } });
    if (!business)
        throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return business;
};
exports.getBusinessBySlug = getBusinessBySlug;
const createBusiness = async (input, logoBuffer) => {
    const slug = (0, slugify_1.slugify)(input.name);
    // check duplicate slug/email
    const existing = await db_1.default.business.findFirst({
        where: { OR: [{ slug }, { email: input.email }] },
    });
    if (existing) {
        const error = new Error('Business with that name or email already exists');
        error.statusCode = 409;
        error.details = [{
                field: existing.email === input.email ? 'email' : 'name',
                message: 'Already in use'
            }];
        throw error;
    }
    let logoUrl;
    if (logoBuffer) {
        logoUrl = await (0, cloudinary_1.uploadToCloudinary)(logoBuffer, 'businesses/logos');
    }
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    const business = await db_1.default.business.create({
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
            theme: input.theme,
            logoUrl,
            planType: 'TRIAL',
            trialEndsAt,
            isActive: true,
        },
    });
    // auto-create owner account
    const passwordHash = await bcrypt_1.default.hash(input.ownerPassword, 12);
    await db_1.default.user.create({
        data: {
            email: input.email,
            passwordHash,
            role: 'OWNER',
            businessId: business.id,
        },
    });
    return business;
};
exports.createBusiness = createBusiness;
const updateBusiness = async (id, input, logoBuffer) => {
    await (0, exports.getBusinessById)(id);
    let logoUrl;
    if (logoBuffer) {
        logoUrl = await (0, cloudinary_1.uploadToCloudinary)(logoBuffer, 'businesses/logos');
    }
    return db_1.default.business.update({
        where: { id },
        data: { ...input, ...(logoUrl && { logoUrl }) },
    });
};
exports.updateBusiness = updateBusiness;
const deleteBusiness = async (id) => {
    await (0, exports.getBusinessById)(id);
    // cascade: inquiries, diamonds, users
    await db_1.default.inquiry.deleteMany({ where: { businessId: id } });
    await db_1.default.diamond.deleteMany({ where: { businessId: id } });
    await db_1.default.user.deleteMany({ where: { businessId: id } });
    await db_1.default.business.delete({ where: { id } });
};
exports.deleteBusiness = deleteBusiness;
const setTheme = async (id, theme) => {
    await (0, exports.getBusinessById)(id);
    return db_1.default.business.update({ where: { id }, data: { theme, font: theme.font } });
};
exports.setTheme = setTheme;
const getBranding = async (slug) => {
    const business = await db_1.default.business.findUnique({
        where: { slug },
        select: { name: true, logoUrl: true, font: true, theme: true, whatsappNumber: true },
    });
    if (!business)
        throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return business;
};
exports.getBranding = getBranding;
const createOwnerUser = async (businessId, input) => {
    await (0, exports.getBusinessById)(businessId);
    const existing = await db_1.default.user.findUnique({ where: { email: input.email } });
    if (existing)
        throw Object.assign(new Error('User with that email already exists'), { statusCode: 409 });
    const passwordHash = await bcrypt_1.default.hash(input.password, 12);
    // TODO: Send email
    return db_1.default.user.create({
        data: {
            email: input.email,
            passwordHash,
            role: 'OWNER',
            businessId,
        },
        select: { id: true, email: true, role: true, businessId: true, createdAt: true },
    });
};
exports.createOwnerUser = createOwnerUser;
const removeUser = async (businessId, userId, actingUser) => {
    // Basic authorization checking
    if (actingUser.role !== 'SUPER_ADMIN') {
        if (actingUser.businessId !== businessId || actingUser.role !== 'OWNER') {
            throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
        }
    }
    // Check if the business has at least one other OWNER user to prevent locking out
    const ownerCount = await db_1.default.user.count({ where: { businessId, role: 'OWNER' } });
    // Check if the user being removed is the last owner
    const targetUser = await db_1.default.user.findUnique({ where: { id: userId, businessId } });
    if (!targetUser) {
        throw Object.assign(new Error('User not found in this business'), { statusCode: 404 });
    }
    if (ownerCount <= 1 && targetUser.role === 'OWNER') {
        throw Object.assign(new Error('Cannot remove the last owner of a business'), { statusCode: 400 });
    }
    await db_1.default.user.delete({ where: { id: userId, businessId } });
};
exports.removeUser = removeUser;
const checkSlugAvailability = async (slug) => {
    const existing = await db_1.default.business.findUnique({ where: { slug } });
    return !existing;
};
exports.checkSlugAvailability = checkSlugAvailability;
