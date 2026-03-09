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
exports.revokeApiKeyGlobally = exports.listAllApiKeys = exports.getSystemLogs = exports.getDashboardMetrics = void 0;
const response_1 = require("../../utils/response");
const adminService = __importStar(require("./admin.service"));
const getDashboardMetrics = async (_req, res, next) => {
    try {
        const metrics = await adminService.getDashboardMetrics();
        (0, response_1.sendSuccess)(res, metrics);
    }
    catch (err) {
        next(err);
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
const getSystemLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const filters = {
            method: req.query.method,
            statusCode: req.query.statusCode ? parseInt(req.query.statusCode) : undefined,
            search: req.query.search,
        };
        const result = await adminService.getSystemLogs(page, limit, filters);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getSystemLogs = getSystemLogs;
const listAllApiKeys = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const result = await adminService.listAllApiKeys(page, limit);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.listAllApiKeys = listAllApiKeys;
const revokeApiKeyGlobally = async (req, res, next) => {
    try {
        const id = req.params['id'];
        await adminService.revokeApiKeyGlobally(id);
        (0, response_1.sendSuccess)(res, null, 'API Key revoked globally');
    }
    catch (err) {
        next(err);
    }
};
exports.revokeApiKeyGlobally = revokeApiKeyGlobally;
