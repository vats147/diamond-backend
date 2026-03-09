"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOwnerUserSchema = exports.themeSchema = exports.updateBusinessSchema = exports.createBusinessSchema = void 0;
const zod_1 = require("zod");
exports.createBusinessSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    contactNumber: zod_1.z.string().min(5),
    ownerName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    whatsappNumber: zod_1.z.string().min(5),
    address: zod_1.z.string().optional(),
    gstNo: zod_1.z.string().optional(),
    tagline: zod_1.z.string().optional(),
    font: zod_1.z.string().optional(),
    ownerPassword: zod_1.z.string().min(6),
});
exports.updateBusinessSchema = exports.createBusinessSchema.partial().omit({ ownerPassword: true }).extend({
    planType: zod_1.z.enum(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
    trialEndsAt: zod_1.z.string().datetime().optional().nullable(),
    planEndsAt: zod_1.z.string().datetime().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.themeSchema = zod_1.z.object({
    primaryColor: zod_1.z.string().optional(),
    secondaryColor: zod_1.z.string().optional(),
    accentColor: zod_1.z.string().optional(),
    font: zod_1.z.string().optional(),
});
exports.createOwnerUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
