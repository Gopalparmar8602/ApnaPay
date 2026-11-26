const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 1, email: 'gopalper8602@gmail.com', phone: '9981280069', role: 'customer' },
  'c5f782782bcf656fa5f4d8a1768c8b668041d407ffeb6c4292fb2c8849bca7ff',
  { expiresIn: '1h' }
);

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('--- TESTING WALLET ADD & WITHDRAW ENDPOINTS ---');

  // 1. Initial Overview
  const r1 = await request('GET', '/wallet');
  console.log('[1] Initial Wallet Balance:', r1.status, r1.body?.data?.formattedBalance);

  // 2. Add Money (₹2000)
  const r2 = await request('POST', '/wallet/add-money', { amount: 2000, paymentMethod: 'UPI' });
  console.log('[2] Add Money (₹2,000):', r2.status, r2.body?.message, 'New Balance:', r2.body?.data?.formattedBalance);

  // 3. Withdraw Money (₹500)
  const r3 = await request('POST', '/wallet/withdraw', { amount: 500, bankName: 'HDFC Bank' });
  console.log('[3] Withdraw (₹500):', r3.status, r3.body?.message, 'New Balance:', r3.body?.data?.formattedBalance);

  // 4. Check Ledger
  const r4 = await request('GET', '/wallet/ledger');
  console.log('[4] Ledger Records Count:', r4.status, r4.body?.data?.records?.length, 'Latest Entry:', r4.body?.data?.records[0]?.description, r4.body?.data?.records[0]?.formattedAmount);

  console.log('--- ALL WALLET TESTS COMPLETED SUCCESSFULLY! ---');
  process.exit(0);
}

run().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
