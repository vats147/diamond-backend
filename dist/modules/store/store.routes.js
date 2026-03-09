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
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const response_1 = require("../../utils/response");
const redis_1 = __importStar(require("../../config/redis"));
const router = (0, express_1.Router)();
/**
 * @route  GET /api/store/:slug
 * @desc   Get public business profile + first page of diamonds (optimised for storefront)
 * @access Public
 * @returns { success, data: { business, diamonds[], total } }
 * @errors 404 Business not found
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const slug = String(req.params['slug']);
        const cacheKey = (0, redis_1.getStorefrontCacheKey)(slug);
        try {
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                return (0, response_1.sendSuccess)(res, JSON.parse(cached));
            }
        }
        catch (err) {
            console.error('[Redis] Get Error:', err);
        }
        const business = await db_1.default.business.findUnique({
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
            db_1.default.diamond.findMany({
                where: { businessId: business.id },
                take: 50,
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.diamond.count({ where: { businessId: business.id } }),
        ]);
        const { id: _id, ...publicBusiness } = business;
        const responseData = { business: publicBusiness, diamonds, total };
        // Cache for 1 hour
        redis_1.default.set(cacheKey, JSON.stringify(responseData), 'EX', 3600).catch(err => console.error('[Redis] Set error:', err));
        (0, response_1.sendSuccess)(res, responseData);
    }
    catch (err) {
        next(err);
    }
});
/**
 * @route  GET /api/store/:slug/diamonds
 * @desc   Paginated diamonds for a storefront
 * @access Public
 * @query  page?, limit?, sortBy?, sortOrder?, shape?, lab?
 * @returns { success, data: { diamonds[], total, page, limit, totalPages } }
 * @errors 404 Business not found
 */
router.get('/:slug/diamonds', async (req, res, next) => {
    try {
        const slug = String(req.params['slug']);
        const business = await db_1.default.business.findUnique({ where: { slug } });
        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }
        const page = parseInt(req.query['page'] || '1');
        const limit = Math.min(parseInt(req.query['limit'] || '50'), 100);
        const skip = (page - 1) * limit;
        const sortBy = req.query['sortBy'] || 'createdAt';
        const sortOrder = req.query['sortOrder'] === 'asc' ? 'asc' : 'desc';
        const { page: _p, limit: _l, ...restQuery } = req.query;
        const cacheKey = (0, redis_1.getBusinessDiamondsCacheKey)(business.id, page, limit, JSON.stringify(restQuery));
        try {
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                return (0, response_1.sendSuccess)(res, JSON.parse(cached));
            }
        }
        catch (err) {
            console.error('[Redis] Get Error:', err);
        }
        const where = { businessId: business.id };
        if (req.query['shape'])
            where['shape'] = { in: req.query['shape'].split(',') };
        if (req.query['lab'])
            where['certificateLab'] = { in: req.query['lab'].split(',') };
        const [diamonds, total] = await Promise.all([
            db_1.default.diamond.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
            db_1.default.diamond.count({ where }),
        ]);
        const responseData = { diamonds, total, page, limit, totalPages: Math.ceil(total / limit) };
        redis_1.default.set(cacheKey, JSON.stringify(responseData), 'EX', 600).catch(e => console.error(e));
        (0, response_1.sendSuccess)(res, responseData);
    }
    catch (err) {
        next(err);
    }
});
/**
 * @route  GET /api/store/:slug/diamonds/:id
 * @desc   Diamond detail on storefront
 * @access Public
 * @returns { success, data: Diamond }
 * @errors 404 Business or Diamond not found
 */
router.get('/:slug/diamonds/:id', async (req, res, next) => {
    try {
        const slug = String(req.params['slug']);
        const id = String(req.params['id']);
        const business = await db_1.default.business.findUnique({ where: { slug } });
        if (!business) {
            res.status(404).json({ success: false, error: 'Business not found' });
            return;
        }
        const diamond = await db_1.default.diamond.findFirst({
            where: { id, businessId: business.id },
        });
        if (!diamond) {
            res.status(404).json({ success: false, error: 'Diamond not found' });
            return;
        }
        (0, response_1.sendSuccess)(res, diamond);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
