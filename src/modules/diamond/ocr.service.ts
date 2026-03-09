import { createWorker } from 'tesseract.js';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface ExtractedCertificateData {
    certificateNumber?: string;
    shape?: string;
    carat?: string;
    color?: string;
    clarity?: string;
    cut?: string;
    polish?: string;
    symmetry?: string;
    fluorescence?: string;
    measurements?: string;
    confidence?: number;
}

const extractField = (text: string, pattern: RegExp): string | undefined => {
    const match = text.match(pattern);
    return match?.[1]?.trim();
};

const parseCertificateText = (text: string): ExtractedCertificateData => ({
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
export const extractCertificateData = async (
    fileBuffer: Buffer,
    mimeType: string
): Promise<ExtractedCertificateData> => {
    const ext = mimeType === 'application/pdf' ? 'pdf' : 'png';
    const tmpPath = join(tmpdir(), `cert-${randomUUID()}.${ext}`);

    try {
        await writeFile(tmpPath, fileBuffer);

        const worker = await createWorker('eng');
        const { data } = await worker.recognize(tmpPath);
        await worker.terminate();

        const rawText = data.text;
        const parsedData = parseCertificateText(rawText);

        // Tesseract gives per-character confidence (0-100); normalize to 0-1
        const confidence = (data.confidence ?? 50) / 100;

        return { ...parsedData, confidence: parseFloat(confidence.toFixed(2)) };
    } finally {
        // Always clean up temp file
        await unlink(tmpPath).catch(() => { });
    }
};
