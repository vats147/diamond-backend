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
exports.revokeApiKey = exports.listApiKeys = exports.createApiKey = void 0;
const response_1 = require("../../utils/response");
const devService = __importStar(require("./developer.service"));
const createApiKey = async (req, res, next) => {
    try {
        const businessId = req.user.businessId;
        if (!businessId)
            throw Object.assign(new Error('Business ID missing'), { statusCode: 400 });
        const result = await devService.createApiKey(businessId, req.body);
        (0, response_1.sendSuccess)(res, result, 'API Key created securely. Copy the key now, it will not be shown again.', 201);
    }
    catch (err) {
        next(err);
    }
};
exports.createApiKey = createApiKey;
const listApiKeys = async (req, res, next) => {
    try {
        const businessId = req.user.businessId;
        if (!businessId)
            throw Object.assign(new Error('Business ID missing'), { statusCode: 400 });
        const result = await devService.listApiKeys(businessId);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.listApiKeys = listApiKeys;
const revokeApiKey = async (req, res, next) => {
    try {
        const businessId = req.user.businessId;
        if (!businessId)
            throw Object.assign(new Error('Business ID missing'), { statusCode: 400 });
        await devService.revokeApiKey(businessId, req.params['id']);
        (0, response_1.sendSuccess)(res, null, 'API Key completely revoked');
    }
    catch (err) {
        next(err);
    }
};
exports.revokeApiKey = revokeApiKey;
