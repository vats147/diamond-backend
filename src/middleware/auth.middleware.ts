import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../config/jwt';

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = verifyToken(token);
        next();
    } catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};
