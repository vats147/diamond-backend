import axios from 'axios';
import * as cheerio from 'cheerio';
import { env } from '../../config/env';

interface CertificateData {
    certificateNumber: string;
    shape?: string;
    carat?: number;
    color?: string;
    clarity?: string;
    cut?: string;
    polish?: string;
    symmetry?: string;
    fluorescence?: string;
    measurements?: string;
}

export const fetchGIACertificate = async (reportNumber: string): Promise<CertificateData> => {
    if (env.GIA_API_KEY) {
        try {
            const res = await axios.get(`https://api.gia.edu/report/${reportNumber}`, {
                headers: { Authorization: `Bearer ${env.GIA_API_KEY}` },
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
        } catch {
            // fall through to scrape
        }
    }

    // Fallback: scrape GIA public report check
    const res = await axios.get(
        `https://www.gia.edu/report-check-landing?reportno=${reportNumber}`,
        { timeout: 15000 }
    );
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

export const fetchIGICertificate = async (reportNumber: string): Promise<CertificateData> => {
    const res = await axios.get(
        `https://www.igi.org/verify-your-report/?r=${reportNumber}`,
        { timeout: 15000 }
    );
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
