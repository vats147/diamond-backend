import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import * as authService from './auth.service';
import { AdminLoginInput, OwnerLoginInput } from './auth.schema';

export const adminLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.adminLogin(req.body as AdminLoginInput);
        sendSuccess(res, result, 'Login successful');
    } catch (err) {
        next(err);
    }
};

export const ownerLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.ownerLogin(req.body as OwnerLoginInput);
        sendSuccess(res, result, 'Login successful');
    } catch (err) {
        next(err);
    }
};

export const logout = (_req: Request, res: Response): void => {
    sendSuccess(res, null, 'Logged out successfully');
};
