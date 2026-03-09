import prisma from '../../config/db';
import { uploadToCloudinary } from '../../config/cloudinary';
import { notifyNewDiamondAdded } from '../../utils/whatsapp';
import { CreateDiamondInput, UpdateDiamondInput, FetchByCertificateInput } from './diamond.schema';
import { fetchGIACertificate, fetchIGICertificate } from './certificate.service';
import { extractCertificateData } from './ocr.service';
import { CertificateLab, UploadMethod, DiamondStatus } from '@prisma/client';
import redisClient, { getBusinessDiamondsCacheKey, getStorefrontCacheKey } from '../../config/redis';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const buildWhere = (query: Record<string, string>) => {
    const {
        businessId, shape, colors, caratMin, caratMax,
        clarities, priceMin, priceMax, lab, search,

        // Advanced filter params mapping to DB properties
        tableMin, tableMax, depthMin, depthMax, ratioMin, ratioMax,
        lengthMin, lengthMax, widthMin, widthMax,
        shade, luster, culet, heartsAndArrows,
        tableInclusion, sideInclusion, tableBlack, sideBlack,
        extraFacet, girdle, tableOpen, sideOpen,
        status, location, earlyBird
    } = query;

    const where: Record<string, unknown> = { businessId };

    if (shape) where['shape'] = { in: shape.split(',').map((s) => s.trim()) };
    if (lab) where['certificateLab'] = { in: lab.split(',').map((l) => l.trim().toUpperCase()) };
    if (clarities) where['clarity'] = { in: clarities.split(',').map((c) => c.trim()) };
    if (colors) where['color'] = { in: colors.split(',').map((c) => c.trim().toUpperCase()) };

    // Range helpers
    const addRange = (field: string, min?: string, max?: string) => {
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
    const addIn = (field: string, value?: string) => {
        if (value) where[field] = { in: value.split(',').map((v) => v.trim()) };
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
export const invalidateBusinessCache = async (businessId: string, businessSlug?: string) => {
    try {
        // Find all diamond list caches for this business
        const keys = await redisClient.keys(`diamonds:bus:${businessId}:*`);
        if (keys.length > 0) {
            await redisClient.del(...keys);
            console.log(`[Cache] Invalidated ${keys.length} diamond queries for ${businessId}`);
        }

        // If we know the slug, invalidate the storefront page too
        if (businessSlug) {
            await redisClient.del(getStorefrontCacheKey(businessSlug));
            console.log(`[Cache] Invalidated storefront for ${businessSlug}`);
        }
    } catch (err) {
        console.error('[Cache] Invalidation error:', err);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const listDiamonds = async (query: Record<string, string>) => {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (!query.businessId) throw Object.assign(new Error('businessId is required'), { statusCode: 400 });

    // Try Cache
    // Stringify query params dynamically for cache key (excluding page/limit/businessId handled by helper)
    const { page: _p, limit: _l, businessId, ...restQuery } = query;
    const cacheKey = getBusinessDiamondsCacheKey(businessId, page, limit, JSON.stringify(restQuery));

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return JSON.parse(cached); // fast path return
        }
    } catch (err) {
        console.error('[Redis] Get error:', err);
    }

    const where = buildWhere(query);

    const [diamonds, total] = await Promise.all([
        prisma.diamond.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma.diamond.count({ where }),
    ]);

    const result = { diamonds, total, page, limit, totalPages: Math.ceil(total / limit) };

    // Set Cache for 10 minutes (600s)
    redisClient.set(cacheKey, JSON.stringify(result), 'EX', 600).catch(err => {
        console.error('[Redis] Set error:', err);
    });

    return result;
};

export const getDiamondById = async (id: string) => {
    const diamond = await prisma.diamond.findUnique({ where: { id } });
    if (!diamond) throw Object.assign(new Error('Diamond not found'), { statusCode: 404 });
    return diamond;
};

export const createDiamond = async (
    input: CreateDiamondInput,
    userId: string | undefined,
    files: {
        images?: Express.Multer.File[];
        video?: Express.Multer.File[];
        certificateFile?: Express.Multer.File[];
    }
) => {
    // Upload media to Cloudinary
    const imageUrls: string[] = [];
    if (files.images) {
        for (const f of files.images) {
            const url = await uploadToCloudinary(f.buffer, 'diamonds/images', 'image');
            imageUrls.push(url);
        }
    }

    let videoUrl: string | undefined;
    if (files.video?.[0]) {
        videoUrl = await uploadToCloudinary(files.video[0].buffer, 'diamonds/videos', 'video');
    }

    let certificateFileUrl: string | undefined;
    if (files.certificateFile?.[0]) {
        certificateFileUrl = await uploadToCloudinary(
            files.certificateFile[0].buffer, 'diamonds/certificates', 'raw'
        );
    }

    const diamond = await prisma.diamond.create({
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
            certificateLab: input.certificateLab as CertificateLab | undefined,
            certificateFileUrl,
            images: imageUrls,
            videoUrl,
            uploadMethod: input.uploadMethod as UploadMethod,
            createdBy: userId,
            updatedBy: userId,
        },
    });

    // Fire-and-forget WhatsApp notification (no-op until provider configured)
    const business = await prisma.business.findUnique({ where: { id: input.businessId }, select: { name: true, whatsappNumber: true, slug: true } });

    // Invalidate caches
    invalidateBusinessCache(input.businessId, business?.slug);

    if (business) {
        notifyNewDiamondAdded(
            business.whatsappNumber,
            business.name,
            diamond.shape,
            diamond.carat,
            diamond.color,
            diamond.clarity,
            diamond.certificateNumber
        ).catch(() => { });
    }

    return diamond;
};

export const updateDiamond = async (
    id: string,
    businessId: string,
    role: string,
    userId: string | undefined,
    input: UpdateDiamondInput,
    files: {
        images?: Express.Multer.File[];
        video?: Express.Multer.File[];
        certificateFile?: Express.Multer.File[];
    }
) => {
    const diamond = await getDiamondById(id);

    // Ownership check for owners
    if (role === 'OWNER' && diamond.businessId !== businessId) {
        throw Object.assign(new Error('Forbidden: not your diamond'), { statusCode: 403 });
    }

    const imageUrls: string[] = [];
    if (files.images) {
        for (const f of files.images) {
            imageUrls.push(await uploadToCloudinary(f.buffer, 'diamonds/images', 'image'));
        }
    }

    let videoUrl: string | undefined;
    if (files.video?.[0]) {
        videoUrl = await uploadToCloudinary(files.video[0].buffer, 'diamonds/videos', 'video');
    }

    let certificateFileUrl: string | undefined;
    if (files.certificateFile?.[0]) {
        certificateFileUrl = await uploadToCloudinary(
            files.certificateFile[0].buffer, 'diamonds/certificates', 'raw'
        );
    }

    const updated = await prisma.diamond.update({
        where: { id },
        data: {
            ...input,
            certificateLab: input.certificateLab as CertificateLab | undefined,
            uploadMethod: input.uploadMethod as UploadMethod | undefined,
            status: input.status as DiamondStatus | undefined,
            ...(imageUrls.length > 0 && { images: imageUrls }),
            ...(videoUrl && { videoUrl }),
            ...(certificateFileUrl && { certificateFileUrl }),
            updatedBy: userId,
        },
    });

    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { slug: true } });
    invalidateBusinessCache(businessId, business?.slug);

    return updated;
};

export const deleteDiamond = async (id: string, businessId: string, role: string) => {
    const diamond = await getDiamondById(id);
    if (role === 'OWNER' && diamond.businessId !== businessId) {
        throw Object.assign(new Error('Forbidden: not your diamond'), { statusCode: 403 });
    }
    await prisma.inquiry.deleteMany({ where: { diamondId: id } });
    await prisma.diamond.delete({ where: { id } });

    const business = await prisma.business.findUnique({ where: { id: diamond.businessId }, select: { slug: true } });
    invalidateBusinessCache(diamond.businessId, business?.slug);
};

export const fetchByCertificate = async (input: FetchByCertificateInput) => {
    if (input.lab === 'GIA') return fetchGIACertificate(input.certificateNumber);
    if (input.lab === 'IGI') return fetchIGICertificate(input.certificateNumber);
    throw Object.assign(new Error('Unsupported lab'), { statusCode: 400 });
};

export const extractCertificate = async (file: Express.Multer.File) => {
    return extractCertificateData(file.buffer, file.mimetype);
};
