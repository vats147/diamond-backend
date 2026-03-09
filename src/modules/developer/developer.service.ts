import crypto from 'crypto';
import prisma from '../../config/db';
import { CreateApiKeyInput } from './developer.schema';

/**
 * Helper to securely hash an API key for storage
 */
export const hashApiKey = (key: string) => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Generate a new API key for a business.
 * Returns the raw key ONLY ONCE. Cannot be retrieved again!
 */
export const createApiKey = async (businessId: string, input: CreateApiKeyInput) => {
    // Generate secure 32-byte hex string
    const rawKey = `dm_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(rawKey);

    const apiKey = await prisma.apiKey.create({
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

/**
 * List all active API keys for a business.
 * Does NOT return the raw keys, only metadata.
 */
export const listApiKeys = async (businessId: string) => {
    return prisma.apiKey.findMany({
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

/**
 * Revoke (delete) an API key
 */
export const revokeApiKey = async (businessId: string, keyId: string) => {
    const key = await prisma.apiKey.findFirst({
        where: { id: keyId, businessId },
    });

    if (!key) throw Object.assign(new Error('API Key not found'), { statusCode: 404 });

    await prisma.apiKey.delete({ where: { id: keyId } });
};
