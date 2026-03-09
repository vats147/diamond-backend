import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../utils/response';
import * as businessService from './business.service';

export const listBusinesses = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await businessService.listBusinesses();
        sendSuccess(res, data);
    } catch (err) { next(err); }
};

export const getBusinessById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await businessService.getBusinessById(String(req.params['id']));
        sendSuccess(res, data);
    } catch (err) { next(err); }
};

export const createBusiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const logoFile = files?.['logo']?.[0];
        const data = await businessService.createBusiness(req.body, logoFile?.buffer);
        sendCreated(res, data, 'Business created successfully');
    } catch (err) { next(err); }
};

export const updateBusiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const logoFile = files?.['logo']?.[0];
        const data = await businessService.updateBusiness(String(req.params['id']), req.body, logoFile?.buffer);
        sendSuccess(res, data, 'Business updated');
    } catch (err) { next(err); }
};

export const deleteBusiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await businessService.deleteBusiness(String(req.params['id']));
        sendSuccess(res, null, 'Business deleted');
    } catch (err) { next(err); }
};

export const setTheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await businessService.setTheme(String(req.params['id']), req.body);
        sendSuccess(res, data, 'Theme updated');
    } catch (err) { next(err); }
};

export const getBranding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await businessService.getBranding(String(req.params['slug']));
        sendSuccess(res, data);
    } catch (err) { next(err); }
};

export const createOwnerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await businessService.createOwnerUser(String(req.params['id']), req.body);
        sendCreated(res, data, 'Owner account created');
    } catch (err) { next(err); }
};
