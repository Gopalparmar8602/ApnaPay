const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getStatus,
    setMpin,
    verifyMpin,
    changeMpin,
    forgotMpin,
    resetMpin
} = require('../controllers/mpinController');

// Lightweight per-user rate limiter for MPIN endpoints (max 30 req/min)
const mpinRateWindow = new Map();
function mpinRateLimiter(req, res, next) {
    const key = String(req.user?.userId || req.ip || 'anon');
    const now = Date.now();
    const entry = mpinRateWindow.get(key);
    if (!entry || now - entry.start > 60000) {
        mpinRateWindow.set(key, { start: now, count: 1 });
        return next();
    }
    entry.count += 1;
    if (entry.count > 30) {
        return res.status(429).json({
            success: false,
            message: 'Too many MPIN requests. Please wait a minute and try again.'
        });
    }
    return next();
}

router.use(authMiddleware, mpinRateLimiter);

router.get('/status', getStatus);
router.post('/set', setMpin);
router.post('/verify', verifyMpin);
router.post('/change', changeMpin);
router.post('/forgot', forgotMpin);
router.post('/reset', resetMpin);

module.exports = router;
