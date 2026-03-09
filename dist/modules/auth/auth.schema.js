"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerLoginSchema = exports.adminLoginSchema = void 0;
const zod_1 = require("zod");
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.ownerLoginSchema = zod_1.z.object({
    businessSlug: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
