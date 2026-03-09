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
exports.checkSlugAvailability = exports.removeUser = exports.createOwnerUser = exports.getBranding = exports.setTheme = exports.deleteBusiness = exports.updateBusiness = exports.createBusiness = exports.getBusinessById = exports.listBusinesses = void 0;
const response_1 = require("../../utils/response");
const businessService = __importStar(require("./business.service"));
const listBusinesses = async (_req, res, next) => {
    try {
        const data = await businessService.listBusinesses();
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
};
exports.listBusinesses = listBusinesses;
const getBusinessById = async (req, res, next) => {
    try {
        const data = await businessService.getBusinessById(String(req.params['id']));
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
};
exports.getBusinessById = getBusinessById;
const createBusiness = async (req, res, next) => {
    try {
        const files = req.files;
        const logoFile = files?.['logo']?.[0];
        const input = { ...req.body };
        if (typeof input.theme === 'string') {
            try {
                input.theme = JSON.parse(input.theme);
            }
            catch (e) { /* ignore */ }
        }
        const data = await businessService.createBusiness(input, logoFile?.buffer);
        (0, response_1.sendCreated)(res, data, 'Business created successfully');
    }
    catch (err) {
        next(err);
    }
};
exports.createBusiness = createBusiness;
const updateBusiness = async (req, res, next) => {
    try {
        const files = req.files;
        const logoFile = files?.['logo']?.[0];
        const input = { ...req.body };
        if (typeof input.theme === 'string') {
            try {
                input.theme = JSON.parse(input.theme);
            }
            catch (e) { /* ignore */ }
        }
        const data = await businessService.updateBusiness(String(req.params['id']), input, logoFile?.buffer);
        (0, response_1.sendSuccess)(res, data, 'Business updated');
    }
    catch (err) {
        next(err);
    }
};
exports.updateBusiness = updateBusiness;
const deleteBusiness = async (req, res, next) => {
    try {
        await businessService.deleteBusiness(String(req.params['id']));
        (0, response_1.sendSuccess)(res, null, 'Business deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteBusiness = deleteBusiness;
const setTheme = async (req, res, next) => {
    try {
        const data = await businessService.setTheme(String(req.params['id']), req.body);
        (0, response_1.sendSuccess)(res, data, 'Theme updated');
    }
    catch (err) {
        next(err);
    }
};
exports.setTheme = setTheme;
const getBranding = async (req, res, next) => {
    try {
        const data = await businessService.getBranding(String(req.params['slug']));
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
};
exports.getBranding = getBranding;
const createOwnerUser = async (req, res, next) => {
    try {
        const data = await businessService.createOwnerUser(String(req.params['id']), req.body);
        (0, response_1.sendCreated)(res, data, 'Owner account created');
    }
    catch (err) {
        next(err);
    }
};
exports.createOwnerUser = createOwnerUser;
const removeUser = async (req, res, next) => {
    try {
        const actingUser = req.user;
        await businessService.removeUser(String(req.params['id']), String(req.params['userId']), actingUser);
        (0, response_1.sendSuccess)(res, null, 'User removed successfully');
    }
    catch (err) {
        next(err);
    }
};
exports.removeUser = removeUser;
const checkSlugAvailability = async (req, res, next) => {
    console.log('DEBUG: checkSlugAvailability called with slug:', req.params['slug']);
    try {
        const slug = String(req.params['slug']);
        const isAvailable = await businessService.checkSlugAvailability(slug);
        (0, response_1.sendSuccess)(res, { isAvailable });
    }
    catch (err) {
        next(err);
    }
};
exports.checkSlugAvailability = checkSlugAvailability;
