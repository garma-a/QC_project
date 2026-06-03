const http = require('http');

const data = JSON.stringify({ email: 'admin@lab.local', password: 'Password123!' });

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Login status:', res.statusCode);
    const token = JSON.parse(body).accessToken;
    if (!token) {
      console.log('No token! Body:', body);
      return;
    }
    
    // Now fetch qc-results
    http.get({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/qc-results',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res2) => {
      let body2 = '';
      res2.on('data', c => body2 += c);
      res2.on('end', () => {
        console.log('QC Results status:', res2.statusCode);
        console.log('QC Results:', body2.substring(0, 500) + '...');
      });
    });
  });
});

req.write(data);
req.end();
