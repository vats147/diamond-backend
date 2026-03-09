"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const prisma_extension_1 = require("./prisma-extension");
const prismaClient = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
exports.prisma = prismaClient.$extends(prisma_extension_1.softDeleteExtension);
exports.default = exports.prisma;
