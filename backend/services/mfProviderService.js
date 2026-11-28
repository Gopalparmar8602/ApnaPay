const crypto = require('crypto');

/**
 * ApnaPay Mutual Fund Sandbox Provider Adapter
 * ------------------------------------------------------------------
 * Clearly separated sandbox/mock adapter emulating an authorized MF
 * distributor/RTA infrastructure (e.g., BSE StAR MF / NSE NMF II / MFU).
 *
 * Live Production Requirements:
 * - AMFI ARN / EUIN Registration + SEBI RIA/Distributor compliance
 * - BSE StAR MF / NSE NMF II / MFU Member ID, Password, Passkey & IP Whitelisting
 * - NPCI UPI AutoPay / e-NACH Mandate Registration Credentials
 * - KRA (CVL/NDML/CAMS) PAN & KYC Verification API Credentials
 */

const PROVIDER_NAME = process.env.MF_PROVIDER_NAME || 'BSE_STAR_MF_SANDBOX';
const IS_SANDBOX = process.env.MF_PROVIDER_MODE !== 'live';
const WEBHOOK_SECRET = process.env.MF_WEBHOOK_SECRET || 'apnapay_mf_sandbox_webhook_secret';

function getIntegrationHealth() {
    return {
        provider: PROVIDER_NAME,
        mode: IS_SANDBOX ? 'SANDBOX' : 'LIVE',
        liveEnabled: !IS_SANDBOX && Boolean(process.env.MF_MEMBER_ID && process.env.MF_API_KEY),
        supportedPaymentModes: ['UPI', 'UPI_AUTOPAY', 'ENACH', 'NET_BANKING'],
        requiredLiveEnvVars: [
            'MF_PROVIDER_MODE=live',
            'MF_MEMBER_ID',
            'MF_USER_ID',
            'MF_PASSWORD',
            'MF_PASSKEY',
            'MF_WEBHOOK_SECRET',
            'KRA_API_KEY'
        ]
    };
}

function verifyWebhookSignature(rawPayload, signatureHeader) {
    if (!signatureHeader) return false;
    const payloadStr = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(String(signatureHeader)), Buffer.from(expected));
    } catch (_) {
        return false;
    }
}

function createSandboxMandate({ userId, sipPlanId, mandateType, maxAmount }) {
    const ref = `MND-${IS_SANDBOX ? 'SBX' : 'LIVE'}-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
    return {
        mandateReference: ref,
        provider: PROVIDER_NAME,
        mandateType: mandateType || 'upi_autopay',
        maximumAmount: Number(maxAmount),
        status: 'active',
        sandboxSimulated: IS_SANDBOX
    };
}

function submitSandboxOrder({ amount, nav, isLumpsum = false }) {
    const orderRef = `${isLumpsum ? 'LMP' : 'SIP'}-${IS_SANDBOX ? 'SBX' : 'LIVE'}-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
    const confirmedNav = Number(nav) > 0 ? Number(nav) : 45.25;
    const allottedUnits = Number((Number(amount) / confirmedNav).toFixed(4));

    return {
        providerOrderReference: orderRef,
        provider: PROVIDER_NAME,
        orderStatus: 'ALLOTTED',
        paymentStatus: 'PAYMENT_SUCCESS',
        applicableNav: confirmedNav,
        allottedUnits,
        allotmentDate: new Date().toISOString().slice(0, 10),
        sandboxSimulated: IS_SANDBOX
    };
}

module.exports = {
    PROVIDER_NAME,
    IS_SANDBOX,
    getIntegrationHealth,
    verifyWebhookSignature,
    createSandboxMandate,
    submitSandboxOrder
};
