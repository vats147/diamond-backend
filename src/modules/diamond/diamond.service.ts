import prisma from '../../config/db';
import { uploadToCloudinary } from '../../config/cloudinary';
import { notifyNewDiamondAdded } from '../../utils/whatsapp';
import { CreateDiamondInput, UpdateDiamondInput, FetchByCertificateInput } from './diamond.schema';
import { fetchGIACertificate, fetchIGICertificate } from './certificate.service';
import { extractCertificateData } from './ocr.service';
import { CertificateLab, UploadMethod, DiamondStatus } from '@prisma/client';
import redisClient, { getBusinessDiamondsCacheKey, getStorefrontCacheKey } from '../../config/redis';
import * as xlsx from 'xlsx';

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

export const seedDiamonds = async (businessId: string, userId?: string) => {
    const dummies = [
        {
            shape: 'ROUND', carat: 1.05, color: 'D', clarity: 'FL', cut: 'EX', polish: 'EX', symmetry: 'EX',
            price: 6500, status: DiamondStatus.AVAILABLE, certificateLab: CertificateLab.GIA,
            certificateNumber: '1234567890', fluorescence: 'NONE', measurements: '6.50 - 6.54 x 4.02 mm',
            images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        },
        {
            shape: 'OVAL', carat: 2.10, color: 'G', clarity: 'VS1', cut: 'VG', polish: 'EX', symmetry: 'VG',
            price: 12400, status: DiamondStatus.AVAILABLE, certificateLab: CertificateLab.IGI,
            certificateNumber: '9876543210', fluorescence: 'FAINT', measurements: '10.20 x 7.30 x 4.50 mm',
            images: [], videoUrl: null
        },
        {
            shape: 'EMERALD', carat: 1.50, color: 'E', clarity: 'VVS2', cut: 'EX', polish: 'EX', symmetry: 'EX',
            price: 8900, status: DiamondStatus.HOLD, certificateLab: CertificateLab.HRD,
            certificateNumber: '456123789', fluorescence: 'MEDIUM', measurements: '7.80 x 5.60 x 3.80 mm',
            images: [], videoUrl: null
        },
        {
            shape: 'PEAR', carat: 0.90, color: 'F', clarity: 'SI1', cut: 'G', polish: 'VG', symmetry: 'G',
            price: 3200, status: DiamondStatus.AVAILABLE, certificateLab: CertificateLab.GIA,
            certificateNumber: 'GIA-PEAR-999', fluorescence: 'STRONG', measurements: '8.10 x 5.20 x 3.10 mm',
            images: [], videoUrl: null
        },
        {
            shape: 'RADIANT', carat: 3.02, color: 'J', clarity: 'VS2', cut: 'EX', polish: 'VG', symmetry: 'EX',
            price: 24500, status: DiamondStatus.SOLD, certificateLab: CertificateLab.IGI,
            certificateNumber: 'IGI-RAD-302', fluorescence: 'NONE', measurements: '9.50 x 8.20 x 5.40 mm',
            images: [], videoUrl: null
        }
    ];

    const results = await Promise.all(dummies.map(d => prisma.diamond.create({
        data: {
            ...d,
            businessId,
            uploadMethod: UploadMethod.MANUAL,
            createdBy: userId,
            updatedBy: userId
        }
    })));

    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { slug: true } });
    invalidateBusinessCache(businessId, business?.slug);

    return results;
};

export const bulkUploadDiamonds = async (businessId: string, fileBuffer: Buffer, userId?: string) => {
    // 1. Read the excel/csv file
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to 2D array first to find the header row
    const dataAOA = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Find the row that contains our headers (SHAPE, WEIGHT, etc.)
    let headerRowIndex = 0;
    const requiredKeywords = ['SHAPE', 'WEIGHT', 'CARAT', 'COLOR', 'CLARITY'];

    for (let i = 0; i < Math.min(dataAOA.length, 20); i++) {
        const row = dataAOA[i];
        if (!Array.isArray(row)) continue;

        const matches = row.filter(cell =>
            cell && requiredKeywords.some(kw => cell.toString().toUpperCase().includes(kw))
        ).length;

        if (matches >= 3) {
            headerRowIndex = i;
            break;
        }
    }

    // Convert to JSON using the found header row
    const rawData = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet, {
        range: headerRowIndex,
        defval: null
    });

    const errors: { row: number, error: string }[] = [];
    const validDiamonds: any[] = [];

    // Normalizing keys to match our column matching logic
    const normalizeKey = (key: string) => key?.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];

        // Skip empty rows
        if (!row || Object.values(row).every(v => v === null || v === undefined || v === '')) {
            continue;
        }

        const extractVal = (...possibleKeys: string[]) => {
            const normalizedPossible = possibleKeys.map(normalizeKey);
            for (const key of Object.keys(row)) {
                if (normalizedPossible.includes(normalizeKey(key))) {
                    const val = row[key];
                    if (val === null || val === undefined) return undefined;
                    return val.toString().trim() || undefined;
                }
            }
            return undefined;
        };

        const shape = extractVal('shape');
        const caratStr = extractVal('weight', 'carat', 'crt');
        const color = extractVal('color', 'col');
        const clarity = extractVal('clarity', 'cla');
        const cut = extractVal('cut');
        const polish = extractVal('polish', 'pol');
        const symmetry = extractVal('symmetry', 'sym');
        const fluorescence = extractVal('fl', 'fluor', 'fluorescence', 'fluorosence');
        const measurements = extractVal('measurements', 'measurement', 'size');
        const depth = extractVal('depth', 'depthpercent', 'depthperc');
        const table = extractVal('table', 'tablepercent', 'tableperc');
        const report = extractVal('report', 'certificate', 'cert', 'certificateno');
        const video = extractVal('diamondvideo', 'video', 'videolink', 'videourl');

        const rowNumber = i + 2; // +1 for 0-index, +1 for header

        if (!shape || !caratStr || !color || !clarity) {
            errors.push({ row: rowNumber, error: 'Missing required fields (Shape, Weight, Color, or Clarity)' });
            continue;
        }

        const carat = parseFloat(caratStr);
        if (isNaN(carat)) {
            errors.push({ row: rowNumber, error: 'Invalid Carat Weight' });
            continue;
        }

        let certLab: CertificateLab = CertificateLab.OTHER;
        if (report?.toUpperCase().startsWith('GIA')) certLab = CertificateLab.GIA;
        else if (report?.toUpperCase().startsWith('IGI') || report?.toUpperCase().startsWith('LG')) certLab = CertificateLab.IGI;
        else if (report?.toUpperCase().startsWith('HRD')) certLab = CertificateLab.HRD;
        else if (extractVal('lab')?.toUpperCase() === 'GIA') certLab = CertificateLab.GIA;
        else if (extractVal('lab')?.toUpperCase() === 'IGI') certLab = CertificateLab.IGI;

        // Price parsing, some sheets might have price, default 0
        const priceStr = extractVal('price', 'rate', 'amount');
        const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0 : 0;

        validDiamonds.push({
            businessId,
            shape: shape.toUpperCase(),
            carat,
            color: color.toUpperCase(),
            clarity: clarity.toUpperCase(),
            cut: cut?.toUpperCase() || null,
            polish: polish?.toUpperCase() || null,
            symmetry: symmetry?.toUpperCase() || null,
            fluorescence: fluorescence?.toUpperCase() || null,
            measurements: measurements || null,
            depthPercentage: depth ? parseFloat(depth) : null,
            tablePercentage: table ? parseFloat(table) : null,
            certificateNumber: report || null,
            certificateLab: report ? certLab : null,
            videoUrl: video || null,
            price,
            uploadMethod: UploadMethod.MANUAL,
            status: DiamondStatus.AVAILABLE,
            createdBy: userId,
            updatedBy: userId,
        });
    }

    if (validDiamonds.length > 0) {
        await prisma.diamond.createMany({ data: validDiamonds });

        const business = await prisma.business.findUnique({ where: { id: businessId }, select: { slug: true } });
        invalidateBusinessCache(businessId, business?.slug);
    }

    return {
        insertedCount: validDiamonds.length,
        failedCount: errors.length,
        errors
    };
};
