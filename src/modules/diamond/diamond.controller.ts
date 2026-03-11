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

export const createDiamond = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const files = (req.files as MulterFiles) || {};
        const data = await diamondService.createDiamond(req.body, req.user?.sub, {
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
            req.user?.sub,
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

export const seedDiamonds = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user?.businessId) {
            res.status(400).json({ success: false, error: 'User does not belong to a business' });
            return;
        }
        const data = await diamondService.seedDiamonds(req.user.businessId, req.user.sub);
        sendSuccess(res, data, 'Successfully seeded 5 dummy diamonds');
    } catch (err) { next(err); }
};

export const bulkUpload = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            res.status(400).json({ success: false, error: 'No file uploaded. Please provide an .xlsx or .csv file.' });
            return;
        }
        if (!req.user?.businessId) {
            res.status(400).json({ success: false, error: 'User does not belong to a business' });
            return;
        }

        const data = await diamondService.bulkUploadDiamonds(req.user.businessId, file.buffer, req.user.sub);
        sendSuccess(res, data, `Successfully processed bulk upload`);
    } catch (err) { next(err); }
};

export const downloadCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { lab, certNo } = req.params;
        const pdfBuffer = await diamondService.getCertificatePdf(String(lab), String(certNo));
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="certificate_${certNo}.pdf"`);
        
        // Allow framing from the frontend
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:5174");
        res.setHeader('X-Frame-Options', 'ALLOWALL'); // For older browsers

        res.send(pdfBuffer);
    } catch (err) { next(err); }
};
