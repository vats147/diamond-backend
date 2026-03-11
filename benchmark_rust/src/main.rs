
use std::fs;
use std::path::Path;
use std::time::Instant;
use std::io::Write;
use reqwest::header::{USER_AGENT, REFERER};

fn main() {
    let start_id: u64 = 769624532;
    let batch_size: u64 = 100;
    let total_count: u64 = 500;
    let output_dir = "../pdf_report/rust";

    if !Path::new(output_dir).exists() {
        fs::create_dir_all(output_dir).unwrap();
    }

    let client = reqwest::blocking::Client::new();
    println!("🚀 Starting Rust Benchmark: Downloading {} PDFs...", total_count);

    let overall_start = Instant::now();
    let mut results = Vec::new();

    for i in 0..total_count {
        let current_id = start_id + i;
        let url = format!("https://pdf.igi.org/FDR{}.pdf", current_id);
        
        let start = Instant::now();
        let response = client.get(&url)
            .header(USER_AGENT, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
            .header(REFERER, "https://www.igi.org/")
            .send();

        match response {
            Ok(res) => {
                let duration = start.elapsed().as_secs_f64();
                results.push(duration);
                if res.status().is_success() {
                    let bytes = res.bytes().unwrap();
                    let file_path = format!("{}/LG{}.pdf", output_dir, current_id);
                    let mut file = fs::File::create(file_path).unwrap();
                    file.write_all(&bytes).unwrap();
                } else {
                    // We still push duration to keep indexing simple
                }
            }
            Err(e) => {
                println!("❌ Error ID {}: {}", current_id, e);
                results.push(start.elapsed().as_secs_f64());
            }
        }

        if (i + 1) % batch_size == 0 {
            let start_idx = (i + 1 - batch_size) as usize;
            let last_batch = &results[start_idx..];
            let batch_time: f64 = last_batch.iter().sum();
            let avg = batch_time / batch_size as f64;
            println!("📦 Batch {} (100) completed. Avg: {:.3}s/pdf. Total batch time: {:.3}s", (i + 1) / batch_size, avg, batch_time);
        }
    }

    let total_time = overall_start.elapsed().as_secs_f64();
    println!("\n🏁 Rust Benchmark Completed!");
    println!("Total Time: {:.2}s", total_time);
    println!("Total Downloaded: {}/{}", results.len(), total_count);
    println!("Average Time per PDF: {:.3}s", total_time / total_count as f64);
}
