
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

const START_ID = 769624532;
const BATCH_SIZE = 100;
const TOTAL_COUNT = 500;
const OUTPUT_DIR = path.join(process.cwd(), 'pdf_report', 'js');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function downloadPDF(id: number) {
    const url = `https://pdf.igi.org/FDR${id}.pdf`;
    const start = performance.now();
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                'Referer': 'https://www.igi.org/'
            },
            timeout: 10000
        });
        const end = performance.now();
        const duration = (end - start) / 1000;
        
        fs.writeFileSync(path.join(OUTPUT_DIR, `LG${id}.pdf`), response.data);
        return { id, success: true, duration };
    } catch (error: any) {
        const end = performance.now();
        return { id, success: false, duration: (end - start) / 1000, error: error.message };
    }
}

async function runBenchmark() {
    console.log(`🚀 Starting JS Benchmark: Downloading ${TOTAL_COUNT} PDFs...`);
    const overallStart = performance.now();
    const results = [];
    
    for (let i = 0; i < TOTAL_COUNT; i++) {
        const currentId = START_ID + i;
        const result = await downloadPDF(currentId);
        results.push(result);
        
        if ((i + 1) % BATCH_SIZE === 0) {
            const batchResults = results.slice(i + 1 - BATCH_SIZE);
            const batchTime = batchResults.reduce((acc, curr) => acc + curr.duration, 0);
            const avg = batchTime / BATCH_SIZE;
            console.log(`📦 Batch ${(i + 1) / BATCH_SIZE} (100) completed. Avg: ${avg.toFixed(3)}s/pdf. Total batch time: ${batchTime.toFixed(3)}s`);
        }
    }
    
    const overallEnd = performance.now();
    const totalTime = (overallEnd - overallStart) / 1000;
    const successful = results.filter(r => r.success).length;
    
    console.log(`\n🏁 JS Benchmark Completed!`);
    console.log(`Total Time: ${totalTime.toFixed(2)}s`);
    console.log(`Total Downloaded: ${successful}/${TOTAL_COUNT}`);
    console.log(`Average Time per PDF: ${(totalTime / TOTAL_COUNT).toFixed(3)}s`);
}

runBenchmark();
