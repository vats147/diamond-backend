import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../utils/response';
import * as diamondService from './diamond.service';
import { AuthRequest } from '../../middleware/auth.middleware';

type MulterFiles = { [fieldname: string]: Express.Multer.File[] };

export const listDiamonds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await diamondService.listDiamonds(req.query as Record<string, string>);
        sendSuccess(res, data);
    } catch (err) { next(err); }
};

export const getDiamondById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await diamondService.getDiamondById(String(req.params['id']));
        sendSuccess(res, data);
    } catch (err) { next(err); }
};

export const createDiamond = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const files = (req.files as MulterFiles) || {};
        const data = await diamondService.createDiamond(req.body, {
            images: files['images'],
            video: files['video'],
            certificateFile: files['certificateFile'],
        });
        sendCreated(res, data, 'Diamond added to inventory');
    } catch (err) { next(err); }
};

export const updateDiamond = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const files = (req.files as MulterFiles) || {};
        const data = await diamondService.updateDiamond(
            String(req.params['id']),
            req.user!.businessId || '',
            req.user!.role,
            req.body,
            {
                images: files['images'],
                video: files['video'],
                certificateFile: files['certificateFile'],
            }
        );
        sendSuccess(res, data, 'Diamond updated');
    } catch (err) { next(err); }
};

export const deleteDiamond = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        await diamondService.deleteDiamond(
            String(req.params['id']),
            req.user!.businessId || '',
            req.user!.role
        );
        sendSuccess(res, null, 'Diamond deleted');
    } catch (err) { next(err); }
};

export const fetchByCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await diamondService.fetchByCertificate(req.body);
        sendSuccess(res, data);
    } catch (err) { next(err); }
};

export const extractCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const data = await diamondService.extractCertificate(file);
        sendSuccess(res, data);
    } catch (err) { next(err); }
};
