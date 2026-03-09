"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeApiKeyGlobally = exports.listAllApiKeys = exports.getSystemLogs = exports.getDashboardMetrics = void 0;
const db_1 = __importDefault(require("../../config/db"));
const getDashboardMetrics = async () => {
    const [totalBusinesses, totalDiamonds, totalUsers, totalInquiries, recentBusinesses, recentInquiries,] = await Promise.all([
        db_1.default.business.count(),
        db_1.default.diamond.count(),
        db_1.default.user.count(),
        db_1.default.inquiry.count(),
        db_1.default.business.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, slug: true, createdAt: true },
        }),
        db_1.default.inquiry.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                diamond: { select: { shape: true, carat: true, color: true, clarity: true } }
            },
        }),
    ]);
    return {
        totals: {
            businesses: totalBusinesses,
            diamonds: totalDiamonds,
            users: totalUsers,
            inquiries: totalInquiries,
        },
        recentActivity: {
            businesses: recentBusinesses,
            inquiries: recentInquiries,
        },
    };
};
exports.getDashboardMetrics = getDashboardMetrics;
const getSystemLogs = async (page = 1, limit = 20, filters) => {
    const skip = (page - 1) * limit;
    const where = {};
    if (filters?.method)
        where.method = filters.method;
    if (filters?.statusCode)
        where.statusCode = filters.statusCode;
    if (filters?.search) {
        where.OR = [
            { path: { contains: filters.search, mode: 'insensitive' } },
            { userAgent: { contains: filters.search, mode: 'insensitive' } },
            { ip: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [logs, total] = await Promise.all([
        db_1.default.requestLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        db_1.default.requestLog.count({ where }),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.getSystemLogs = getSystemLogs;
const listAllApiKeys = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [keys, total] = await Promise.all([
        db_1.default.apiKey.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                business: {
                    select: { name: true, slug: true }
                }
            }
        }),
        db_1.default.apiKey.count(),
    ]);
    return { keys, total, page, limit, totalPages: Math.ceil(total / limit) };
};
exports.listAllApiKeys = listAllApiKeys;
const revokeApiKeyGlobally = async (keyId) => {
    await db_1.default.apiKey.delete({ where: { id: keyId } });
};
exports.revokeApiKeyGlobally = revokeApiKeyGlobally;
