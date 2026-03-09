import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/db';

/**
 * HTTP request logger middleware.
 * Logs every request to the console AND saves it to the RequestLog collection in MongoDB.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
        const responseTime = Date.now() - start;
        const user = (req as AuthRequest).user;
        const statusCode = res.statusCode;
        const method = req.method;
        const path = req.path;
        const ip = req.ip || req.socket?.remoteAddress;
        const userAgent = req.get('user-agent');

        // Console output with color-coded status
        const color =
            statusCode >= 500 ? '\x1b[31m' : // red
                statusCode >= 400 ? '\x1b[33m' : // yellow
                    statusCode >= 300 ? '\x1b[36m' : // cyan
                        '\x1b[32m';                       // green

        console.log(
            `${color}[${new Date().toISOString()}] ${method} ${path} ${statusCode} ${responseTime}ms\x1b[0m` +
            (user ? ` | user=${user.sub} role=${user.role}` : '') +
            (ip ? ` | ip=${ip}` : '')
        );

        // Persist to DB (fire-and-forget)
        prisma.requestLog
            .create({
                data: {
                    method,
                    path,
                    statusCode,
                    responseTime,
                    ip: ip || null,
                    userId: user?.sub || null,
                    userRole: user?.role || null,
                    userAgent: userAgent || null,
                },
            })
            .catch((err: Error) => console.error('Failed to save request log:', err.message));
    });

    next();
};
