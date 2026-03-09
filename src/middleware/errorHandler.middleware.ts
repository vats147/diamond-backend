import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('❌ Error:', err.message);

    // Prisma unique constraint violation
    if ((err as any).code === 'P2002') {
        res.status(409).json({ success: false, error: 'Duplicate entry — record already exists' });
        return;
    }

    // Prisma record not found
    if ((err as any).code === 'P2025') {
        res.status(404).json({ success: false, error: 'Record not found' });
        return;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, error: 'Invalid token' });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, error: 'Token expired' });
        return;
    }

    // Multer file error
    if (err.name === 'MulterError') {
        res.status(400).json({ success: false, error: err.message });
        return;
    }

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
};
