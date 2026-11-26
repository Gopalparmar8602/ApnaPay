const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 1, email: 'gopalper8602@gmail.com', phone: '9981280069', role: 'customer' },
  'c5f782782bcf656fa5f4d8a1768c8b668041d407ffeb6c4292fb2c8849bca7ff',
  { expiresIn: '1h' }
);

function get(path) {
  return new Promise((resolve) => {
    http.get({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', err => resolve({ status: 'ERR', error: err.message }));
  });
}

async function testWallet() {
  console.log('Testing /api/wallet endpoints:');
  const r1 = await get('/wallet');
  console.log('/api/wallet ->', r1.status, JSON.stringify(r1.body).slice(0, 150));
  const r2 = await get('/wallet/limits');
  console.log('/api/wallet/limits ->', r2.status, JSON.stringify(r2.body).slice(0, 150));
  const r3 = await get('/wallet/summary');
  console.log('/api/wallet/summary ->', r3.status, JSON.stringify(r3.body).slice(0, 150));
  const r4 = await get('/wallet/ledger');
  console.log('/api/wallet/ledger ->', r4.status, JSON.stringify(r4.body).slice(0, 150));
  process.exit(0);
}

testWallet();
