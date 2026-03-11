import { z } from 'zod';

export const createDiamondSchema = z.object({
    businessId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    shape: z.string().min(1),
    carat: z.coerce.number().positive(),
    color: z.string().min(1),
    clarity: z.string().min(1),
    price: z.coerce.number().nonnegative(),

    // Core grading
    cut: z.string().optional(),
    polish: z.string().optional(),
    symmetry: z.string().optional(),
    fluorescence: z.string().optional(),
    measurements: z.string().optional(),

    // Advanced Proportions
    tablePercentage: z.coerce.number().optional(),
    depthPercentage: z.coerce.number().optional(),
    ratio: z.coerce.number().optional(),
    length: z.coerce.number().optional(),
    width: z.coerce.number().optional(),
    depth: z.coerce.number().optional(),

    // Visual
    shade: z.string().optional(),
    luster: z.string().optional(),
    culet: z.string().optional(),
    heartsAndArrows: z.string().optional(),

    // Inclusions
    tableInclusion: z.string().optional(),
    sideInclusion: z.string().optional(),
    tableBlack: z.string().optional(),
    sideBlack: z.string().optional(),
    extraFacet: z.string().optional(),
    girdle: z.string().optional(),
    tableOpen: z.string().optional(),
    sideOpen: z.string().optional(),

    // Logistics
    status: z.enum(['AVAILABLE', 'HOLD', 'SOLD', 'ON_HOLD', 'OFF_MARKET']).default('AVAILABLE').optional(),
    location: z.string().optional(),
    earlyBird: z.string().optional(),

    // Media
    images: z.array(z.string().url()).optional().default([]),
    videoUrl: z.string().url().optional().or(z.literal('')),

    certificateNumber: z.string().optional(),
    certificateLab: z.enum(['GIA', 'IGI', 'HRD', 'AGS', 'JOB', 'GSI', 'OTHER']).optional(),
    uploadMethod: z.enum(['CERTIFICATE_ID', 'CERTIFICATE_FILE', 'MANUAL']).default('MANUAL'),
});

export const updateDiamondSchema = createDiamondSchema.partial().omit({ businessId: true });

export const fetchByCertificateSchema = z.object({
    certificateNumber: z.string().min(1),
    lab: z.enum(['GIA', 'IGI']),
});

export type CreateDiamondInput = z.infer<typeof createDiamondSchema>;
export type UpdateDiamondInput = z.infer<typeof updateDiamondSchema>;
export type FetchByCertificateInput = z.infer<typeof fetchByCertificateSchema>;
