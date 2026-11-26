const db = require('../config/db');

async function migrate() {
  try {
    console.log('[Migration] Starting Step 3 & Wallet Limits migration for kyc_records...');

    const columnsToAdd = [
      { name: 'parent_relation', type: 'VARCHAR(50) NULL' },
      { name: 'parent_name', type: 'VARCHAR(150) NULL' },
      { name: 'marital_status', type: 'VARCHAR(50) NULL' },
      { name: 'occupation_type', type: 'VARCHAR(80) NULL' },
      { name: 'annual_income', type: 'VARCHAR(80) NULL' },
      { name: 'nominee_relation', type: 'VARCHAR(50) NULL' },
      { name: 'nominee_name', type: 'VARCHAR(150) NULL' },
      { name: 'nominee_dob', type: 'DATE NULL' },
      { name: 'has_disability', type: "VARCHAR(10) DEFAULT 'No'" },
      { name: 'is_tax_resident_india', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'is_pep', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'otp_ekyc_declaration', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'wallet_limit', type: 'DECIMAL(15,2) DEFAULT 100000.00' },
      { name: 'wallet_yearly_limit', type: 'DECIMAL(15,2) DEFAULT 200000.00' },
      { name: 'wallet_tier', type: "VARCHAR(50) DEFAULT 'STANDARD'" }
    ];

    const [existing] = await db.query('DESCRIBE kyc_records');
    const existingFieldNames = new Set(existing.map((c) => c.Field));

    for (const col of columnsToAdd) {
      if (!existingFieldNames.has(col.name)) {
        await db.query(`ALTER TABLE kyc_records ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[Migration] Added column: ${col.name}`);
      } else {
        console.log(`[Migration] Column already exists: ${col.name}`);
      }
    }

    console.log('[Migration] Step 3 KYC migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Failed:', err);
    process.exit(1);
  }
}

migrate();
