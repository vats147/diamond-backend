import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { JwtPayload } from '../config/jwt';

export const requireRole = (...roles: Array<JwtPayload['role']>) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
            return;
        }
        next();
    };
};

export const ownBusinessOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const { id, businessId } = req.params;
    const targetId = businessId || id;
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    if (req.user.role === 'SUPER_ADMIN') {
        next();
        return;
    }
    if (req.user.businessId !== targetId) {
        res.status(403).json({ success: false, error: 'Access denied: not your business' });
        return;
    }
    next();
};
