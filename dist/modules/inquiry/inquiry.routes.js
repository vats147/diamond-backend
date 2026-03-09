"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const inquiry_schema_1 = require("./inquiry.schema");
const ctrl = __importStar(require("./inquiry.controller"));
const router = (0, express_1.Router)();
/**
 * @route  POST /api/inquiries
 * @desc   Submit a client inquiry (public)
 * @access Public
 * @body   { businessId, diamondId?, name, email, phone?, message }
 * @returns { success, message: 'Inquiry submitted successfully' }
 * @sideEffects Sends email + WhatsApp notification to business owner
 * @errors 400 Validation | 404 Business not found
 */
router.post('/', (0, validate_middleware_1.validate)(inquiry_schema_1.createInquirySchema), ctrl.createInquiry);
/**
 * @route  GET /api/inquiries
 * @desc   List inquiries (owners see only their business; admin sees all)
 * @access Owner | Super Admin
 * @query  businessId?, diamondId?, page?, limit?
 * @returns { success, data: { inquiries[], total, page, limit, totalPages } }
 * @errors 401 | 403
 */
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER', 'SUPER_ADMIN'), ctrl.listInquiries);
/**
 * @route  GET /api/inquiries/:id
 * @desc   Get single inquiry
 * @access Owner (own business) | Super Admin
 * @returns { success, data: Inquiry }
 * @errors 401 | 403 | 404
 */
router.get('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER', 'SUPER_ADMIN'), ctrl.getInquiryById);
exports.default = router;
