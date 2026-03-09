import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated } from '../../utils/response';
import * as inquiryService from './inquiry.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const createInquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await inquiryService.createInquiry(req.body);
        sendCreated(res, data, 'Inquiry submitted successfully');
    } catch (err) { next(err); }
};

export const listInquiries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await inquiryService.listInquiries(
            req.query as Record<string, string>,
            req.user!.role,
            req.user!.businessId
        );
        sendSuccess(res, data);
    } catch (err) { next(err); }
};

export const getInquiryById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await inquiryService.getInquiryById(
            String(req.params['id']),
            req.user!.role,
            req.user!.businessId
        );
        sendSuccess(res, data);
    } catch (err) { next(err); }
};
