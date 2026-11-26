const http = require('http');
const jwt = require('jsonwebtoken');

// Generate test JWT token for userId 1
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

async function runTest() {
  console.log('--- STARTING COMPLETE PHONEPE KYC END-TO-END TEST ---');

  // 1. Reset demo state
  console.log('\n[1] Resetting KYC Demo State...');
  const resetRes = await request('POST', '/kyc/reset-demo');
  console.log('Reset response:', resetRes.status, resetRes.body?.message);

  // 2. Submit PAN details
  console.log('\n[2] Submitting Step 1: PAN Details...');
  const panRes = await request('POST', '/kyc/pan/verify', {
    panNumber: 'GSSPP4232F',
    fullName: 'GOPAL PARMAR',
    dateOfBirth: '1998-05-15'
  });
  console.log('PAN Verify:', panRes.status, panRes.body?.message, 'Masked Email:', panRes.body?.data?.masked_email);

  // 3. Verify PAN OTP
  console.log('\n[3] Verifying Step 2: PAN OTP with code 123456...');
  const panOtpRes = await request('POST', '/kyc/pan/verify-otp', { otp: '123456' });
  console.log('PAN OTP Verify:', panOtpRes.status, panOtpRes.body?.message, 'Next Step:', panOtpRes.body?.data?.next_step);

  // 4. Submit Aadhaar details
  console.log('\n[4] Submitting Step 2: Aadhaar Details...');
  const aadhaarRes = await request('POST', '/kyc/aadhaar/verify', {
    aadhaarNumber: '895138471629'
  });
  console.log('Aadhaar Verify:', aadhaarRes.status, aadhaarRes.body?.message, 'Masked Email:', aadhaarRes.body?.data?.masked_email);

  // 5. Verify Aadhaar OTP
  console.log('\n[5] Verifying Aadhaar OTP with code 123456...');
  const aadhaarOtpRes = await request('POST', '/kyc/aadhaar/verify-otp', { otp: '123456' });
  console.log('Aadhaar OTP Verify:', aadhaarOtpRes.status, aadhaarOtpRes.body?.message, 'Next Step:', aadhaarOtpRes.body?.data?.next_step);

  // 6. Submit Step 3: Details (Parent, Marital, Occupation, Nominee, Declarations)
  console.log('\n[6] Submitting Step 3: Details...');
  const detailsRes = await request('POST', '/kyc/details', {
    parentRelation: 'Father',
    parentName: 'Shyam Parmar',
    maritalStatus: 'Single',
    occupationType: 'Salaried',
    annualIncome: '1 to 5 Lakhs',
    nomineeRelation: 'Sibling',
    nomineeName: 'Shree Krishna Parmar',
    nomineeDob: '1999-08-15',
    hasDisability: 'No',
    isTaxResidentIndia: true,
    isPep: false,
    otpEkycDeclaration: true
  });
  console.log('Details Submit:', detailsRes.status, detailsRes.body?.message, 'Next Step:', detailsRes.body?.data?.next_step);

  // 7. Step 4: Upgrade Wallet Limit to Higher Limits (₹2 Lakh)
  console.log('\n[7] Upgrading Wallet Limit to Higher Limits...');
  const limitRes = await request('POST', '/kyc/wallet/upgrade-limit', { tier: 'HIGHER_LIMITS' });
  console.log('Limit Upgrade:', limitRes.status, limitRes.body?.message, 'Next Step:', limitRes.body?.data?.next_step, 'Limit:', limitRes.body?.data?.wallet_limit);

  // 8. Verify KYC Status
  console.log('\n[8] Checking Final KYC Status...');
  const statusRes = await request('GET', '/kyc/status');
  console.log('Final Status:', statusRes.status, 'Current Step:', statusRes.body?.data?.kyc?.current_step, 'Tier:', statusRes.body?.data?.kyc?.wallet_tier, 'Limit:', statusRes.body?.data?.kyc?.wallet_limit, 'Wallet Balance:', statusRes.body?.data?.wallet?.available_balance);

  console.log('\n--- ALL BACKEND TEST CALLS FINISHED SUCCESSFULLY! ---');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
