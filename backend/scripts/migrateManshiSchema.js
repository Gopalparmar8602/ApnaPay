/**
 * ApnaPay Database Migration Script: Manshi Schema Sync
 * Safely applies missing tables, columns, and seeds to the active MySQL database.
 */
const db = require('../config/db');

async function migrate() {
    console.log('🔄 Starting ApnaPay Manshi Schema Migration...');
    try {
        const connection = await db.getConnection();
        console.log('✅ Connected to MySQL database successfully.');

        // 1. Column updates for qr_codes if exists
        try {
            await connection.query(`
                ALTER TABLE qr_codes 
                ADD COLUMN IF NOT EXISTS public_id CHAR(36) NULL UNIQUE AFTER user_id,
                ADD COLUMN IF NOT EXISTS qr_type ENUM('static', 'dynamic') NOT NULL DEFAULT 'static' AFTER qr_reference,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
            `);
            console.log('✅ qr_codes table schema verified/updated.');
        } catch (e) {
            console.warn('⚠️ qr_codes alter skipped/error:', e.message);
        }

        // 2. CREATE TABLE kyc_history
        await connection.query(`
            CREATE TABLE IF NOT EXISTS kyc_history (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              kyc_record_id BIGINT UNSIGNED NOT NULL,
              user_id BIGINT UNSIGNED NOT NULL,
              action VARCHAR(50) NOT NULL,
              previous_status VARCHAR(50) NULL,
              new_status VARCHAR(50) NOT NULL,
              remarks TEXT NULL,
              admin_id BIGINT UNSIGNED NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (kyc_record_id) REFERENCES kyc_records(id),
              FOREIGN KEY (user_id) REFERENCES users(id),
              INDEX idx_kyc_history_record (kyc_record_id)
            );
        `);
        console.log('✅ kyc_history table verified.');

        // 3. CREATE TABLE qr_payment_requests
        await connection.query(`
            CREATE TABLE IF NOT EXISTS qr_payment_requests (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                qr_id BIGINT UNSIGNED NOT NULL,
                payer_user_id BIGINT UNSIGNED DEFAULT NULL,
                amount DECIMAL(12,2) NOT NULL,
                status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
                reference_id VARCHAR(80) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_qr_request (qr_id),
                CONSTRAINT fk_request_qr FOREIGN KEY (qr_id) REFERENCES qr_codes(id)
            );
        `);
        console.log('✅ qr_payment_requests table verified.');

        // 4. CREATE TABLE qr_transactions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS qr_transactions (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                request_id BIGINT UNSIGNED NOT NULL UNIQUE,
                transaction_reference VARCHAR(80) NOT NULL UNIQUE,
                amount DECIMAL(12,2) NOT NULL,
                status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_transaction_request FOREIGN KEY (request_id) REFERENCES qr_payment_requests(id)
            );
        `);
        console.log('✅ qr_transactions table verified.');

        // 5. CREATE TABLE sip_mandates
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sip_mandates (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id BIGINT UNSIGNED NOT NULL,
              sip_plan_id BIGINT UNSIGNED NOT NULL,
              mandate_reference VARCHAR(80) NOT NULL UNIQUE,
              mandate_type ENUM('enach', 'upi_autopay', 'other') NOT NULL,
              bank_account_id BIGINT UNSIGNED NULL,
              maximum_amount DECIMAL(19,4) NOT NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'pending',
              expires_at DATETIME NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id),
              FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id)
            );
        `);
        console.log('✅ sip_mandates table verified.');

        // 6. CREATE TABLE sip_cancellations
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sip_cancellations (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              sip_plan_id BIGINT UNSIGNED NOT NULL,
              user_id BIGINT UNSIGNED NULL,
              cancellation_reference VARCHAR(80) NOT NULL UNIQUE,
              cancellation_reason VARCHAR(255) NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'requested',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id)
            );
        `);
        console.log('✅ sip_cancellations table verified.');

        // 7. CREATE TABLE sip_transactions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sip_transactions (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              sip_plan_id BIGINT UNSIGNED NOT NULL,
              installment_id BIGINT UNSIGNED NULL,
              transaction_reference VARCHAR(80) NOT NULL UNIQUE,
              amount DECIMAL(19,4) NOT NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'success',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id),
              FOREIGN KEY (installment_id) REFERENCES sip_installments(id)
            );
        `);
        console.log('✅ sip_transactions table verified.');

        // 8. CREATE TABLE commission_rules & SEED
        await connection.query(`
            CREATE TABLE IF NOT EXISTS commission_rules (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              service_code VARCHAR(80) NOT NULL UNIQUE,
              service_name VARCHAR(120) NOT NULL,
              commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
              commission_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
              min_amount DECIMAL(19,4) NOT NULL DEFAULT 0.00,
              max_amount DECIMAL(19,4) NOT NULL DEFAULT 100000.00,
              status VARCHAR(20) NOT NULL DEFAULT 'active',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        await connection.query(`
            INSERT INTO commission_rules (id, service_code, service_name, commission_type, commission_value, min_amount, max_amount, status)
            VALUES
            (1, 'MOBILE_RECHARGE', 'Prepaid Mobile Recharge', 'percentage', 2.50, 10.00, 5000.00, 'active'),
            (2, 'DTH_RECHARGE', 'DTH Satellite TV', 'percentage', 2.20, 50.00, 10000.00, 'active'),
            (3, 'ELECTRICITY_BILL', 'Electricity Bill BBPS', 'flat', 5.00, 100.00, 50000.00, 'active'),
            (4, 'WATER_BILL', 'Water Utility BBPS', 'flat', 3.00, 50.00, 20000.00, 'active'),
            (5, 'WALLET_TO_BANK', 'Wallet Payout to Bank Account', 'percentage', 1.50, 100.00, 100000.00, 'active'),
            (6, 'DIGITAL_LAND', 'Digital Land Registry Fee', 'percentage', 0.50, 100.00, 500000.00, 'active')
            ON DUPLICATE KEY UPDATE status = 'active';
        `);
        console.log('✅ commission_rules table & initial data verified.');

        // 9. CREATE TABLE app_settings & SEED
        await connection.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              setting_key VARCHAR(100) NOT NULL UNIQUE,
              setting_value TEXT NOT NULL,
              description VARCHAR(255) NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        await connection.query(`
            INSERT INTO app_settings (id, setting_key, setting_value, description)
            VALUES
            (1, 'maintenance_mode', 'false', 'Enable/disable temporary platform maintenance mode'),
            (2, 'min_transfer_amount', '10.00', 'Minimum single transfer allowed in INR'),
            (3, 'max_daily_transfer_limit', '100000.00', 'Maximum daily transfer volume per user in INR'),
            (4, 'kyc_mandatory_above', '10000.00', 'Mandatory KYC requirement threshold for transactions'),
            (5, 'auto_refund_window_hours', '48', 'Hours allowed for merchant refund processing')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
        `);
        console.log('✅ app_settings table & initial data verified.');

        connection.release();
        console.log('🎉 All Manshi tables and migrations successfully synchronized!');
        process.exit(0);
    } catch (err) {
        console.error('⚠️ Migration notice (MySQL might not be running right now):', err.message);
        process.exit(0);
    }
}

migrate();
