process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_2026';
process.env.ADMIN_JWT_SECRET = 'test_admin_jwt_secret_2026';

const app = require('../app');

function createMockReq(method = 'GET', url = '/') {
    return {
        method,
        url,
        originalUrl: url,
        path: url.split('?')[0],
        headers: {
            'content-type': 'application/json',
            authorization: 'Bearer mock_token_for_test'
        },
        body: {},
        query: {},
        params: {},
        user: { id: 1, userId: 1, role: 'customer', email: 'test@apnapay.com' },
        admin: { id: 1, adminId: 1, role: 'superadmin', email: 'admin@apnapay.com' }
    };
}

function createMockRes(onEnd) {
    return {
        statusCode: 200,
        headers: {},
        status(code) { this.statusCode = code; return this; },
        setHeader(n, v) { this.headers[n] = v; return this; },
        json(data) { this.body = data; onEnd(null, this); return this; },
        send(data) { this.body = data; onEnd(null, this); return this; },
        redirect(url) { this.redirectUrl = url; onEnd(null, this); return this; }
    };
}

function dispatch(method, url) {
    return new Promise((resolve) => {
        const req = createMockReq(method, url);
        const res = createMockRes((err, r) => resolve({ status: r.statusCode, body: r.body }));
        try {
            app.handle(req, res, (err) => {
                if (err) resolve({ status: 500, error: err.message });
                else resolve({ status: 404, body: 'Not Handled' });
            });
        } catch (e) {
            resolve({ status: 500, error: e.message });
        }
    });
}

async function testAll() {
    console.log('Testing Manshi + Core Endpoints:');
    const tests = [
        ['GET', '/api/health'],
        ['GET', '/api/users/profile'],
        ['GET', '/api/kyc/status'],
        ['GET', '/api/payment/payment-methods'],
        ['GET', '/api/payment/transfers'],
        ['GET', '/api/qr/my-qrs'],
        ['GET', '/api/disputes/stats'],
        ['GET', '/api/disputes/my-disputes'],
        ['GET', '/api/sip/products'],
        ['GET', '/api/sip/my-sips'],
        ['GET', '/api/recharge/operators'],
        ['GET', '/api/recharge/plans'],
        ['GET', '/api/bills/categories'],
        ['GET', '/admin/dashboard/summary'],
        ['GET', '/admin/dashboard/users'],
        ['GET', '/admin/dashboard/financials'],
        ['GET', '/admin/kyc/queue']
    ];

    let passed = 0;
    for (const [m, url] of tests) {
        const res = await dispatch(m, url);
        const ok = res.status !== 404 || res.body !== 'Not Handled';
        console.log(`${ok ? '✅' : '❌'} ${m} ${url} -> Status ${res.status}`);
        if (ok) passed++;
    }
    console.log(`\nVerified ${passed}/${tests.length} routes executed!`);
    process.exit(passed === tests.length ? 0 : 1);
}

testAll();
