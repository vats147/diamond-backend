import prisma from '../../config/db';

export const getDashboardMetrics = async () => {
    const [
        totalBusinesses,
        totalDiamonds,
        totalUsers,
        totalInquiries,
        recentBusinesses,
        recentInquiries,
    ] = await Promise.all([
        prisma.business.count(),
        prisma.diamond.count(),
        prisma.user.count(),
        prisma.inquiry.count(),
        prisma.business.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, slug: true, createdAt: true },
        }),
        prisma.inquiry.findMany({
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

export const getSystemLogs = async (
    page: number = 1,
    limit: number = 20,
    filters?: { method?: string; statusCode?: number; search?: string }
) => {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.method) where.method = filters.method;
    if (filters?.statusCode) where.statusCode = filters.statusCode;
    if (filters?.search) {
        where.OR = [
            { path: { contains: filters.search, mode: 'insensitive' } },
            { userAgent: { contains: filters.search, mode: 'insensitive' } },
            { ip: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    const [logs, total] = await Promise.all([
        prisma.requestLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.requestLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};
