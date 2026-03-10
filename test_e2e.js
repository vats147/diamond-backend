const fs = require('fs');

async function check() {
    const fetch = (await import('node-fetch')).default;
    const body = new (await import('form-data')).default();
    body.append('file', Buffer.from('hello'), { filename: 'test.xlsx' });

    const res = await fetch('http://localhost:4000/api/diamonds/bulk-upload', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWFlYTk4YmJmMjMwZGRmZTFlY2YzYzkiLCJyb2xlIjoiT1dORVIiLCJuYW1lIjpudWxsLCJidXNpbmVzc0lkIjoiNjlhZWE5OGJiZjIzMGRkZmUxZWNmM2M4IiwiaXNzIjoiZGlhbW9uZC1tYXJrZXQtYXBpIiwiYXVkIjoiZGlhbW9uZC1tYXJrZXQtY2xpZW50IiwiaWF0IjoxNzczMTI3MzkwLCJuYmYiOjE3NzMxMjczOTAsImV4cCI6MTc3MzIxMzc5MH0.Aw9cxJliTQsI2_ssTjtIl4HzLJqEuZUnmFNQ1Su1x0o'
        },
        body
    });

    console.log(res.status, await res.text());
}
check();
