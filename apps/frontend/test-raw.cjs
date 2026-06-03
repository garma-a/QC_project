const http = require('http');
const data = JSON.stringify({ email: 'admin@lab.local', password: 'Password123!' });

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const token = JSON.parse(body).accessToken;
    // But wait, there is no endpoint that executes raw query. I need to write a standalone script connecting to DB.
  });
});
req.write(data);
req.end();
