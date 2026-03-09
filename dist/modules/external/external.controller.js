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
exports.extDeleteDiamond = exports.extUpdateDiamond = exports.extCreateDiamond = exports.extListDiamonds = void 0;
const response_1 = require("../../utils/response");
const diamondService = __importStar(require("../diamond/diamond.service"));
const extListDiamonds = async (req, res, next) => {
    try {
        const queryParams = { ...req.query, businessId: req.businessId };
        const result = await diamondService.listDiamonds(queryParams);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.extListDiamonds = extListDiamonds;
const extCreateDiamond = async (req, res, next) => {
    try {
        const payload = { ...req.body, businessId: req.businessId };
        const result = await diamondService.createDiamond(payload, undefined, { images: [], certificateFile: [], video: [] });
        (0, response_1.sendSuccess)(res, result, 'Diamond created', 201);
    }
    catch (err) {
        next(err);
    }
};
exports.extCreateDiamond = extCreateDiamond;
const extUpdateDiamond = async (req, res, next) => {
    try {
        const diamondId = String(req.params['id']);
        // Passing 'OWNER' role ensures they can only update their own business's diamonds
        const result = await diamondService.updateDiamond(diamondId, req.businessId, 'OWNER', undefined, req.body, { images: [], certificateFile: [], video: [] });
        (0, response_1.sendSuccess)(res, result, 'Diamond updated');
    }
    catch (err) {
        next(err);
    }
};
exports.extUpdateDiamond = extUpdateDiamond;
const extDeleteDiamond = async (req, res, next) => {
    try {
        const diamondId = String(req.params['id']);
        await diamondService.deleteDiamond(diamondId, req.businessId, 'OWNER');
        (0, response_1.sendSuccess)(res, null, 'Diamond deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.extDeleteDiamond = extDeleteDiamond;
