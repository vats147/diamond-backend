import { z } from 'zod';

export const updateMetadataSchema = z.object({
    config: z.record(z.any()).optional(), // Accepts any key-value record (complex lists)
});

export type UpdateMetadataInput = z.infer<typeof updateMetadataSchema>;
