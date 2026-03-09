import { z } from 'zod';

export const adminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const ownerLoginSchema = z.object({
    businessSlug: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(1),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;
