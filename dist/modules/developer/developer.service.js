"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeApiKey = exports.listApiKeys = exports.createApiKey = exports.hashApiKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../../config/db"));
/**
 * Helper to securely hash an API key for storage
 */
const hashApiKey = (key) => {
    return crypto_1.default.createHash('sha256').update(key).digest('hex');
};
exports.hashApiKey = hashApiKey;
/**
 * Generate a new API key for a business.
 * Returns the raw key ONLY ONCE. Cannot be retrieved again!
 */
const createApiKey = async (businessId, input) => {
    // Generate secure 32-byte hex string
    const rawKey = `dm_${crypto_1.default.randomBytes(32).toString('hex')}`;
    const keyHash = (0, exports.hashApiKey)(rawKey);
    const apiKey = await db_1.default.apiKey.create({
        data: {
            name: input.name,
            keyHash,
            businessId,
        },
        select: {
            id: true,
            name: true,
            createdAt: true,
            lastUsedAt: true,
        },
    });
    return {
        ...apiKey,
        key: rawKey, // ONLY RETURNED THIS ONE TIME
    };
};
exports.createApiKey = createApiKey;
/**
 * List all active API keys for a business.
 * Does NOT return the raw keys, only metadata.
 */
const listApiKeys = async (businessId) => {
    return db_1.default.apiKey.findMany({
        where: { businessId },
        select: {
            id: true,
            name: true,
            createdAt: true,
            lastUsedAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.listApiKeys = listApiKeys;
/**
 * Revoke (delete) an API key
 */
const revokeApiKey = async (businessId, keyId) => {
    const key = await db_1.default.apiKey.findFirst({
        where: { id: keyId, businessId },
    });
    if (!key)
        throw Object.assign(new Error('API Key not found'), { statusCode: 404 });
    await db_1.default.apiKey.delete({ where: { id: keyId } });
};
exports.revokeApiKey = revokeApiKey;
