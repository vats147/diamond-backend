import { Redis } from 'ioredis';
import { env } from './env';

// Create a globally accessible Redis client
const redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3) {
            console.warn('[Redis] Max retries reached, giving up.');
            return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redisClient.on('connect', () => {
    console.log('📦 Redis client connected successfully');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis client error:', err.message);
});

export default redisClient;

/**
 * Helper to get a pre-fixed cache key for diamonds of a specific business
 */
export const getBusinessDiamondsCacheKey = (businessId: string, page: number, limit: number, queryParams: string) => {
    return `diamonds:bus:${businessId}:p:${page}:l:${limit}:q:${queryParams}`;
};

/**
 * Helper to get cache key for the public storefront landing page
 */
export const getStorefrontCacheKey = (businessSlug: string) => {
    return `storefront:slug:${businessSlug}`;
};
