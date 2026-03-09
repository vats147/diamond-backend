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
exports.extractCertificate = exports.fetchByCertificate = exports.deleteDiamond = exports.updateDiamond = exports.createDiamond = exports.getDiamondById = exports.listDiamonds = void 0;
const response_1 = require("../../utils/response");
const diamondService = __importStar(require("./diamond.service"));
const listDiamonds = async (req, res, next) => {
    try {
        const data = await diamondService.listDiamonds(req.query);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
};
exports.listDiamonds = listDiamonds;
const getDiamondById = async (req, res, next) => {
    try {
        const data = await diamondService.getDiamondById(String(req.params['id']));
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
};
exports.getDiamondById = getDiamondById;
const createDiamond = async (req, res, next) => {
    try {
        const files = req.files || {};
        const data = await diamondService.createDiamond(req.body, req.user?.sub, {
            images: files['images'],
            video: files['video'],
            certificateFile: files['certificateFile'],
        });
        (0, response_1.sendCreated)(res, data, 'Diamond added to inventory');
    }
    catch (err) {
        next(err);
    }
};
exports.createDiamond = createDiamond;
const updateDiamond = async (req, res, next) => {
    try {
        const files = req.files || {};
        const data = await diamondService.updateDiamond(String(req.params['id']), req.user.businessId || '', req.user.role, req.user?.sub, req.body, {
            images: files['images'],
            video: files['video'],
            certificateFile: files['certificateFile'],
        });
        (0, response_1.sendSuccess)(res, data, 'Diamond updated');
    }
    catch (err) {
        next(err);
    }
};
exports.updateDiamond = updateDiamond;
const deleteDiamond = async (req, res, next) => {
    try {
        await diamondService.deleteDiamond(String(req.params['id']), req.user.businessId || '', req.user.role);
        (0, response_1.sendSuccess)(res, null, 'Diamond deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteDiamond = deleteDiamond;
const fetchByCertificate = async (req, res, next) => {
    try {
        const data = await diamondService.fetchByCertificate(req.body);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
};
exports.fetchByCertificate = fetchByCertificate;
const extractCertificate = async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const data = await diamondService.extractCertificate(file);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
};
exports.extractCertificate = extractCertificate;
