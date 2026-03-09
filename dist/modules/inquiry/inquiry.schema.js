"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInquirySchema = void 0;
const zod_1 = require("zod");
exports.createInquirySchema = zod_1.z.object({
    businessId: zod_1.z.string().uuid(),
    diamondId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    message: zod_1.z.string().min(5),
});
