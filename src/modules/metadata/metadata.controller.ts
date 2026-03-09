import { Request, Response, NextFunction } from 'express';
import * as metadataService from './metadata.service';
import { sendSuccess } from '../../utils/response';

export const getMetadata = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const metadata = await metadataService.getMetadata();
        sendSuccess(res, metadata);
    } catch (err) {
        next(err);
    }
};

export const updateMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const updated = await metadataService.updateMetadata(req.body);
        sendSuccess(res, updated, 'Metadata updated successfully');
    } catch (err) {
        next(err);
    }
};
