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
const business_schema_1 = require("./business.schema");
const ctrl = __importStar(require("./business.controller"));
const router = (0, express_1.Router)();
/**
 * @route  GET /api/businesses
 * @desc   List all businesses
 * @access Super Admin
 * @returns { success, data: Business[] }
 * @errors 401 No token | 403 Not super admin
 */
// router.get('/check-slug/:slug', ctrl.checkSlugAvailability); // Moved to app.ts for debugging
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('SUPER_ADMIN'), ctrl.listBusinesses);
/**
 * @route  GET /api/businesses/slug/:slug/branding
 * @desc   Get branding by slug (public)
 * @access Public
 * @returns { success, data: { name, logoUrl, font, theme, whatsappNumber } }
 * @errors 404 Business not found
 */
router.get('/slug/:slug/branding', ctrl.getBranding);
/**
 * @route  GET /api/businesses/:id
 * @desc   Get business by ID
 * @access Super Admin
 * @returns { success, data: Business }
 * @errors 401 | 403 | 404
 */
router.get('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('SUPER_ADMIN'), ctrl.getBusinessById);
/**
 * @route  POST /api/businesses
 * @desc   Create new business + owner account
 * @access Super Admin
 * @body   multipart/form-data { name, contactNumber, ownerName, email, whatsappNumber, ownerPassword, logo?, font? }
 * @returns { success, data: Business }
 * @errors 400 Validation | 409 Duplicate email/slug | 401 | 403
 */
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('SUPER_ADMIN'), upload_middleware_1.upload.fields([{ name: 'logo', maxCount: 1 }]), (0, validate_middleware_1.validate)(business_schema_1.createBusinessSchema), ctrl.createBusiness);
/**
 * @route  PUT /api/businesses/:id
 * @desc   Update business details
 * @access Super Admin
 * @body   multipart/form-data (all fields optional, same as POST minus ownerPassword)
 * @returns { success, data: Business }
 * @errors 400 | 401 | 403 | 404
 */
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('SUPER_ADMIN'), upload_middleware_1.upload.fields([{ name: 'logo', maxCount: 1 }]), (0, validate_middleware_1.validate)(business_schema_1.updateBusinessSchema), ctrl.updateBusiness);
/**
 * @route  DELETE /api/businesses/:id
 * @desc   Delete a business and all its data
 * @access Super Admin
 * @returns { success, message: 'Business deleted' }
 * @errors 401 | 403 | 404
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('SUPER_ADMIN'), ctrl.deleteBusiness);
/**
 * @route  PUT /api/businesses/:id/theme
 * @desc   Set or update business theme
 * @access Super Admin
 * @body   { primaryColor?, secondaryColor?, accentColor?, font? }
 * @returns { success, data: Business }
 * @errors 400 | 401 | 403 | 404
 */
router.put('/:id/theme', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('SUPER_ADMIN'), (0, validate_middleware_1.validate)(business_schema_1.themeSchema), ctrl.setTheme);
/**
 * @route  POST /api/businesses/:id/users
 * @desc   Create an owner login account for a business
 * @access Super Admin
 * @body   { email, password }
 * @returns { success, data: { id, email, role, businessId } }
 * @errors 400 | 401 | 403 | 404 | 409
 */
router.post('/:id/users', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('SUPER_ADMIN'), // TODO: Also allow Business OWNER to manage their own users
(0, validate_middleware_1.validate)(business_schema_1.createOwnerUserSchema), ctrl.createOwnerUser);
/**
 * @route  DELETE /api/businesses/:id/users/:userId
 * @desc   Remove a user from a business
 * @access Super Admin or Business Owner
 * @returns { success, message: 'User removed' }
 * @errors 401 | 403 | 404
 */
router.delete('/:id/users/:userId', auth_middleware_1.authenticate, ctrl.removeUser);
exports.default = router;
