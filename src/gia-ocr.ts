/*
import { processCertificateOCR } from './modules/diamond/ocr.service';

const reportNumber = process.argv[2];

if (!reportNumber) {
    console.error('Usage: ts-node src/gia-ocr.ts <report_number>');
    process.exit(1);
}

processCertificateOCR(reportNumber)
    .then(() => process.exit(0))
    .catch((err: any) => {
        console.error(err);
        process.exit(1);
    });
*/
console.log('OCR script is currently disabled due to missing dependencies.');
