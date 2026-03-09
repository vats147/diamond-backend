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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchIGICertificate = exports.fetchGIACertificate = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const env_1 = require("../../config/env");
const fetchGIACertificate = async (reportNumber) => {
    if (env_1.env.GIA_API_KEY) {
        try {
            const res = await axios_1.default.get(`https://api.gia.edu/report/${reportNumber}`, {
                headers: { Authorization: `Bearer ${env_1.env.GIA_API_KEY}` },
                timeout: 10000,
            });
            const d = res.data;
            return {
                certificateNumber: reportNumber,
                shape: d.shape_and_cutting_style,
                carat: parseFloat(d.carat_weight),
                color: d.color_grade,
                clarity: d.clarity_grade,
                cut: d.cut_grade,
                polish: d.polish,
                symmetry: d.symmetry,
                fluorescence: d.fluorescence_intensity,
                measurements: d.measurements,
            };
        }
        catch {
            // fall through to scrape
        }
    }
    // Fallback: scrape GIA public report check
    const res = await axios_1.default.get(`https://www.gia.edu/report-check-landing?reportno=${reportNumber}`, { timeout: 15000 });
    const $ = cheerio.load(res.data);
    return {
        certificateNumber: reportNumber,
        shape: $('[data-field="shape_and_cutting_style"]').text().trim() || undefined,
        carat: parseFloat($('[data-field="carat_weight"]').text()) || undefined,
        color: $('[data-field="color_grade"]').text().trim() || undefined,
        clarity: $('[data-field="clarity_grade"]').text().trim() || undefined,
        cut: $('[data-field="cut_grade"]').text().trim() || undefined,
        polish: $('[data-field="polish"]').text().trim() || undefined,
        symmetry: $('[data-field="symmetry"]').text().trim() || undefined,
        fluorescence: $('[data-field="fluorescence_intensity"]').text().trim() || undefined,
        measurements: $('[data-field="measurements"]').text().trim() || undefined,
    };
};
exports.fetchGIACertificate = fetchGIACertificate;
const fetchIGICertificate = async (reportNumber) => {
    const res = await axios_1.default.get(`https://www.igi.org/verify-your-report/?r=${reportNumber}`, { timeout: 15000 });
    const $ = cheerio.load(res.data);
    return {
        certificateNumber: reportNumber,
        shape: $('[class*="shape"]').first().text().trim() || undefined,
        carat: parseFloat($('[class*="carat"]').first().text()) || undefined,
        color: $('[class*="color"]').first().text().trim() || undefined,
        clarity: $('[class*="clarity"]').first().text().trim() || undefined,
        cut: $('[class*="cut"]').first().text().trim() || undefined,
        polish: $('[class*="polish"]').first().text().trim() || undefined,
        symmetry: $('[class*="symmetry"]').first().text().trim() || undefined,
        fluorescence: $('[class*="fluorescence"]').first().text().trim() || undefined,
        measurements: $('[class*="measurements"]').first().text().trim() || undefined,
    };
};
exports.fetchIGICertificate = fetchIGICertificate;
