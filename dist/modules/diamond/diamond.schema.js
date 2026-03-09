"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchByCertificateSchema = exports.updateDiamondSchema = exports.createDiamondSchema = void 0;
const zod_1 = require("zod");
exports.createDiamondSchema = zod_1.z.object({
    businessId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    shape: zod_1.z.string().min(1),
    carat: zod_1.z.coerce.number().positive(),
    color: zod_1.z.string().min(1),
    clarity: zod_1.z.string().min(1),
    price: zod_1.z.coerce.number().positive(),
    // Core grading
    cut: zod_1.z.string().optional(),
    polish: zod_1.z.string().optional(),
    symmetry: zod_1.z.string().optional(),
    fluorescence: zod_1.z.string().optional(),
    measurements: zod_1.z.string().optional(),
    // Advanced Proportions
    tablePercentage: zod_1.z.coerce.number().optional(),
    depthPercentage: zod_1.z.coerce.number().optional(),
    ratio: zod_1.z.coerce.number().optional(),
    length: zod_1.z.coerce.number().optional(),
    width: zod_1.z.coerce.number().optional(),
    depth: zod_1.z.coerce.number().optional(),
    // Visual
    shade: zod_1.z.string().optional(),
    luster: zod_1.z.string().optional(),
    culet: zod_1.z.string().optional(),
    heartsAndArrows: zod_1.z.string().optional(),
    // Inclusions
    tableInclusion: zod_1.z.string().optional(),
    sideInclusion: zod_1.z.string().optional(),
    tableBlack: zod_1.z.string().optional(),
    sideBlack: zod_1.z.string().optional(),
    extraFacet: zod_1.z.string().optional(),
    girdle: zod_1.z.string().optional(),
    tableOpen: zod_1.z.string().optional(),
    sideOpen: zod_1.z.string().optional(),
    // Logistics
    status: zod_1.z.enum(['AVAILABLE', 'HOLD', 'SOLD']).default('AVAILABLE').optional(),
    location: zod_1.z.string().optional(),
    earlyBird: zod_1.z.string().optional(),
    certificateNumber: zod_1.z.string().optional(),
    certificateLab: zod_1.z.enum(['GIA', 'IGI', 'HRD', 'AGS', 'JOB', 'GSI', 'OTHER']).optional(),
    uploadMethod: zod_1.z.enum(['CERTIFICATE_ID', 'CERTIFICATE_FILE', 'MANUAL']).default('MANUAL'),
});
exports.updateDiamondSchema = exports.createDiamondSchema.partial().omit({ businessId: true });
exports.fetchByCertificateSchema = zod_1.z.object({
    certificateNumber: zod_1.z.string().min(1),
    lab: zod_1.z.enum(['GIA', 'IGI']),
});
