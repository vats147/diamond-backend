import { Response } from 'express';

export const sendSuccess = (
    res: Response,
    data: unknown,
    message?: string,
    statusCode = 200
): void => {
    res.status(statusCode).json({
        success: true,
        ...(message && { message }),
        data,
    });
};

export const sendError = (
    res: Response,
    error: string,
    statusCode = 500,
    details?: unknown
): void => {
    const body: Record<string, unknown> = { success: false, error };
    if (details !== undefined) body.details = details;
    res.status(statusCode).json(body);
};

export const sendCreated = (res: Response, data: unknown, message?: string): void => {
    sendSuccess(res, data, message, 201);
};
