import { Prisma } from '@prisma/client';

const deletedAtFilter = {
    OR: [
        { deletedAt: null },
        { deletedAt: { isSet: false } }
    ]
};

// Helper to apply soft delete filter to where clause
const applySoftDelete = (where: any) => {
    if (!where) return deletedAtFilter;

    // If it's already an AND array, just push to it
    if (where.AND && Array.isArray(where.AND)) {
        return {
            ...where,
            AND: [...where.AND, deletedAtFilter]
        };
    }

    return {
        ...where,
        AND: [deletedAtFilter]
    };
};

export const softDeleteExtension = (prismaClient: any) => Prisma.defineExtension({
    name: 'softDelete',
    query: {
        $allModels: {
            async findUnique({ model, args, query }) {
                const modelsWithSoftDelete = ['Business', 'User', 'Diamond', 'Inquiry', 'ApiKey', 'Metadata'];
                if (!modelsWithSoftDelete.includes(model)) return query(args);

                // For findUnique, we MUST use findFirst if we want to add non-unique filters
                // like 'deletedAt: null'.
                args.where = applySoftDelete(args.where) as any;
                return prismaClient[model].findFirst(args);
            },
            async findFirst({ model, args, query }) {
                const modelsWithSoftDelete = ['Business', 'User', 'Diamond', 'Inquiry', 'ApiKey', 'Metadata'];
                if (!modelsWithSoftDelete.includes(model)) return query(args);

                args.where = applySoftDelete(args.where) as any;
                return query(args);
            },
            async findMany({ model, args, query }) {
                const modelsWithSoftDelete = ['Business', 'User', 'Diamond', 'Inquiry', 'ApiKey', 'Metadata'];
                if (!modelsWithSoftDelete.includes(model)) return query(args);

                args.where = applySoftDelete(args.where) as any;
                return query(args);
            },
            async delete({ model, args, query }) {
                const modelsWithSoftDelete = ['Business', 'User', 'Diamond', 'Inquiry', 'ApiKey', 'Metadata'];
                if (!modelsWithSoftDelete.includes(model)) return query(args);

                return prismaClient[model].update({
                    where: args.where,
                    data: { deletedAt: new Date() },
                });
            },
            async deleteMany({ model, args, query }) {
                const modelsWithSoftDelete = ['Business', 'User', 'Diamond', 'Inquiry', 'ApiKey', 'Metadata'];
                if (!modelsWithSoftDelete.includes(model)) return query(args);

                args.where = applySoftDelete(args.where) as any;
                return prismaClient[model].updateMany({
                    where: args.where,
                    data: { deletedAt: new Date() },
                });
            },
        },
    },
});
