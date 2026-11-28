const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const {
    ensureMpinSchema,
    isValidMpinFormat,
    getMpinStatus,
    verifyUserMpin
} = require('../services/mpinService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const NotificationService = require('../services/notificationService');

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 30;

// 1. GET /mpin/status
exports.getStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        const status = await getMpinStatus(userId);
        if (!status) return res.status(404).json({ success: false, message: 'User not found.' });

        return res.json({ success: true, data: status });
    } catch (err) {
        console.error('MPIN Status Error:', err.message);
        return res.status(500).json({ success: false, message: 'Unable to fetch MPIN status.' });
    }
};

// 2. POST /mpin/set
exports.setMpin = async (req, res) => {
    try {
        await ensureMpinSchema();
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        const mpin = String(req.body?.mpin ?? '').trim();
        const confirmMpin = String(req.body?.confirmMpin ?? '').trim();

        if (!isValidMpinFormat(mpin)) {
            return res.status(400).json({
                success: false,
                message: 'MPIN must be exactly 4 numeric digits.'
            });
        }
        if (mpin !== confirmMpin) {
            return res.status(400).json({
                success: false,
                message: 'MPIN and Confirm MPIN do not match.'
            });
        }

        const [rows] = await db.execute('SELECT id, mpin_set FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
        if (rows[0].mpin_set) {
            return res.status(409).json({
                success: false,
                message: 'MPIN is already set. Use Change MPIN or Forgot MPIN to update it.'
            });
        }

        const mpinHash = await bcrypt.hash(mpin, 12);
        await db.execute(
            `UPDATE users
             SET mpin_hash = ?, mpin_set = 1, mpin_failed_attempts = 0, mpin_locked_until = NULL, mpin_updated_at = NOW()
             WHERE id = ?`,
            [mpinHash, userId]
        );

        try {
            await NotificationService.notify({
                userId,
                title: 'Payment MPIN Activated',
                message: 'Your 4-digit ApnaPay Payment MPIN has been set securely.',
                category: 'security',
                type: 'success'
            });
        } catch (_) {}

        const status = await getMpinStatus(userId);
        return res.status(201).json({
            success: true,
            message: '4-digit Payment MPIN set successfully.',
            data: status
        });
    } catch (err) {
        console.error('Set MPIN Error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to set MPIN.' });
    }
};

// 3. POST /mpin/verify
exports.verifyMpin = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        const mpin = String(req.body?.mpin ?? '').trim();
        const check = await verifyUserMpin(userId, mpin);
        if (!check.ok) {
            return res.status(check.status).json({
                success: false,
                code: check.code,
                isLocked: Boolean(check.isLocked),
                lockedUntil: check.lockedUntil || null,
                remainingSeconds: check.remainingSeconds || 0,
                remainingAttempts: check.remainingAttempts,
                message: check.message
            });
        }

        return res.json({ success: true, message: 'MPIN verified successfully.' });
    } catch (err) {
        console.error('Verify MPIN Error:', err.message);
        return res.status(500).json({ success: false, message: 'MPIN verification failed.' });
    }
};

// 4. POST /mpin/change
exports.changeMpin = async (req, res) => {
    try {
        await ensureMpinSchema();
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        const currentMpin = String(req.body?.currentMpin ?? '').trim();
        const newMpin = String(req.body?.newMpin ?? '').trim();
        const confirmMpin = String(req.body?.confirmMpin ?? '').trim();

        const check = await verifyUserMpin(userId, currentMpin);
        if (!check.ok) {
            return res.status(check.status).json({
                success: false,
                code: check.code,
                message: check.message
            });
        }

        if (!isValidMpinFormat(newMpin)) {
            return res.status(400).json({
                success: false,
                message: 'New MPIN must be exactly 4 numeric digits.'
            });
        }
        if (newMpin !== confirmMpin) {
            return res.status(400).json({
                success: false,
                message: 'New MPIN and Confirm MPIN do not match.'
            });
        }
        if (newMpin === currentMpin) {
            return res.status(400).json({
                success: false,
                message: 'New MPIN must be different from your current MPIN.'
            });
        }

        const newHash = await bcrypt.hash(newMpin, 12);
        await db.execute(
            `UPDATE users
             SET mpin_hash = ?, mpin_set = 1, mpin_failed_attempts = 0, mpin_locked_until = NULL, mpin_updated_at = NOW()
             WHERE id = ?`,
            [newHash, userId]
        );

        try {
            await NotificationService.notify({
                userId,
                title: 'Payment MPIN Changed',
                message: 'Your 4-digit ApnaPay Payment MPIN was updated.',
                category: 'security',
                type: 'info'
            });
        } catch (_) {}

        const status = await getMpinStatus(userId);
        return res.json({
            success: true,
            message: 'Payment MPIN changed successfully.',
            data: status
        });
    } catch (err) {
        console.error('Change MPIN Error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to change MPIN.' });
    }
};

// 5. POST /mpin/forgot - Send OTP for MPIN Reset
exports.forgotMpin = async (req, res) => {
    try {
        await ensureMpinSchema();
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        const [users] = await db.execute(
            'SELECT id, email, phone FROM users WHERE id = ? LIMIT 1',
            [userId]
        );
        if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });
        const user = users[0];

        // Rate-limit OTP requests (30s cooldown)
        const [recent] = await db.execute(
            `SELECT created_at FROM otp_verifications
             WHERE user_id = ? AND purpose = 'mpin_reset' AND verified_at IS NULL
             ORDER BY id DESC LIMIT 1`,
            [userId]
        );
        if (recent.length > 0) {
            const elapsedSec = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
            if (elapsedSec < OTP_COOLDOWN_SECONDS) {
                const waitSec = Math.ceil(OTP_COOLDOWN_SECONDS - elapsedSec);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitSec} second(s) before requesting another OTP.`
                });
            }
        }

        const otp = String(crypto.randomInt(100000, 999999));
        const otpHash = await bcrypt.hash(otp, 10);

        // Invalidate previous unused MPIN reset OTPs
        await db.execute(
            `UPDATE otp_verifications SET verified_at = NOW()
             WHERE user_id = ? AND purpose = 'mpin_reset' AND verified_at IS NULL`,
            [userId]
        );

        await db.execute(
            `INSERT INTO otp_verifications (user_id, phone, email, otp_hash, purpose, expires_at, attempts)
             VALUES (?, ?, ?, ?, 'mpin_reset', DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)`,
            [userId, user.phone || null, user.email || null, otpHash, OTP_EXPIRY_MINUTES]
        );

        let deliveredVia = 'email';
        if (user.email && emailService.isEmailConfigured && emailService.isEmailConfigured()) {
            await emailService.sendOtpEmail(user.email, otp, 'mpin_reset');
            deliveredVia = 'email';
        } else if (user.email && emailService.sendOtpEmail) {
            await emailService.sendOtpEmail(user.email, otp, 'mpin_reset').catch(() => {});
        }
        if (user.phone && smsService.isSmsConfigured && smsService.isSmsConfigured()) {
            await smsService.sendOtpSms({ phone: user.phone, otp, purpose: 'mpin_reset' }).catch(() => {});
            deliveredVia = user.email ? 'email & SMS' : 'SMS';
        }

        const maskedTarget = user.email
            ? emailService.maskEmail(user.email)
            : smsService.maskPhone(user.phone);

        return res.json({
            success: true,
            message: `OTP sent to ${maskedTarget} (${deliveredVia}). Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
            data: { maskedTarget, expiresInMinutes: OTP_EXPIRY_MINUTES }
        });
    } catch (err) {
        console.error('Forgot MPIN Error:', err.message);
        return res.status(500).json({ success: false, message: 'Unable to send MPIN reset OTP.' });
    }
};

// 6. POST /mpin/reset - Verify OTP & Set New MPIN
exports.resetMpin = async (req, res) => {
    try {
        await ensureMpinSchema();
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

        const otp = String(req.body?.otp ?? '').trim();
        const newMpin = String(req.body?.newMpin ?? '').trim();
        const confirmMpin = String(req.body?.confirmMpin ?? '').trim();

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit OTP.' });
        }
        if (!isValidMpinFormat(newMpin)) {
            return res.status(400).json({ success: false, message: 'New MPIN must be exactly 4 numeric digits.' });
        }
        if (newMpin !== confirmMpin) {
            return res.status(400).json({ success: false, message: 'New MPIN and Confirm MPIN do not match.' });
        }

        const [otpRows] = await db.execute(
            `SELECT id, otp_hash, expires_at, attempts
             FROM otp_verifications
             WHERE user_id = ? AND purpose = 'mpin_reset' AND verified_at IS NULL
             ORDER BY id DESC LIMIT 1`,
            [userId]
        );

        if (!otpRows.length) {
            return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new OTP.' });
        }

        const record = otpRows[0];
        if (new Date(record.expires_at) <= new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
        }
        if (Number(record.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            return res.status(429).json({ success: false, message: 'Too many invalid OTP attempts. Please request a new OTP.' });
        }

        const isOtpValid = await bcrypt.compare(otp, record.otp_hash);
        if (!isOtpValid) {
            await db.execute('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [record.id]);
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
        }

        // Mark OTP single-use consumed
        await db.execute('UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?', [record.id]);

        const newHash = await bcrypt.hash(newMpin, 12);
        await db.execute(
            `UPDATE users
             SET mpin_hash = ?, mpin_set = 1, mpin_failed_attempts = 0, mpin_locked_until = NULL, mpin_updated_at = NOW()
             WHERE id = ?`,
            [newHash, userId]
        );

        try {
            await NotificationService.notify({
                userId,
                title: 'Payment MPIN Reset',
                message: 'Your 4-digit ApnaPay Payment MPIN has been reset successfully.',
                category: 'security',
                type: 'success'
            });
        } catch (_) {}

        const status = await getMpinStatus(userId);
        return res.json({
            success: true,
            message: 'Payment MPIN reset successfully.',
            data: status
        });
    } catch (err) {
        console.error('Reset MPIN Error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to reset MPIN.' });
    }
};
