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
const upload_middleware_1 = require("../../middleware/upload.middleware");
const diamond_schema_1 = require("./diamond.schema");
const ctrl = __importStar(require("./diamond.controller"));
const router = (0, express_1.Router)();
/**
 * @route  GET /api/diamonds
 * @desc   List diamonds with filters + pagination
 * @access Public (storefront) or Owner (management)
 * @query  businessId (required), shape, colorMin, colorMax, caratMin, caratMax,
 *         clarities, priceMin, priceMax, lab, search, page, limit, sortBy, sortOrder
 * @returns { success, data: { diamonds[], total, page, limit, totalPages } }
 * @errors 400 Missing businessId
 */
router.get('/', ctrl.listDiamonds);
/**
 * @route  POST /api/diamonds/fetch-by-certificate
 * @desc   Fetch diamond data from GIA or IGI by certificate number
 * @access Owner | Super Admin
 * @body   { certificateNumber: string, lab: 'GIA' | 'IGI' }
 * @returns { success, data: { certificateNumber, shape, carat, color, clarity, ... } }
 * @errors 400 Validation | 401 | 403 | 422 Fetch failed
 */
router.post('/fetch-by-certificate', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER', 'SUPER_ADMIN'), (0, validate_middleware_1.validate)(diamond_schema_1.fetchByCertificateSchema), ctrl.fetchByCertificate);
/**
 * @route  POST /api/diamonds/extract-certificate
 * @desc   Upload certificate file (PDF/image) and extract data via OCR
 * @access Owner | Super Admin
 * @body   multipart/form-data { certificate: file }
 * @returns { success, data: { certificateNumber, shape, carat, ..., confidence } }
 * @errors 400 No file | 401 | 403 | 422 Extraction failed
 */
router.post('/extract-certificate', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER', 'SUPER_ADMIN'), upload_middleware_1.upload.single('certificate'), ctrl.extractCertificate);
/**
 * @route  GET /api/diamonds/:id
 * @desc   Get single diamond by ID
 * @access Public
 * @returns { success, data: Diamond }
 * @errors 404 Not found
 */
router.get('/:id', ctrl.getDiamondById);
/**
 * @route  POST /api/diamonds
 * @desc   Add diamond to inventory
 * @access Owner | Super Admin
 * @body   multipart/form-data { businessId, shape, carat, color, clarity, price,
 *         uploadMethod, cut?, polish?, symmetry?, fluorescence?, measurements?,
 *         certificateNumber?, certificateLab?, certificateFile?, images?, video? }
 * @returns { success, data: Diamond }
 * @errors 400 Validation | 401 | 403
 */
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER', 'SUPER_ADMIN'), upload_middleware_1.upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 },
    { name: 'certificateFile', maxCount: 1 },
]), (0, validate_middleware_1.validate)(diamond_schema_1.createDiamondSchema), ctrl.createDiamond);
/**
 * @route  PUT /api/diamonds/:id
 * @desc   Update diamond (owners may only update their own diamonds)
 * @access Owner (own business) | Super Admin
 * @body   multipart/form-data (all fields optional)
 * @returns { success, data: Diamond }
 * @errors 400 | 401 | 403 | 404
 */
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER', 'SUPER_ADMIN'), upload_middleware_1.upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 },
    { name: 'certificateFile', maxCount: 1 },
]), (0, validate_middleware_1.validate)(diamond_schema_1.updateDiamondSchema), ctrl.updateDiamond);
/**
 * @route  DELETE /api/diamonds/:id
 * @desc   Delete a diamond (owners may only delete their own diamonds)
 * @access Owner (own business) | Super Admin
 * @returns { success, message: 'Diamond deleted' }
 * @errors 401 | 403 | 404
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER', 'SUPER_ADMIN'), ctrl.deleteDiamond);
exports.default = router;
