import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import * as adminService from './admin.service';

export const getDashboardMetrics = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const metrics = await adminService.getDashboardMetrics();
        sendSuccess(res, metrics);
    } catch (err) {
        next(err);
    }
};

export const getSystemLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        const filters = {
            method: req.query.method as string,
            statusCode: req.query.statusCode ? parseInt(req.query.statusCode as string) : undefined,
            search: req.query.search as string,
        };

        const result = await adminService.getSystemLogs(page, limit, filters);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};
