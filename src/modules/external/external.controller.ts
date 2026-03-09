import { Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { ApiKeyRequest } from '../../middleware/apikey.middleware';
import * as diamondService from '../diamond/diamond.service';

export const extListDiamonds = async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const queryParams = { ...req.query, businessId: req.businessId! } as Record<string, string>;
        const result = await diamondService.listDiamonds(queryParams);
        sendSuccess(res, result);
    } catch (err) { next(err); }
};

export const extCreateDiamond = async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const payload = { ...req.body, businessId: req.businessId! };
        const result = await diamondService.createDiamond(payload, undefined, { images: [], certificateFile: [], video: [] });
        sendSuccess(res, result, 'Diamond created', 201);
    } catch (err) { next(err); }
};

export const extUpdateDiamond = async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const diamondId = String(req.params['id']);
        // Passing 'OWNER' role ensures they can only update their own business's diamonds
        const result = await diamondService.updateDiamond(diamondId, req.businessId!, 'OWNER', undefined, req.body, { images: [], certificateFile: [], video: [] });
        sendSuccess(res, result, 'Diamond updated');
    } catch (err) { next(err); }
};

export const extDeleteDiamond = async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const diamondId = String(req.params['id']);
        await diamondService.deleteDiamond(diamondId, req.businessId!, 'OWNER');
        sendSuccess(res, null, 'Diamond deleted');
    } catch (err) { next(err); }
};
