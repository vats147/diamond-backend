"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMetadata = exports.getMetadata = void 0;
const db_1 = __importDefault(require("../../config/db"));
const redis_1 = __importDefault(require("../../config/redis"));
const METADATA_CACHE_KEY = 'global:metadata';
const getMetadata = async () => {
    // Try cache first
    try {
        const cached = await redis_1.default.get(METADATA_CACHE_KEY);
        if (cached)
            return JSON.parse(cached);
    }
    catch (err) {
        console.error('[Redis] Metadata get error:', err);
    }
    let metadata = await db_1.default.metadata.findFirst();
    // If no metadata exists (first run), create one with defaults
    if (!metadata) {
        metadata = await db_1.default.metadata.create({
            data: {
                config: {
                    shapes: [{ code: 'ROUND', label: 'Round' }, { code: 'OVAL', label: 'Oval' }],
                    colors: [{ code: 'D', label: 'D - Colorless' }, { code: 'G', label: 'G - Near Colorless' }],
                    clarities: [{ code: 'FL', label: 'Flawless' }, { code: 'VS1', label: 'VS1' }],
                    cutGrades: [{ code: 'EX', label: 'Excellent' }, { code: 'VG', label: 'Very Good' }],
                    caratRanges: [{ code: '0.3-0.5', label: '0.30 - 0.49 ct' }, { code: '1.0-1.5', label: '1.00 - 1.49 ct' }],
                }
            }
        });
    }
    else if (!metadata.config) {
        // Migration block for older rows that had shapes, colors, etc as columns
        // Prisma dropped those columns in the schema, but they might be in MongoDB
        // We'll init an empty config so we don't crash, the user can reset in UI.
        metadata = await db_1.default.metadata.update({
            where: { id: metadata.id },
            data: { config: {} }
        });
    }
    // Set cache for 1 hour
    redis_1.default.set(METADATA_CACHE_KEY, JSON.stringify(metadata), 'EX', 3600).catch(err => {
        console.error('[Redis] Metadata set error:', err);
    });
    return metadata;
};
exports.getMetadata = getMetadata;
const updateMetadata = async (input) => {
    const existing = await db_1.default.metadata.findFirst();
    let updated;
    if (existing) {
        updated = await db_1.default.metadata.update({
            where: { id: existing.id },
            data: input,
        });
    }
    else {
        updated = await db_1.default.metadata.create({
            data: input,
        });
    }
    // Invalidate cache
    await redis_1.default.del(METADATA_CACHE_KEY).catch(() => { });
    return updated;
};
exports.updateMetadata = updateMetadata;
