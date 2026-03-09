import { z } from 'zod';

export const createInquirySchema = z.object({
    businessId: z.string().uuid(),
    diamondId: z.string().uuid().optional(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    message: z.string().min(5),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
