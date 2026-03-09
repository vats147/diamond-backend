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
const apikey_middleware_1 = require("../../middleware/apikey.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
// We reuse the existing Zod validations, but we omit the explicit 'businessId' since the API key infers it securely
const diamond_schema_1 = require("../diamond/diamond.schema");
const ctrl = __importStar(require("./external.controller"));
const router = (0, express_1.Router)();
// ==========================================
// ALL ROUTES PROTECTED BY x-api-key
// ==========================================
router.use(apikey_middleware_1.requireApiKey);
/**
 * @route   GET /api/v1/diamonds
 * @desc    List all diamonds for the authorized business
 * @access  API Key
 */
router.get('/diamonds', ctrl.extListDiamonds);
/**
 * @route   POST /api/v1/diamonds
 * @desc    Create a new diamond programmatically
 * @access  API Key
 */
// Temporary hack: we are reusing createDiamondSchema which expects businessId,
// so our middleware/controller injects it, but the rigid validation requires it. We will bypass exact schema validate here if needed,
// or we validate the body and let the controller enforce the ID.
router.post('/diamonds', (req, res, next) => {
    // Inject businessId into the body so Zod validation passes, but we enforce it matches the API Key token inside the controller.
    req.body.businessId = req.businessId;
    next();
}, (0, validate_middleware_1.validate)(diamond_schema_1.createDiamondSchema), ctrl.extCreateDiamond);
/**
 * @route   PUT /api/v1/diamonds/:id
 * @desc    Update a diamond programmatically
 * @access  API Key
 */
router.put('/diamonds/:id', (0, validate_middleware_1.validate)(diamond_schema_1.updateDiamondSchema), ctrl.extUpdateDiamond);
/**
 * @route   DELETE /api/v1/diamonds/:id
 * @desc    Delete a diamond programmatically
 * @access  API Key
 */
router.delete('/diamonds/:id', ctrl.extDeleteDiamond);
exports.default = router;
