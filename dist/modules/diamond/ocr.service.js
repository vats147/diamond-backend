"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCertificateData = void 0;
const tesseract_js_1 = require("tesseract.js");
const promises_1 = require("fs/promises");
const os_1 = require("os");
const path_1 = require("path");
const crypto_1 = require("crypto");
const extractField = (text, pattern) => {
    const match = text.match(pattern);
    return match?.[1]?.trim();
};
const parseCertificateText = (text) => ({
    certificateNumber: extractField(text, /Report\s*(?:No\.?|Number)[\s:]+(\d{9,12})/i),
    shape: extractField(text, /Shape\s*(?:and Cutting Style)?[\s:]+([A-Za-z ]+)/i),
    carat: extractField(text, /Carat\s*Weight[\s:]+(\d+\.\d+)/i),
    color: extractField(text, /Color\s*Grade[\s:]+([A-Z])\b/i),
    clarity: extractField(text, /Clarity\s*Grade[\s:]+([A-Z0-9]+)/i),
    cut: extractField(text, /Cut\s*Grade[\s:]+([A-Za-z ]+)/i),
    polish: extractField(text, /Polish[\s:]+([A-Za-z ]+)/i),
    symmetry: extractField(text, /Symmetry[\s:]+([A-Za-z ]+)/i),
    fluorescence: extractField(text, /Fluorescence[\s:]+([A-Za-z ]+)/i),
    measurements: extractField(text, /Measurements[\s:]+([\d\. \-x×]+)/i),
});
/**
 * OCR extraction using Tesseract.js (pure JS — no cloud credentials needed).
 * Writes the file buffer to a temp file, runs OCR, then cleans up.
 */
const extractCertificateData = async (fileBuffer, mimeType) => {
    const ext = mimeType === 'application/pdf' ? 'pdf' : 'png';
    const tmpPath = (0, path_1.join)((0, os_1.tmpdir)(), `cert-${(0, crypto_1.randomUUID)()}.${ext}`);
    try {
        await (0, promises_1.writeFile)(tmpPath, fileBuffer);
        const worker = await (0, tesseract_js_1.createWorker)('eng');
        const { data } = await worker.recognize(tmpPath);
        await worker.terminate();
        const rawText = data.text;
        const parsedData = parseCertificateText(rawText);
        // Tesseract gives per-character confidence (0-100); normalize to 0-1
        const confidence = (data.confidence ?? 50) / 100;
        return { ...parsedData, confidence: parseFloat(confidence.toFixed(2)) };
    }
    finally {
        // Always clean up temp file
        await (0, promises_1.unlink)(tmpPath).catch(() => { });
    }
};
exports.extractCertificateData = extractCertificateData;
