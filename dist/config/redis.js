"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorefrontCacheKey = exports.getBusinessDiamondsCacheKey = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("./env");
// Create a globally accessible Redis client
const redisClient = new ioredis_1.Redis(env_1.env.REDIS_URL, {
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
exports.default = redisClient;
/**
 * Helper to get a pre-fixed cache key for diamonds of a specific business
 */
const getBusinessDiamondsCacheKey = (businessId, page, limit, queryParams) => {
    return `diamonds:bus:${businessId}:p:${page}:l:${limit}:q:${queryParams}`;
};
exports.getBusinessDiamondsCacheKey = getBusinessDiamondsCacheKey;
/**
 * Helper to get cache key for the public storefront landing page
 */
const getStorefrontCacheKey = (businessSlug) => {
    return `storefront:slug:${businessSlug}`;
};
exports.getStorefrontCacheKey = getStorefrontCacheKey;
