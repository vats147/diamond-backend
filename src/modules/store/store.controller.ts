import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import redisClient, {
    getStorefrontCacheKey,
    getBusinessDiamondsCacheKey,
} from '../../config/redis';
import { env } from '../../config/env';
import { DiamondStatus } from '@prisma/client';
import * as xlsx from 'xlsx';

// ─────────────────────────────────────────────────────────────────────────────
// LINK HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the public storefront base URL.
 * Priority: STORE_BASE_URL env → first value of FRONTEND_URL (if not wildcard "*")
 */
const getStoreBaseUrl = (): string => {
    if (env.STORE_BASE_URL) return env.STORE_BASE_URL.replace(/\/$/, '');
    if (env.FRONTEND_URL && env.FRONTEND_URL !== '*') {
        return env.FRONTEND_URL.split(',')[0].trim().replace(/\/$/, '');
    }
    return '';
};

/** Returns a fully-qualified shareable URL for a single diamond page */
export const getDiamondShareUrl = (slug: string, diamondId: string): string => {
    const base = getStoreBaseUrl();
    return base
        ? `${base}/${slug}/diamonds/${diamondId}`
        : `/${slug}/diamonds/${diamondId}`;
};

/**
 * Builds a WhatsApp deep-link that pre-fills an inquiry message.
 * Message format: "Hey I am interested in this product {shareUrl}"
 */
export const getWhatsAppInquiryUrl = (
    whatsappNumber: string,
    shareUrl: string
): string => {
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const message = `Hey I am interested in this product ${shareUrl}`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
};

/**
 * Enriches a raw Prisma diamond record with:
 *  - shareUrl          – public page link for this diamond
 *  - whatsappInquiryUrl – pre-filled WhatsApp message link
 */
export const enrichDiamond = <T extends { id: string }>(
    diamond: T,
    slug: string,
    whatsappNumber: string
): T & { shareUrl: string; whatsappInquiryUrl: string } => {
    const shareUrl = getDiamondShareUrl(slug, diamond.id);
    return {
        ...diamond,
        shareUrl,
        whatsappInquiryUrl: getWhatsAppInquiryUrl(whatsappNumber, shareUrl),
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// RANGE / IN FILTER BUILDER  (reused across list + download routes)
// ─────────────────────────────────────────────────────────────────────────────

const buildPublicWhere = (
    businessId: string,
    query: Record<string, string | string[] | undefined>
): Record<string, unknown> => {
    const where: Record<string, unknown> = {
        businessId,
        status: DiamondStatus.AVAILABLE,
        deletedAt: null,
    };

    const addIn = (field: string, raw?: string | string[]) => {
        if (!raw) return;
        const values = (Array.isArray(raw) ? raw.join(',') : raw)
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        if (values.length) where[field] = { in: values };
    };

    const addInUpper = (field: string, raw?: string | string[]) => {
        if (!raw) return;
        const values = (Array.isArray(raw) ? raw.join(',') : raw)
            .split(',')
            .map((v) => v.trim().toUpperCase())
            .filter(Boolean);
        if (values.length) where[field] = { in: values };
    };

    const addRange = (field: string, min?: string, max?: string) => {
        if (min || max) {
            where[field] = {
                ...(min && { gte: parseFloat(min) }),
                ...(max && { lte: parseFloat(max) }),
            };
        }
    };

    addIn('shape', query['shape'] as string | undefined);
    addInUpper('certificateLab', query['lab'] as string | undefined);
    addInUpper('color', query['color'] as string | undefined);
    addIn('clarity', query['clarity'] as string | undefined);
    addIn('cut', query['cut'] as string | undefined);
    addIn('polish', query['polish'] as string | undefined);
    addIn('symmetry', query['symmetry'] as string | undefined);
    addIn('fluorescence', query['fluorescence'] as string | undefined);
    addIn('shade', query['shade'] as string | undefined);
    addIn('luster', query['luster'] as string | undefined);
    addIn('culet', query['culet'] as string | undefined);
    addIn('girdle', query['girdle'] as string | undefined);
    addIn('heartsAndArrows', query['heartsAndArrows'] as string | undefined);
    addIn('location', query['location'] as string | undefined);

    addRange('carat', query['caratMin'] as string, query['caratMax'] as string);
    addRange('price', query['priceMin'] as string, query['priceMax'] as string);
    addRange('tablePercentage', query['tableMin'] as string, query['tableMax'] as string);
    addRange('depthPercentage', query['depthMin'] as string, query['depthMax'] as string);
    addRange('ratio', query['ratioMin'] as string, query['ratioMax'] as string);
    addRange('length', query['lengthMin'] as string, query['lengthMax'] as string);
    addRange('width', query['widthMin'] as string, query['widthMax'] as string);

    const search = query['search'] as string | undefined;
    if (search) {
        where['OR'] = [
            { certificateNumber: { contains: search, mode: 'insensitive' } },
            { shape: { contains: search, mode: 'insensitive' } },
        ];
    }

    return where;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/store/:slug
 * Public business profile + first 50 AVAILABLE diamonds (storefront landing)
 */
export const getStorefront = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const slug = String(req.params['slug']);
        const cacheKey = getStorefrontCacheKey(slug);

        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                sendSuccess(res, JSON.parse(cached));
                return;
            }
        } catch (err) {
            console.error('[Redis] Get Error:', err);
        }

        const business = await prisma.business.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                tagline: true,
                font: true,
                theme: true,
                whatsappNumber: true,
                contactNumber: true,
                address: true,
            },
        });

        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }

        const where = {
            businessId: business.id,
            status: DiamondStatus.AVAILABLE,
            deletedAt: null,
        };

        const [diamonds, total] = await Promise.all([
            prisma.diamond.findMany({ where, take: 50, orderBy: { createdAt: 'desc' } }),
            prisma.diamond.count({ where }),
        ]);

        const { id: _id, ...publicBusiness } = business;
        const enrichedDiamonds = diamonds.map((d) =>
            enrichDiamond(d, slug, business.whatsappNumber)
        );

        const responseData = {
            business: {
                ...publicBusiness,
                downloadUrl: `${getStoreBaseUrl()}/api/store/${slug}/diamonds/download`,
            },
            diamonds: enrichedDiamonds,
            total,
        };

        redisClient
            .set(cacheKey, JSON.stringify(responseData), 'EX', 3600)
            .catch((err) => console.error('[Redis] Set error:', err));

        sendSuccess(res, responseData);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/store/:slug/diamonds
 * Paginated, filterable list of AVAILABLE diamonds for the public storefront.
 * Each diamond is enriched with shareUrl + whatsappInquiryUrl.
 *
 * Query params:
 *   page, limit, sortBy, sortOrder,
 *   shape, lab, color, clarity, cut, polish, symmetry, fluorescence,
 *   caratMin, caratMax, priceMin, priceMax,
 *   tableMin, tableMax, depthMin, depthMax, ratioMin, ratioMax,
 *   lengthMin, lengthMax, widthMin, widthMax,
 *   shade, luster, culet, girdle, heartsAndArrows, location,
 *   search
 */
export const listStoreDiamonds = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const slug = String(req.params['slug']);

        const business = await prisma.business.findUnique({
            where: { slug },
            select: { id: true, name: true, whatsappNumber: true },
        });

        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }

        const page = Math.max(1, parseInt((req.query['page'] as string) || '1'));
        const limit = Math.min(parseInt((req.query['limit'] as string) || '50'), 100);
        const skip = (page - 1) * limit;
        const sortBy = (req.query['sortBy'] as string) || 'createdAt';
        const sortOrder: 'asc' | 'desc' =
            req.query['sortOrder'] === 'asc' ? 'asc' : 'desc';

        // Cache key excludes page/limit so pagination is separate cache entries
        const { page: _p, limit: _l, ...restQuery } = req.query as Record<string, string>;
        const cacheKey = getBusinessDiamondsCacheKey(
            business.id,
            page,
            limit,
            JSON.stringify({ ...restQuery, _storeOnly: true })
        );

        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                sendSuccess(res, JSON.parse(cached));
                return;
            }
        } catch (err) {
            console.error('[Redis] Get Error:', err);
        }

        const where = buildPublicWhere(business.id, req.query as Record<string, string>);

        const [diamonds, total] = await Promise.all([
            prisma.diamond.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.diamond.count({ where }),
        ]);

        const enrichedDiamonds = diamonds.map((d) =>
            enrichDiamond(d, slug, business.whatsappNumber)
        );

        const responseData = {
            business: { name: business.name },
            diamonds: enrichedDiamonds,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            // Handy meta links for the frontend
            downloadUrl: `/api/store/${slug}/diamonds/download`,
        };

        redisClient
            .set(cacheKey, JSON.stringify(responseData), 'EX', 600)
            .catch((e) => console.error('[Redis] Set error:', e));

        sendSuccess(res, responseData);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/store/:slug/diamonds/download
 * Downloads all AVAILABLE diamonds for the business as an Excel (.xlsx) or CSV file.
 * The file header prominently shows the organisation name, contact, and generation timestamp.
 *
 * Query params:
 *   format  – "xlsx" (default) | "csv"
 *   + all the same filter params as listStoreDiamonds
 */
export const downloadStoreDiamonds = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const slug = String(req.params['slug']);
        const format = ((req.query['format'] as string) || 'xlsx').toLowerCase();

        const business = await prisma.business.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                contactNumber: true,
                whatsappNumber: true,
                address: true,
                email: true,
            },
        });

        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }

        // Reuse the same public filter builder – all query params work for download too
        const where = buildPublicWhere(
            business.id,
            req.query as Record<string, string>
        );

        const diamonds = await prisma.diamond.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        // ── Build Workbook ────────────────────────────────────────────────────

        const workbook = xlsx.utils.book_new();

        const generatedAt = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
        });

        // ── Info / Title rows ─────────────────────────────────────────────────
        const infoRows: (string | number | null)[][] = [
            [`${business.name}`],
            [
                `Contact: ${business.contactNumber}` +
                    (business.whatsappNumber
                        ? `  |  WhatsApp: ${business.whatsappNumber}`
                        : '') +
                    (business.email ? `  |  Email: ${business.email}` : ''),
            ],
            [business.address ? `Address: ${business.address}` : ''],
            [`Generated: ${generatedAt}   |   Total Available Diamonds: ${diamonds.length}`],
            [], // spacer row
        ];

        // ── Column Headers ────────────────────────────────────────────────────
        const columnHeaders: string[] = [
            'Sr No',
            'Certificate No',
            'Lab',
            'Shape',
            'Carat',
            'Color',
            'Clarity',
            'Cut',
            'Polish',
            'Symmetry',
            'Fluorescence',
            'Measurements',
            'Table %',
            'Depth %',
            'Ratio',
            'Length (mm)',
            'Width (mm)',
            'Depth (mm)',
            'Shade',
            'Luster',
            'Culet',
            'Girdle',
            'H&A',
            'Table Inclusion',
            'Side Inclusion',
            'Table Black',
            'Side Black',
            'Extra Facet',
            'Table Open',
            'Side Open',
            'Price (USD)',
            'Location',
            'Share Link',
        ];

        // ── Data Rows ─────────────────────────────────────────────────────────
        const dataRows = diamonds.map((d, idx) => {
            const shareUrl = getDiamondShareUrl(slug, d.id);
            return [
                idx + 1,
                d.certificateNumber ?? '',
                d.certificateLab ?? '',
                d.shape,
                d.carat,
                d.color,
                d.clarity,
                d.cut ?? '',
                d.polish ?? '',
                d.symmetry ?? '',
                d.fluorescence ?? '',
                d.measurements ?? '',
                d.tablePercentage ?? '',
                d.depthPercentage ?? '',
                d.ratio ?? '',
                d.length ?? '',
                d.width ?? '',
                d.depth ?? '',
                d.shade ?? '',
                d.luster ?? '',
                d.culet ?? '',
                d.girdle ?? '',
                d.heartsAndArrows ?? '',
                d.tableInclusion ?? '',
                d.sideInclusion ?? '',
                d.tableBlack ?? '',
                d.sideBlack ?? '',
                d.extraFacet ?? '',
                d.tableOpen ?? '',
                d.sideOpen ?? '',
                d.price,
                d.location ?? '',
                shareUrl,
            ];
        });

        const allRows = [...infoRows, columnHeaders, ...dataRows];
        const ws = xlsx.utils.aoa_to_sheet(allRows);

        // ── Column widths ─────────────────────────────────────────────────────
        ws['!cols'] = [
            { wch: 6 },   // Sr
            { wch: 18 },  // Cert No
            { wch: 8 },   // Lab
            { wch: 12 },  // Shape
            { wch: 8 },   // Carat
            { wch: 8 },   // Color
            { wch: 10 },  // Clarity
            { wch: 8 },   // Cut
            { wch: 8 },   // Polish
            { wch: 10 },  // Symmetry
            { wch: 13 },  // Fluorescence
            { wch: 22 },  // Measurements
            { wch: 9 },   // Table %
            { wch: 9 },   // Depth %
            { wch: 8 },   // Ratio
            { wch: 11 },  // Length
            { wch: 10 },  // Width
            { wch: 10 },  // Depth
            { wch: 10 },  // Shade
            { wch: 10 },  // Luster
            { wch: 8 },   // Culet
            { wch: 14 },  // Girdle
            { wch: 8 },   // H&A
            { wch: 15 },  // Table Inc
            { wch: 14 },  // Side Inc
            { wch: 12 },  // Table Black
            { wch: 11 },  // Side Black
            { wch: 12 },  // Extra Facet
            { wch: 11 },  // Table Open
            { wch: 10 },  // Side Open
            { wch: 14 },  // Price
            { wch: 16 },  // Location
            { wch: 70 },  // Share Link
        ];

        xlsx.utils.book_append_sheet(workbook, ws, 'Available Diamonds');

        // ── Respond ───────────────────────────────────────────────────────────
        const safeOrgName = business.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${safeOrgName}_diamonds_${Date.now()}`;

        if (format === 'csv') {
            const csv = xlsx.utils.sheet_to_csv(ws);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${filename}.csv"`
            );
            res.send(csv);
            return;
        }

        // Default → XLSX
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}.xlsx"`
        );
        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/store/:slug/diamonds/:id
 * Single AVAILABLE diamond detail – enriched with shareUrl + whatsappInquiryUrl.
 */
export const getStoreDiamond = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const slug = String(req.params['slug']);
        const id = String(req.params['id']);

        const business = await prisma.business.findUnique({
            where: { slug },
            select: { id: true, name: true, whatsappNumber: true },
        });

        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }

        const diamond = await prisma.diamond.findFirst({
            where: {
                id,
                businessId: business.id,
                status: DiamondStatus.AVAILABLE,
                deletedAt: null,
            },
        });

        if (!diamond) {
            res.status(404).json({ success: false, error: 'Diamond not found' });
            return;
        }

        const enriched = enrichDiamond(diamond, slug, business.whatsappNumber);
        sendSuccess(res, enriched);
    } catch (err) {
        next(err);
    }
};
