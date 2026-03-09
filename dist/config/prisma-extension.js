"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteExtension = void 0;
const client_1 = require("@prisma/client");
exports.softDeleteExtension = client_1.Prisma.defineExtension({
    name: 'softDelete',
    query: {
        $allModels: {
            async findUnique({ args, query }) {
                if (args.where) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findFirst({ args, query }) {
                if (args.where) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findMany({ args, query }) {
                if (args.where) {
                    args.where = { ...args.where, deletedAt: null };
                }
                else {
                    args.where = { deletedAt: null };
                }
                return query(args);
            },
            async delete({ model, args, query }) {
                return client_1.Prisma.getExtensionContext(model).update({
                    where: args.where,
                    data: { deletedAt: new Date() },
                });
            },
            async deleteMany({ model, args, query }) {
                return client_1.Prisma.getExtensionContext(model).updateMany({
                    where: args.where,
                    data: { deletedAt: new Date() },
                });
            },
        },
    },
});
