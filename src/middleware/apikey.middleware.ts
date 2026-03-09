import { Request, Response, NextFunction } from 'express';
import { hashApiKey } from '../modules/developer/developer.service';
import prisma from '../config/db';

export interface ApiKeyRequest extends Request {
    businessId?: string;
}

export const requireApiKey = async (
    req: ApiKeyRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const apiKeyHeader = req.headers['x-api-key'];

        if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
            res.status(401).json({ success: false, error: 'Missing or invalid x-api-key header' });
            return;
        }

        const keyHash = hashApiKey(apiKeyHeader);

        const keyRecord = await prisma.apiKey.findUnique({
            where: { keyHash },
            select: { id: true, businessId: true },
        });

        if (!keyRecord) {
            res.status(401).json({ success: false, error: 'Invalid API Key' });
            return;
        }

        // Update lastUsedAt asynchronously (don't block the request)
        prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() },
        }).catch((err: any) => console.error('[API Key Tracking Error]', err));

        // Attach business context to request
        req.businessId = keyRecord.businessId;

        next();
    } catch (err) {
        next(err);
    }
};
