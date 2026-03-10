import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function test() {
  const form = new FormData();
  form.append('file', fs.createReadStream('/Users/vats/Desktop/DimondMarket/NERIA JEWELS STOCK-LIST IGI (2).xlsx'));
  
  // Login first to get a token and businessId
  // Instead, since we need an API key as per the backend requirements we'll just check the frontend logic 
  console.log("Skipping direct backend test due to auth requirement. We'll rely on frontend E2E test.");
}
test();
