import { z } from 'zod';

export const createDiamondSchema = z.object({
    businessId: z.string().uuid(),
    shape: z.string().min(1),
    carat: z.coerce.number().positive(),
    color: z.string().min(1),
    clarity: z.string().min(1),
    price: z.coerce.number().positive(),
    cut: z.string().optional(),
    polish: z.string().optional(),
    symmetry: z.string().optional(),
    fluorescence: z.string().optional(),
    measurements: z.string().optional(),
    certificateNumber: z.string().optional(),
    certificateLab: z.enum(['GIA', 'IGI', 'HRD', 'AGS', 'OTHER']).optional(),
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
