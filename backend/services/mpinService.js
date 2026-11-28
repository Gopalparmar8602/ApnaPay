const bcrypt = require('bcrypt');
const db = require('../config/db');

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_MINUTES = 15;
const MPIN_REGEX = /^\d{4}$/;

let mpinSchemaReady = false;

/**
 * Ensures MPIN security columns exist on the `users` table without breaking existing users.
 */
async function ensureMpinSchema() {
    if (mpinSchemaReady) return;
    try {
        const [cols] = await db.execute('DESCRIBE users');
        const existing = cols.map((c) => c.Field);
        const needed = [
            ['mpin_hash', 'VARCHAR(255) NULL'],
            ['mpin_set', 'TINYINT(1) NOT NULL DEFAULT 0'],
            ['mpin_failed_attempts', 'INT UNSIGNED NOT NULL DEFAULT 0'],
            ['mpin_locked_until', 'DATETIME NULL'],
            ['mpin_updated_at', 'TIMESTAMP NULL']
        ];
        for (const [colName, colDef] of needed) {
            if (!existing.includes(colName)) {
                await db.execute(`ALTER TABLE users ADD COLUMN ${colName} ${colDef}`);
            }
        }
        mpinSchemaReady = true;
    } catch (_) {
        // Silent if DB is still initializing
    }
}

ensureMpinSchema().catch(() => {});

function isValidMpinFormat(mpin) {
    return typeof mpin === 'string' && MPIN_REGEX.test(mpin);
}

/**
 * Returns non-sensitive MPIN configuration metadata for a user.
 */
async function getMpinStatus(userId) {
    await ensureMpinSchema();
    const [rows] = await db.execute(
        `SELECT mpin_set, mpin_failed_attempts, mpin_locked_until, mpin_updated_at
         FROM users WHERE id = ? LIMIT 1`,
        [userId]
    );
    if (!rows.length) {
        return null;
    }
    const row = rows[0];
    const now = new Date();
    const lockedUntil = row.mpin_locked_until ? new Date(row.mpin_locked_until) : null;
    const isLocked = Boolean(lockedUntil && lockedUntil > now);
    const remainingSeconds = isLocked ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0;
    const remainingMinutes = isLocked ? Math.max(1, Math.ceil(remainingSeconds / 60)) : 0;

    return {
        mpinSet: Boolean(row.mpin_set),
        mpinUpdatedAt: row.mpin_updated_at || null,
        isLocked,
        lockedUntil: isLocked ? lockedUntil.toISOString() : null,
        remainingSeconds,
        remainingMinutes,
        failedAttempts: Number(row.mpin_failed_attempts || 0)
    };
}

/**
 * Verifies a 4-digit MPIN for a user on the backend with atomic attempt & lockout tracking.
 * @param {number} userId
 * @param {string} rawMpin
 * @param {import('mysql2/promise').PoolConnection|null} connection
 */
async function verifyUserMpin(userId, rawMpin) {
    await ensureMpinSchema();
    const mpinStr = String(rawMpin ?? '').trim();

    const [rows] = await db.execute(
        `SELECT id, mpin_hash, mpin_set, mpin_failed_attempts, mpin_locked_until
         FROM users WHERE id = ? LIMIT 1`,
        [userId]
    );

    if (!rows.length) {
        return { ok: false, status: 404, code: 'USER_NOT_FOUND', message: 'User not found.' };
    }

    const user = rows[0];
    if (!user.mpin_set || !user.mpin_hash) {
        return {
            ok: false,
            status: 400,
            code: 'MPIN_NOT_SET',
            message: 'Payment MPIN is not set. Please set your 4-digit MPIN first.'
        };
    }

    if (!isValidMpinFormat(mpinStr)) {
        return {
            ok: false,
            status: 400,
            code: 'INVALID_MPIN_FORMAT',
            message: 'Please enter a valid 4-digit numeric MPIN.'
        };
    }

    const now = new Date();
    if (user.mpin_locked_until && new Date(user.mpin_locked_until) > now) {
        const lockedDate = new Date(user.mpin_locked_until);
        const remainingSeconds = Math.max(1, Math.ceil((lockedDate - now) / 1000));
        const mins = Math.max(1, Math.ceil(remainingSeconds / 60));
        return {
            ok: false,
            status: 423,
            code: 'MPIN_LOCKED',
            isLocked: true,
            lockedUntil: lockedDate.toISOString(),
            remainingSeconds,
            remainingMinutes: mins,
            message: `Too many incorrect MPIN attempts. Payment authorization is locked. Try again in ${mins} minute(s).`
        };
    }

    const isMatch = await bcrypt.compare(mpinStr, user.mpin_hash);
    if (!isMatch) {
        // Atomic increment so concurrent wrong requests cannot bypass the 3-attempt limit
        await db.execute(
            `UPDATE users
             SET mpin_failed_attempts = IF(mpin_locked_until IS NOT NULL AND mpin_locked_until <= NOW(), 1, mpin_failed_attempts + 1),
                 mpin_locked_until = IF(
                     IF(mpin_locked_until IS NOT NULL AND mpin_locked_until <= NOW(), 1, mpin_failed_attempts + 1) >= ?,
                     DATE_ADD(NOW(), INTERVAL ? MINUTE),
                     NULL
                 )
             WHERE id = ?`,
            [MAX_FAILED_ATTEMPTS, LOCK_MINUTES, userId]
        );

        const [updated] = await db.execute(
            'SELECT mpin_failed_attempts, mpin_locked_until FROM users WHERE id = ? LIMIT 1',
            [userId]
        );
        const attempts = Number(updated[0]?.mpin_failed_attempts || 1);
        const lockedDate = updated[0]?.mpin_locked_until ? new Date(updated[0].mpin_locked_until) : null;
        const lockedNow = Boolean(lockedDate && lockedDate > new Date());

        if (lockedNow) {
            const remainingSeconds = Math.max(1, Math.ceil((lockedDate - new Date()) / 1000));
            return {
                ok: false,
                status: 423,
                code: 'MPIN_LOCKED',
                isLocked: true,
                lockedUntil: lockedDate.toISOString(),
                remainingSeconds,
                remainingMinutes: LOCK_MINUTES,
                message: `Too many incorrect MPIN attempts. Payment authorization is locked for ${LOCK_MINUTES} minutes.`
            };
        }

        const remaining = Math.max(1, MAX_FAILED_ATTEMPTS - attempts);
        return {
            ok: false,
            status: 401,
            code: 'INVALID_MPIN',
            isLocked: false,
            remainingAttempts: remaining,
            message: `Incorrect MPIN. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
        };
    }

    // Reset failed attempts & lock on successful verification
    if (Number(user.mpin_failed_attempts || 0) > 0 || user.mpin_locked_until) {
        await db.execute(
            `UPDATE users SET mpin_failed_attempts = 0, mpin_locked_until = NULL WHERE id = ?`,
            [userId]
        );
    }

    return { ok: true };
}

module.exports = {
    ensureMpinSchema,
    isValidMpinFormat,
    getMpinStatus,
    verifyUserMpin,
    MAX_FAILED_ATTEMPTS,
    LOCK_MINUTES
};
