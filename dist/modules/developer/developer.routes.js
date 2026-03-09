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
const developer_schema_1 = require("./developer.schema");
const ctrl = __importStar(require("./developer.controller"));
const router = (0, express_1.Router)();
// Developer panel endpoints require active Owner UI login
router.use(auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('OWNER'));
/**
 * @route   POST /api/developer/keys
 * @desc    Generate a new API Key for the business
 * @access  Owner
 * @body    { name: string }
 * @returns { success, data: { id, name, key, createdAt } }
 * @errors  400 Validation | 401 | 403
 */
router.post('/keys', (0, validate_middleware_1.validate)(developer_schema_1.createApiKeySchema), ctrl.createApiKey);
/**
 * @route   GET /api/developer/keys
 * @desc    List active API keys (metadata only)
 * @access  Owner
 * @returns { success, data: [ { id, name, createdAt, lastUsedAt } ] }
 * @errors  401 | 403
 */
router.get('/keys', ctrl.listApiKeys);
/**
 * @route   DELETE /api/developer/keys/:id
 * @desc    Revoke and delete an API key immediately
 * @access  Owner
 * @returns { success, message }
 * @errors  401 | 403 | 404
 */
router.delete('/keys/:id', ctrl.revokeApiKey);
exports.default = router;
