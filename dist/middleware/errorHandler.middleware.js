"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error('❌ Error:', err.message);
    let statusCode = err.statusCode || 500;
    let errorResponse = {
        success: false,
        error: err.message || 'Internal server error',
    };
    if (err.details) {
        errorResponse.details = err.details;
    }
    // Prisma unique constraint violation
    if (err.code === 'P2002') {
        statusCode = 409;
        const fields = err.meta?.target || 'field';
        errorResponse.error = 'Conflict: Record already exists';
        errorResponse.details = [{
                field: Array.isArray(fields) ? fields.join(', ') : String(fields),
                message: 'Must be unique'
            }];
    }
    // Prisma record not found
    else if (err.code === 'P2025') {
        statusCode = 404;
        errorResponse.error = 'Not found';
    }
    // JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorResponse.error = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorResponse.error = 'Token expired';
    }
    // Multer file error
    else if (err.name === 'MulterError') {
        statusCode = 400;
        errorResponse.error = 'Upload failed';
        errorResponse.details = [{ field: 'file', message: err.message }];
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
