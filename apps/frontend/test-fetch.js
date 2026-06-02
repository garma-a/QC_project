const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/qc-results',
  method: 'GET',
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (data.length > 500) {
      console.log('Data:', data.substring(0, 500) + '...');
    } else {
      console.log('Data:', data);
    }
  });
});
req.end();
