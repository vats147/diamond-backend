import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import redisClient, { getStorefrontCacheKey, getBusinessDiamondsCacheKey } from '../../config/redis';

const router = Router();

/**
 * @route  GET /api/store/:slug
 * @desc   Get public business profile + first page of diamonds (optimised for storefront)
 * @access Public
 * @returns { success, data: { business, diamonds[], total } }
 * @errors 404 Business not found
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const slug = String(req.params['slug']);
        const cacheKey = getStorefrontCacheKey(slug);
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return sendSuccess(res, JSON.parse(cached));
            }
        } catch (err) { console.error('[Redis] Get Error:', err); }

        const business = await prisma.business.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                font: true,
                theme: true,
                whatsappNumber: true,
                contactNumber: true,
            },
        });
        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }

        const [diamonds, total] = await Promise.all([
            prisma.diamond.findMany({
                where: { businessId: business.id },
                take: 50,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.diamond.count({ where: { businessId: business.id } }),
        ]);

        const { id: _id, ...publicBusiness } = business;
        const responseData = { business: publicBusiness, diamonds, total };

        // Cache for 1 hour
        redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 3600).catch(err => console.error('[Redis] Set error:', err));

        sendSuccess(res, responseData);
    } catch (err) { next(err); }
});

/**
 * @route  GET /api/store/:slug/diamonds
 * @desc   Paginated diamonds for a storefront
 * @access Public
 * @query  page?, limit?, sortBy?, sortOrder?, shape?, lab?
 * @returns { success, data: { diamonds[], total, page, limit, totalPages } }
 * @errors 404 Business not found
 */
router.get('/:slug/diamonds', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const slug = String(req.params['slug']);
        const business = await prisma.business.findUnique({ where: { slug } });
        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }
        const page = parseInt((req.query['page'] as string) || '1');
        const limit = Math.min(parseInt((req.query['limit'] as string) || '50'), 100);
        const skip = (page - 1) * limit;
        const sortBy = (req.query['sortBy'] as string) || 'createdAt';
        const sortOrder: 'asc' | 'desc' = req.query['sortOrder'] === 'asc' ? 'asc' : 'desc';

        const { page: _p, limit: _l, ...restQuery } = req.query as Record<string, string>;
        const cacheKey = getBusinessDiamondsCacheKey(business.id, page, limit, JSON.stringify(restQuery));

        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return sendSuccess(res, JSON.parse(cached));
            }
        } catch (err) { console.error('[Redis] Get Error:', err); }

        const where: Record<string, unknown> = { businessId: business.id };
        if (req.query['shape']) where['shape'] = { in: (req.query['shape'] as string).split(',') };
        if (req.query['lab']) where['certificateLab'] = { in: (req.query['lab'] as string).split(',') };

        const [diamonds, total] = await Promise.all([
            prisma.diamond.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
            prisma.diamond.count({ where }),
        ]);

        const responseData = { diamonds, total, page, limit, totalPages: Math.ceil(total / limit) };
        redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 600).catch(e => console.error(e));

        sendSuccess(res, responseData);
    } catch (err) { next(err); }
});

/**
 * @route  GET /api/store/:slug/diamonds/:id
 * @desc   Diamond detail on storefront
 * @access Public
 * @returns { success, data: Diamond }
 * @errors 404 Business or Diamond not found
 */
router.get('/:slug/diamonds/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const slug = String(req.params['slug']);
        const id = String(req.params['id']);
        const business = await prisma.business.findUnique({ where: { slug } });
        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }
        const diamond = await prisma.diamond.findFirst({
            where: { id, businessId: business.id },
        });
        if (!diamond) {
            res.status(404).json({ success: false, error: 'Diamond not found' });
            return;
        }
        sendSuccess(res, diamond);
    } catch (err) { next(err); }
});

export default router;
