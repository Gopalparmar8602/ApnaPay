const pool = require('../config/db');

async function migrateKycSchema() {
  console.log('🚀 Running KYC PAN & Aadhaar Schema Migration...');
  try {
    const columns = [
      { name: 'pan_number', type: 'VARCHAR(30) NULL' },
      { name: 'pan_name', type: 'VARCHAR(150) NULL' },
      { name: 'pan_dob', type: 'DATE NULL' },
      { name: 'pan_verification_status', type: "VARCHAR(30) DEFAULT 'unverified'" },
      { name: 'pan_verified_at', type: 'DATETIME NULL' },
      { name: 'aadhaar_number', type: 'VARCHAR(30) NULL' },
      { name: 'aadhaar_verification_status', type: "VARCHAR(30) DEFAULT 'unverified'" },
      { name: 'aadhaar_verified_at', type: 'DATETIME NULL' },
      { name: 'kyc_type', type: "VARCHAR(50) DEFAULT 'Full KYC'" },
      { name: 'kyc_step', type: 'INT DEFAULT 1' },
      { name: 'remarks', type: 'TEXT NULL' }
    ];

    const [existingCols] = await pool.query('DESCRIBE kyc_records');
    const existingFieldNames = existingCols.map(c => c.Field);

    for (const col of columns) {
      if (!existingFieldNames.includes(col.name)) {
        console.log(`Adding column ${col.name} to kyc_records...`);
        await pool.query(`ALTER TABLE kyc_records ADD COLUMN ${col.name} ${col.type}`);
      } else {
        console.log(`Column ${col.name} already exists in kyc_records.`);
      }
    }

    const [finalCols] = await pool.query('DESCRIBE kyc_records');
    console.log('✅ Final kyc_records columns:', finalCols.map(c => c.Field));
    process.exit(0);
  } catch (err) {
    console.error('❌ KYC migration error:', err);
    process.exit(1);
  }
}

migrateKycSchema();
