const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const form = new FormData();
  // Create a dummy CSV content
  const csvContent = "SHAPE,WEIGHT,COLOR,CLARITY,CUT,POLISH,SYMMETRY,REPORT\nROUND,1.0,D,FL,EX,EX,EX,GIA123\n";
  fs.writeFileSync('test.csv', csvContent);
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWFlYTk4YmJmMjMwZGRmZTFlY2YzYzkiLCJyb2xlIjoiT1dORVIiLCJuYW1lIjpudWxsLCJidXNpbmVzc0lkIjoiNjlhZWE5OGJiZjIzMGRkZmUxZWNmM2M4IiwiaXNzIjoiZGlhbW9uZC1tYXJrZXQtYXBpIiwiYXVkIjoiZGlhbW9uZC1tYXJrZXQtY2xpZW50IiwiaWF0IjoxNzczMTI3MzkwLCJuYmYiOjE3NzMxMjczOTAsImV4cCI6MTc3MzIxMzc5MH0.Aw9cxJliTQsI2_ssTjtIl4HzLJqEuZUnmFNQ1Su1x0o';
  
  form.append('file', fs.createReadStream('test.csv'));

  try {
    const response = await axios.post('http://localhost:4000/api/diamonds/bulk-upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Success:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  } finally {
    fs.unlinkSync('test.csv');
  }
}

test();
