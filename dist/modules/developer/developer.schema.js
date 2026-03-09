"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiKeySchema = void 0;
const zod_1 = require("zod");
exports.createApiKeySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
    }),
});
