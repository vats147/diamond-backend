"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiKey = void 0;
const developer_service_1 = require("../modules/developer/developer.service");
const db_1 = __importDefault(require("../config/db"));
const requireApiKey = async (req, res, next) => {
    try {
        const apiKeyHeader = req.headers['x-api-key'];
        if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
            res.status(401).json({ success: false, error: 'Missing or invalid x-api-key header' });
            return;
        }
        const keyHash = (0, developer_service_1.hashApiKey)(apiKeyHeader);
        const keyRecord = await db_1.default.apiKey.findUnique({
            where: { keyHash },
            select: { id: true, businessId: true },
        });
        if (!keyRecord) {
            res.status(401).json({ success: false, error: 'Invalid API Key' });
            return;
        }
        // Update lastUsedAt asynchronously (don't block the request)
        db_1.default.apiKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() },
        }).catch((err) => console.error('[API Key Tracking Error]', err));
        // Attach business context to request
        req.businessId = keyRecord.businessId;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.requireApiKey = requireApiKey;
