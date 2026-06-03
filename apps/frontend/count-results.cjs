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
    http.get({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/qc-results',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res2) => {
      let body2 = '';
      res2.on('data', c => body2 += c);
      res2.on('end', () => {
        const d = JSON.parse(body2);
        console.log('Results length:', d.results.length);
      });
    });
  });
});
req.write(data);
req.end();
