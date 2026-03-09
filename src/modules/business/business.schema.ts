import { z } from 'zod';

export const createBusinessSchema = z.object({
    name: z.string().min(2),
    contactNumber: z.string().min(5),
    ownerName: z.string().min(2),
    email: z.string().email(),
    whatsappNumber: z.string().min(5),
    address: z.string().min(5),
    gstNo: z.string().min(5),
    tagline: z.string().optional(),
    font: z.string().optional(),
    ownerPassword: z.string().min(6),
});

export const updateBusinessSchema = createBusinessSchema.partial().omit({ ownerPassword: true }).extend({
    planType: z.enum(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
    trialEndsAt: z.string().datetime().optional().nullable(),
    planEndsAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
});

export const themeSchema = z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    font: z.string().optional(),
});

export const createOwnerUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type ThemeInput = z.infer<typeof themeSchema>;
export type CreateOwnerUserInput = z.infer<typeof createOwnerUserSchema>;
