import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../config/jwt';

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        // Ensure user is still active in DB
        const dbUser = await import('../config/db').then(m => m.default.user.findUnique({
            where: { id: decoded.sub }
        }));

        if (!dbUser || !dbUser.isActive) {
            res.status(403).json({ success: false, error: 'User account is deactivated' });
            return;
        }

        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};

export const optionalAuthenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        const dbUser = await import('../config/db').then(m => m.default.user.findUnique({
            where: { id: decoded.sub }
        }));

        if (!dbUser || !dbUser.isActive) {
            res.status(403).json({ success: false, error: 'User account is deactivated' });
            return;
        }

        req.user = decoded;
        next();
    } catch {
        // Since it's optional, invalid token just means no user
        next();
    }
};
