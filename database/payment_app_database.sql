CREATE DATABASE IF NOT EXISTS payment_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE payment_app;

-- =====================================================
-- 1. AUTHENTICATION & KYC (6 TABLES)
-- =====================================================

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  phone_verified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  date_of_birth DATE NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(15) NULL,
  profile_image_url VARCHAR(500) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE otp_verifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(40) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_otp_phone (phone, purpose, expires_at)
);

CREATE TABLE sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_session_user (user_id, expires_at)
);

CREATE TABLE kyc_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  provider_reference VARCHAR(150) NULL,
  verified_at DATETIME NULL,
  rejection_reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_kyc_user_status (user_id, verification_status)
);

CREATE TABLE kyc_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kyc_record_id BIGINT UNSIGNED NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  secure_storage_key VARCHAR(500) NOT NULL,
  document_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kyc_record_id) REFERENCES kyc_records(id)
);

-- =====================================================
-- 2. BANK ACCOUNTS, UPI & PROVIDERS (4 TABLES)
-- =====================================================

CREATE TABLE payment_providers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  bank_name VARCHAR(120) NOT NULL,
  account_number_encrypted VARBINARY(512) NULL,
  account_last4 CHAR(4) NULL,
  ifsc_code VARCHAR(11) NULL,
  account_holder_name VARCHAR(120) NULL,
  provider_token VARCHAR(255) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  INDEX idx_bank_user (user_id, status)
);

CREATE TABLE upi_handles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  bank_account_id BIGINT UNSIGNED NULL,
  upi_id VARCHAR(255) NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

CREATE TABLE provider_webhook_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id BIGINT UNSIGNED NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  UNIQUE KEY uq_provider_event (provider_id, event_id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
);

-- =====================================================
-- 3. PAYMENTS, TRANSFERS, QR & REFUNDS (6 TABLES)
-- =====================================================

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  bank_account_id BIGINT UNSIGNED NULL,
  payment_method VARCHAR(30) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL DEFAULT 'initiated',
  provider_reference VARCHAR(150) NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
  INDEX idx_payment_user_date (user_id, created_at),
  INDEX idx_payment_status (status, created_at),
  CHECK (amount > 0)
);

CREATE TABLE transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL UNIQUE,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  receiver_user_id BIGINT UNSIGNED NULL,
  receiver_upi_id VARCHAR(255) NULL,
  receiver_account_last4 CHAR(4) NULL,
  amount DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (sender_user_id) REFERENCES users(id),
  FOREIGN KEY (receiver_user_id) REFERENCES users(id),
  INDEX idx_transfer_sender (sender_user_id, created_at),
  CHECK (amount > 0)
);

CREATE TABLE payment_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL,
  provider_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL,
  error_code VARCHAR(100) NULL,
  error_message VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  UNIQUE KEY uq_payment_attempt (payment_id, attempt_number)
);

CREATE TABLE payment_methods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  method_type VARCHAR(30) NOT NULL,
  provider_token VARCHAR(255) NULL,
  display_label VARCHAR(100) NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE qr_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  qr_reference CHAR(36) NOT NULL UNIQUE,
  upi_id VARCHAR(255) NULL,
  fixed_amount DECIMAL(19,4) NULL,
  purpose VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (fixed_amount IS NULL OR fixed_amount > 0)
);

CREATE TABLE refunds (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  reason VARCHAR(255) NULL,
  provider_refund_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_refund_payment (payment_id, status),
  CHECK (amount > 0)
);

-- =====================================================
-- 4. WALLET & DOUBLE-ENTRY LEDGER (3 TABLES)
-- =====================================================

CREATE TABLE wallets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  available_balance DECIMAL(19,4) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wallet_user_currency (user_id, currency),
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (available_balance >= 0)
);

CREATE TABLE ledger_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_type VARCHAR(40) NOT NULL,
  reference_id BIGINT UNSIGNED NOT NULL,
  transaction_type VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ledger_reference
    (reference_type, reference_id, transaction_type)
);

CREATE TABLE ledger_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ledger_transaction_id BIGINT UNSIGNED NOT NULL,
  wallet_id BIGINT UNSIGNED NOT NULL,
  entry_type VARCHAR(10) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ledger_transaction_id)
    REFERENCES ledger_transactions(id),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id),
  INDEX idx_ledger_wallet_date (wallet_id, created_at),
  CHECK (entry_type IN ('debit', 'credit')),
  CHECK (amount > 0)
);

-- =====================================================
-- 5. HISTORY, DISPUTES & AUDIT (4 TABLES)
-- =====================================================

CREATE TABLE transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  transfer_id BIGINT UNSIGNED NULL,
  refund_id BIGINT UNSIGNED NULL,
  transaction_type VARCHAR(40) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (transfer_id) REFERENCES transfers(id),
  FOREIGN KEY (refund_id) REFERENCES refunds(id),
  INDEX idx_history_user_date (user_id, created_at)
);

CREATE TABLE disputes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NOT NULL,
  dispute_reason VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  resolution_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_dispute_status (status, created_at)
);

CREATE TABLE dispute_evidence (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispute_id BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  evidence_type VARCHAR(40) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id)
);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_type VARCHAR(20) NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_date (created_at)
);

-- =====================================================
-- 6. DIGITAL LAND (4 TABLES)
-- Demo/project feature; not a real land registry.
-- =====================================================

CREATE TABLE land_projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  location VARCHAR(255) NULL,
  unit_name VARCHAR(40) NOT NULL DEFAULT 'unit',
  price_per_unit DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (price_per_unit > 0)
);

CREATE TABLE land_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  units DECIMAL(19,4) NOT NULL,
  total_amount DECIMAL(19,4) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES land_projects(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  CHECK (units > 0 AND total_amount > 0)
);

CREATE TABLE land_holdings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  units_owned DECIMAL(19,4) NOT NULL DEFAULT 0,
  average_purchase_price DECIMAL(19,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_land_holding (user_id, project_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES land_projects(id),
  CHECK (units_owned >= 0)
);

CREATE TABLE land_valuations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  price_per_unit DECIMAL(19,4) NOT NULL,
  valuation_source VARCHAR(150) NULL,
  valued_at DATETIME NOT NULL,
  FOREIGN KEY (project_id) REFERENCES land_projects(id),
  INDEX idx_land_valuation_date (project_id, valued_at),
  CHECK (price_per_unit > 0)
);

-- =====================================================
-- 7. SIP & INVESTMENTS (4 TABLES)
-- =====================================================

CREATE TABLE sip_products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  provider_name VARCHAR(150) NULL,
  risk_level VARCHAR(30) NULL,
  minimum_investment DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (minimum_investment > 0)
);

CREATE TABLE sip_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  installment_amount DECIMAL(19,4) NOT NULL,
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  next_due_date DATE NULL,
  end_date DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES sip_products(id),
  INDEX idx_sip_due (status, next_due_date),
  CHECK (installment_amount > 0)
);

CREATE TABLE sip_installments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sip_plan_id BIGINT UNSIGNED NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  UNIQUE KEY uq_sip_installment (sip_plan_id, due_date),
  CHECK (amount > 0)
);

CREATE TABLE investment_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  sip_plan_id BIGINT UNSIGNED NULL,
  order_type VARCHAR(30) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  provider_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES sip_products(id),
  FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id),
  CHECK (amount > 0)
);

-- =====================================================
-- 8. NOTIFICATIONS & ADMIN (4 TABLES)
-- =====================================================

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(40) NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notification_user (user_id, read_at, created_at)
);

CREATE TABLE notification_preferences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE admin_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_name VARCHAR(80) NOT NULL DEFAULT 'support',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(80) NOT NULL,
  permission_key VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_permission (role_name, permission_key)
);

-- =====================================================
-- 9. MOBILE RECHARGE & BILL PAYMENTS (7 TABLES)
-- =====================================================

CREATE TABLE recharge_operators (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operator_name VARCHAR(120) NOT NULL,
  service_type VARCHAR(40) NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
);

CREATE TABLE recharge_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operator_id BIGINT UNSIGNED NOT NULL,
  plan_name VARCHAR(150) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  validity_days INT UNSIGNED NULL,
  benefits JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  FOREIGN KEY (operator_id) REFERENCES recharge_operators(id),
  CHECK (amount > 0)
);

CREATE TABLE recharge_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  operator_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NULL,
  mobile_number VARCHAR(20) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  provider_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (operator_id) REFERENCES recharge_operators(id),
  FOREIGN KEY (plan_id) REFERENCES recharge_plans(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_recharge_user_date (user_id, created_at),
  CHECK (amount > 0)
);

CREATE TABLE bill_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE billers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  biller_name VARCHAR(150) NOT NULL,
  biller_code VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  FOREIGN KEY (category_id) REFERENCES bill_categories(id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
);

CREATE TABLE bill_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  biller_id BIGINT UNSIGNED NOT NULL,
  customer_reference VARCHAR(255) NOT NULL,
  bill_reference VARCHAR(150) NULL,
  amount DECIMAL(19,4) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  provider_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  due_date DATE NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (biller_id) REFERENCES billers(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_bill_user_date (user_id, created_at),
  CHECK (amount > 0)
);

CREATE TABLE saved_billers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  biller_id BIGINT UNSIGNED NOT NULL,
  nickname VARCHAR(100) NULL,
  customer_reference_encrypted VARBINARY(1024) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (biller_id) REFERENCES billers(id),
  INDEX idx_saved_biller_user (user_id)
);

-- =====================================================
-- 10. OPERATIONS & SECURITY (5 TABLES)
-- =====================================================

CREATE TABLE provider_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id BIGINT UNSIGNED NOT NULL,
  internal_reference VARCHAR(150) NOT NULL,
  provider_reference VARCHAR(150) NULL,
  amount DECIMAL(19,4) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL,
  provider_payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  UNIQUE KEY uq_provider_internal (provider_id, internal_reference),
  INDEX idx_provider_reference (provider_id, provider_reference)
);

CREATE TABLE reconciliation_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id BIGINT UNSIGNED NOT NULL,
  reconciliation_date DATE NOT NULL,
  internal_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
  provider_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
  difference_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  UNIQUE KEY uq_reconciliation_day (provider_id, reconciliation_date)
);

CREATE TABLE webhook_delivery_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_event_id BIGINT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL DEFAULT 1,
  delivery_status VARCHAR(30) NOT NULL,
  response_code INT NULL,
  response_excerpt VARCHAR(1000) NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_event_id) REFERENCES provider_webhook_events(id),
  UNIQUE KEY uq_webhook_attempt (provider_event_id, attempt_number)
);

CREATE TABLE idempotency_keys (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  response_status INT NULL,
  response_body JSON NULL,
  resource_type VARCHAR(60) NULL,
  resource_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  UNIQUE KEY uq_user_idempotency (user_id, idempotency_key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  device_identifier_hash VARCHAR(255) NOT NULL,
  device_name VARCHAR(120) NULL,
  platform VARCHAR(40) NULL,
  push_token_encrypted VARBINARY(1024) NULL,
  last_seen_at DATETIME NULL,
  trusted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_user_device (user_id, device_identifier_hash)
);

-- =====================================================
-- END OF 47-TABLE STARTER SCHEMA
-- =====================================================