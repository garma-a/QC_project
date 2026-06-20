const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 1, role: 'ADMIN' }, 'test', { expiresIn: '1h' });
console.log(token.split('.')[1]);
try {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const parsed = JSON.parse(atob(base64));
  console.log(parsed);
} catch(e) {
  console.error('atob error:', e.message);
}
