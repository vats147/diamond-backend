"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCreated = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        ...(message && { message }),
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, statusCode = 500, details) => {
    const body = { success: false, error };
    if (details !== undefined)
        body.details = details;
    res.status(statusCode).json(body);
};
exports.sendError = sendError;
const sendCreated = (res, data, message) => {
    (0, exports.sendSuccess)(res, data, message, 201);
};
exports.sendCreated = sendCreated;
