const http = require('http');

const server = http.createServer((req, res) => {
  console.log('--- Incoming Request ---');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('------------------------');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end('[]');
});

server.listen(5000, () => {
  console.log('Mock server listening on port 5000');
});
