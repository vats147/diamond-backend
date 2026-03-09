import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension({
    name: 'softDelete',
    query: {
        $allModels: {
            async findUnique({ args, query }) {
                if ((args as any).where) {
                    (args as any).where = { ...(args as any).where, deletedAt: null };
                }
                return query(args);
            },
            async findFirst({ args, query }) {
                if ((args as any).where) {
                    (args as any).where = { ...(args as any).where, deletedAt: null };
                }
                return query(args);
            },
            async findMany({ args, query }) {
                if ((args as any).where) {
                    (args as any).where = { ...(args as any).where, deletedAt: null };
                } else {
                    (args as any).where = { deletedAt: null };
                }
                return query(args);
            },
            async delete({ model, args, query }) {
                return (Prisma.getExtensionContext(model) as any).update({
                    where: args.where,
                    data: { deletedAt: new Date() },
                });
            },
            async deleteMany({ model, args, query }) {
                return (Prisma.getExtensionContext(model) as any).updateMany({
                    where: args.where,
                    data: { deletedAt: new Date() },
                });
            },
        },
    },
});
