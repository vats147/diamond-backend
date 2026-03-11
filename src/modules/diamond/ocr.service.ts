
import axios from 'axios';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// import { createCanvas } from 'canvas';
import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

// Set up worker for pdfjs
/*
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Try to find the worker file
    const workerPath = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'legacy', 'build', 'pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
}
*/

export const downloadCertificatePDF = async (reportNumber: string): Promise<Buffer> => {
    const urls: string[] = [];
    
    // IGI logic
    if (reportNumber.startsWith('LG') || (reportNumber.length >= 8 && !isNaN(Number(reportNumber)) && reportNumber.length <= 12)) {
        const digits = reportNumber.replace(/\D/g, '');
        urls.push(`https://pdf.igi.org/FDR${digits}.pdf`);
        urls.push(`https://api.igi.org/viewpdf.php?r=${reportNumber}`);
    } else {
        // GIA logic
        urls.push(`https://www.gia.edu/otpserver/RetrievingReportPDF.do?report_no=${reportNumber}&p_status=active`);
    }

    let lastError: any;
    for (const url of urls) {
        console.log(`📡 Attempting to download PDF from: ${url}`);
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://www.igi.org/'
                },
                timeout: 10000
            });
            return Buffer.from(response.data);
        } catch (error: any) {
            console.warn(`⚠️ Failed to download from ${url}: ${error.message}`);
            lastError = error;
        }
    }

    throw new Error(`Failed to download certificate PDF for report ${reportNumber}. Last error: ${lastError?.message}`);
};

/*
export const convertPDFToImages = async (pdfBuffer: Buffer): Promise<Buffer[]> => {
    try {
        const data = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        const images: Buffer[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better OCR
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            await page.render({
                canvasContext: context as any,
                viewport: viewport,
                // Add canvas property for types if needed, though usually context is enough
                // @ts-ignore
                canvas: canvas
            }).promise;

            images.push(canvas.toBuffer('image/png'));
        }

        return images;
    } catch (error: any) {
        throw new Error(`Failed to convert PDF to images: ${error.message}`);
    }
};
*/

/*
export const performOCR = async (imageBuffers: Buffer[]): Promise<string[]> => {
    const worker = await createWorker('eng');
    const allLines: string[] = [];

    try {
        for (const buffer of imageBuffers) {
            const { data: { text } } = await worker.recognize(buffer);
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            allLines.push(...lines);
        }
    } finally {
        await worker.terminate();
    }

    return allLines;
};
*/

export const readLocalPDF = async (filePath: string): Promise<Buffer> => {
    try {
        return fs.readFileSync(filePath);
    } catch (error: any) {
        throw new Error(`Failed to read local PDF from ${filePath}: ${error.message}`);
    }
};

/*
export const processCertificateOCR = async (reportNumberOrPath: string): Promise<void> => {
    console.log(`\n🔍 Starting OCR process for report/file: ${reportNumberOrPath}...\n`);

    try {
        let imageBuffers: Buffer[] = [];

        if (fs.existsSync(reportNumberOrPath)) {
            if (reportNumberOrPath.match(/\.(png|jpg|jpeg|webp)$/i)) {
                console.log('🖼️ Input is an image file. Skipping PDF conversion...');
                imageBuffers = [fs.readFileSync(reportNumberOrPath)];
            } else if (reportNumberOrPath.endsWith('.pdf')) {
                console.log('📄 Reading local PDF file...');
                const pdfBuffer = await readLocalPDF(reportNumberOrPath);
                console.log('🖼️ Converting PDF to images...');
                imageBuffers = await convertPDFToImages(pdfBuffer);
            } else {
                throw new Error('Unsupported file format. Please provide a .pdf or an image file.');
            }
        } else {
            // Step 1: Download PDF
            console.log('📡 Downloading PDF...');
            let pdfBuffer: Buffer;
            try {
                pdfBuffer = await downloadCertificatePDF(reportNumberOrPath);
                console.log(`✅ Downloaded (${pdfBuffer.length} bytes)`);

                // Save PDF for the user to see
                const downloadsDir = path.join(process.cwd(), 'downloads');
                if (!fs.existsSync(downloadsDir)) {
                    fs.mkdirSync(downloadsDir);
                }
                const fileName = reportNumberOrPath.endsWith('.pdf') ? reportNumberOrPath : `${reportNumberOrPath}.pdf`;
                const filePath = path.join(downloadsDir, fileName);
                fs.writeFileSync(filePath, pdfBuffer);
                console.log(`💾 Saved PDF to: ${filePath}`);

            } catch (downloadError: any) {
                console.warn(`⚠️ Download failed. Checking for local fallback...`);
                const fallbackPath = path.join(process.cwd(), `LG${reportNumberOrPath}.pdf`);
                if (fs.existsSync(fallbackPath)) {
                    console.log(`📄 Found local fallback: ${fallbackPath}`);
                    pdfBuffer = await readLocalPDF(fallbackPath);
                } else {
                    throw downloadError;
                }
            }
            console.log('🖼️ Converting PDF to images...');
            imageBuffers = await convertPDFToImages(pdfBuffer);
        }

        console.log(`✅ Ready to OCR ${imageBuffers.length} page(s)`);

        // Step 3: OCR
        console.log('🤖 Performing OCR (this may take a moment)...');
        const lines = await performOCR(imageBuffers);
        
        // Step 4: Output
        console.log('\n📄 Extracted Lines:');
        console.log('--------------------------------------------------');
        lines.forEach((line: string) => {
            console.log(line);
            console.log('--');
        });
        console.log('--------------------------------------------------\n');
        console.log('✨ OCR process completed.');

    } catch (error: any) {
        console.error(`❌ OCR Error: ${error.message}`);
    }
};
*/
