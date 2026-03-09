import prisma from '../../config/db';
import redisClient from '../../config/redis';
import { UpdateMetadataInput } from './metadata.schema';

const METADATA_CACHE_KEY = 'global:metadata';

export const getMetadata = async () => {
    // Try cache first
    try {
        const cached = await redisClient.get(METADATA_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (err) {
        console.error('[Redis] Metadata get error:', err);
    }

    let metadata = await prisma.metadata.findFirst();

    // If no metadata exists (first run), create one with defaults
    if (!metadata) {
        metadata = await prisma.metadata.create({
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
    } else if (!metadata.config) {
        // Migration block for older rows that had shapes, colors, etc as columns
        // Prisma dropped those columns in the schema, but they might be in MongoDB
        // We'll init an empty config so we don't crash, the user can reset in UI.
        metadata = await prisma.metadata.update({
            where: { id: metadata.id },
            data: { config: {} }
        });
    }

    // Set cache for 1 hour
    redisClient.set(METADATA_CACHE_KEY, JSON.stringify(metadata), 'EX', 3600).catch(err => {
        console.error('[Redis] Metadata set error:', err);
    });

    return metadata;
};

export const updateMetadata = async (input: UpdateMetadataInput) => {
    const existing = await prisma.metadata.findFirst();

    let updated;
    if (existing) {
        updated = await prisma.metadata.update({
            where: { id: existing.id },
            data: input,
        });
    } else {
        updated = await prisma.metadata.create({
            data: input,
        });
    }

    // Invalidate cache
    await redisClient.del(METADATA_CACHE_KEY).catch(() => { });

    return updated;
};
