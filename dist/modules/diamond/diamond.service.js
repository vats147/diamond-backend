"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCertificate = exports.fetchByCertificate = exports.deleteDiamond = exports.updateDiamond = exports.createDiamond = exports.getDiamondById = exports.listDiamonds = exports.invalidateBusinessCache = void 0;
const db_1 = __importDefault(require("../../config/db"));
const cloudinary_1 = require("../../config/cloudinary");
const whatsapp_1 = require("../../utils/whatsapp");
const certificate_service_1 = require("./certificate.service");
const ocr_service_1 = require("./ocr.service");
const redis_1 = __importStar(require("../../config/redis"));
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const buildWhere = (query) => {
    const { businessId, shape, colors, caratMin, caratMax, clarities, priceMin, priceMax, lab, search, 
    // Advanced filter params mapping to DB properties
    tableMin, tableMax, depthMin, depthMax, ratioMin, ratioMax, lengthMin, lengthMax, widthMin, widthMax, shade, luster, culet, heartsAndArrows, tableInclusion, sideInclusion, tableBlack, sideBlack, extraFacet, girdle, tableOpen, sideOpen, status, location, earlyBird } = query;
    const where = { businessId };
    if (shape)
        where['shape'] = { in: shape.split(',').map((s) => s.trim()) };
    if (lab)
        where['certificateLab'] = { in: lab.split(',').map((l) => l.trim().toUpperCase()) };
    if (clarities)
        where['clarity'] = { in: clarities.split(',').map((c) => c.trim()) };
    if (colors)
        where['color'] = { in: colors.split(',').map((c) => c.trim().toUpperCase()) };
    // Range helpers
    const addRange = (field, min, max) => {
        if (min || max) {
            where[field] = {
                ...(min && { gte: parseFloat(min) }),
                ...(max && { lte: parseFloat(max) }),
            };
        }
    };
    addRange('carat', caratMin, caratMax);
    addRange('price', priceMin, priceMax);
    addRange('tablePercentage', tableMin, tableMax);
    addRange('depthPercentage', depthMin, depthMax);
    addRange('ratio', ratioMin, ratioMax);
    addRange('length', lengthMin, lengthMax);
    addRange('width', widthMin, widthMax);
    // Explicit depth range uses depth database field:
    // This assumes they send `depthAbsMin`/`depthAbsMax` so not to conflict with depthPercentage min/max
    addRange('depth', query.depthAbsMin, query.depthAbsMax);
    // Exact matches (comma-separated arrays allowed from frontend)
    const addIn = (field, value) => {
        if (value)
            where[field] = { in: value.split(',').map((v) => v.trim()) };
    };
    addIn('shade', shade);
    addIn('luster', luster);
    addIn('culet', culet);
    addIn('heartsAndArrows', heartsAndArrows);
    addIn('tableInclusion', tableInclusion);
    addIn('sideInclusion', sideInclusion);
    addIn('tableBlack', tableBlack);
    addIn('sideBlack', sideBlack);
    addIn('extraFacet', extraFacet);
    addIn('girdle', girdle);
    addIn('tableOpen', tableOpen);
    addIn('sideOpen', sideOpen);
    addIn('location', location);
    addIn('earlyBird', earlyBird);
    if (status) {
        where['status'] = { in: status.split(',').map((s) => s.trim().toUpperCase()) };
    }
    if (search) {
        where['OR'] = [
            { certificateNumber: { contains: search, mode: 'insensitive' } },
            { shape: { contains: search, mode: 'insensitive' } },
        ];
    }
    return where;
};
// --- CACHE INVALIDATION ---
const invalidateBusinessCache = async (businessId, businessSlug) => {
    try {
        // Find all diamond list caches for this business
        const keys = await redis_1.default.keys(`diamonds:bus:${businessId}:*`);
        if (keys.length > 0) {
            await redis_1.default.del(...keys);
            console.log(`[Cache] Invalidated ${keys.length} diamond queries for ${businessId}`);
        }
        // If we know the slug, invalidate the storefront page too
        if (businessSlug) {
            await redis_1.default.del((0, redis_1.getStorefrontCacheKey)(businessSlug));
            console.log(`[Cache] Invalidated storefront for ${businessSlug}`);
        }
    }
    catch (err) {
        console.error('[Cache] Invalidation error:', err);
    }
};
exports.invalidateBusinessCache = invalidateBusinessCache;
// ─────────────────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
const listDiamonds = async (query) => {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (!query.businessId)
        throw Object.assign(new Error('businessId is required'), { statusCode: 400 });
    // Try Cache
    // Stringify query params dynamically for cache key (excluding page/limit/businessId handled by helper)
    const { page: _p, limit: _l, businessId, ...restQuery } = query;
    const cacheKey = (0, redis_1.getBusinessDiamondsCacheKey)(businessId, page, limit, JSON.stringify(restQuery));
    try {
        const cached = await redis_1.default.get(cacheKey);
        if (cached) {
            return JSON.parse(cached); // fast path return
        }
    }
    catch (err) {
        console.error('[Redis] Get error:', err);
    }
    const where = buildWhere(query);
    const [diamonds, total] = await Promise.all([
        db_1.default.diamond.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        db_1.default.diamond.count({ where }),
    ]);
    const result = { diamonds, total, page, limit, totalPages: Math.ceil(total / limit) };
    // Set Cache for 10 minutes (600s)
    redis_1.default.set(cacheKey, JSON.stringify(result), 'EX', 600).catch(err => {
        console.error('[Redis] Set error:', err);
    });
    return result;
};
exports.listDiamonds = listDiamonds;
const getDiamondById = async (id) => {
    const diamond = await db_1.default.diamond.findUnique({ where: { id } });
    if (!diamond)
        throw Object.assign(new Error('Diamond not found'), { statusCode: 404 });
    return diamond;
};
exports.getDiamondById = getDiamondById;
const createDiamond = async (input, userId, files) => {
    // Upload media to Cloudinary
    const imageUrls = [];
    if (files.images) {
        for (const f of files.images) {
            const url = await (0, cloudinary_1.uploadToCloudinary)(f.buffer, 'diamonds/images', 'image');
            imageUrls.push(url);
        }
    }
    let videoUrl;
    if (files.video?.[0]) {
        videoUrl = await (0, cloudinary_1.uploadToCloudinary)(files.video[0].buffer, 'diamonds/videos', 'video');
    }
    let certificateFileUrl;
    if (files.certificateFile?.[0]) {
        certificateFileUrl = await (0, cloudinary_1.uploadToCloudinary)(files.certificateFile[0].buffer, 'diamonds/certificates', 'raw');
    }
    const diamond = await db_1.default.diamond.create({
        data: {
            businessId: input.businessId,
            shape: input.shape,
            carat: input.carat,
            color: input.color,
            clarity: input.clarity,
            price: input.price,
            cut: input.cut,
            polish: input.polish,
            symmetry: input.symmetry,
            fluorescence: input.fluorescence,
            measurements: input.measurements,
            certificateNumber: input.certificateNumber,
            certificateLab: input.certificateLab,
            certificateFileUrl,
            images: imageUrls,
            videoUrl,
            uploadMethod: input.uploadMethod,
            createdBy: userId,
            updatedBy: userId,
        },
    });
    // Fire-and-forget WhatsApp notification (no-op until provider configured)
    const business = await db_1.default.business.findUnique({ where: { id: input.businessId }, select: { name: true, whatsappNumber: true, slug: true } });
    // Invalidate caches
    (0, exports.invalidateBusinessCache)(input.businessId, business?.slug);
    if (business) {
        (0, whatsapp_1.notifyNewDiamondAdded)(business.whatsappNumber, business.name, diamond.shape, diamond.carat, diamond.color, diamond.clarity, diamond.certificateNumber).catch(() => { });
    }
    return diamond;
};
exports.createDiamond = createDiamond;
const updateDiamond = async (id, businessId, role, userId, input, files) => {
    const diamond = await (0, exports.getDiamondById)(id);
    // Ownership check for owners
    if (role === 'OWNER' && diamond.businessId !== businessId) {
        throw Object.assign(new Error('Forbidden: not your diamond'), { statusCode: 403 });
    }
    const imageUrls = [];
    if (files.images) {
        for (const f of files.images) {
            imageUrls.push(await (0, cloudinary_1.uploadToCloudinary)(f.buffer, 'diamonds/images', 'image'));
        }
    }
    let videoUrl;
    if (files.video?.[0]) {
        videoUrl = await (0, cloudinary_1.uploadToCloudinary)(files.video[0].buffer, 'diamonds/videos', 'video');
    }
    let certificateFileUrl;
    if (files.certificateFile?.[0]) {
        certificateFileUrl = await (0, cloudinary_1.uploadToCloudinary)(files.certificateFile[0].buffer, 'diamonds/certificates', 'raw');
    }
    const updated = await db_1.default.diamond.update({
        where: { id },
        data: {
            ...input,
            certificateLab: input.certificateLab,
            uploadMethod: input.uploadMethod,
            status: input.status,
            ...(imageUrls.length > 0 && { images: imageUrls }),
            ...(videoUrl && { videoUrl }),
            ...(certificateFileUrl && { certificateFileUrl }),
            updatedBy: userId,
        },
    });
    const business = await db_1.default.business.findUnique({ where: { id: businessId }, select: { slug: true } });
    (0, exports.invalidateBusinessCache)(businessId, business?.slug);
    return updated;
};
exports.updateDiamond = updateDiamond;
const deleteDiamond = async (id, businessId, role) => {
    const diamond = await (0, exports.getDiamondById)(id);
    if (role === 'OWNER' && diamond.businessId !== businessId) {
        throw Object.assign(new Error('Forbidden: not your diamond'), { statusCode: 403 });
    }
    await db_1.default.inquiry.deleteMany({ where: { diamondId: id } });
    await db_1.default.diamond.delete({ where: { id } });
    const business = await db_1.default.business.findUnique({ where: { id: diamond.businessId }, select: { slug: true } });
    (0, exports.invalidateBusinessCache)(diamond.businessId, business?.slug);
};
exports.deleteDiamond = deleteDiamond;
const fetchByCertificate = async (input) => {
    if (input.lab === 'GIA')
        return (0, certificate_service_1.fetchGIACertificate)(input.certificateNumber);
    if (input.lab === 'IGI')
        return (0, certificate_service_1.fetchIGICertificate)(input.certificateNumber);
    throw Object.assign(new Error('Unsupported lab'), { statusCode: 400 });
};
exports.fetchByCertificate = fetchByCertificate;
const extractCertificate = async (file) => {
    return (0, ocr_service_1.extractCertificateData)(file.buffer, file.mimetype);
};
exports.extractCertificate = extractCertificate;
