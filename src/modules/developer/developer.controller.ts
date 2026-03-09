import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import * as devService from './developer.service';
import { CreateApiKeyInput } from './developer.schema';

export const createApiKey = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const businessId = req.user!.businessId;
        if (!businessId) throw Object.assign(new Error('Business ID missing'), { statusCode: 400 });

        const result = await devService.createApiKey(businessId, req.body as CreateApiKeyInput);
        sendSuccess(res, result, 'API Key created securely. Copy the key now, it will not be shown again.', 201);
    } catch (err) {
        next(err);
    }
};

export const listApiKeys = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const businessId = req.user!.businessId;
        if (!businessId) throw Object.assign(new Error('Business ID missing'), { statusCode: 400 });

        const result = await devService.listApiKeys(businessId);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

export const revokeApiKey = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const businessId = req.user!.businessId;
        if (!businessId) throw Object.assign(new Error('Business ID missing'), { statusCode: 400 });

        await devService.revokeApiKey(businessId, req.params['id'] as string);
        sendSuccess(res, null, 'API Key completely revoked');
    } catch (err) {
        next(err);
    }
};
