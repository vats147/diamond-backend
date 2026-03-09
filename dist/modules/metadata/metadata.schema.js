"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMetadataSchema = void 0;
const zod_1 = require("zod");
exports.updateMetadataSchema = zod_1.z.object({
    config: zod_1.z.record(zod_1.z.any()).optional(), // Accepts any key-value record (complex lists)
});
