const db = require('../config/db');

async function seedElectricityBillers() {
  console.log('--- Seeding Representative Electricity Billers ---');
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Add state column to billers if not exists
    const [cols] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'billers' AND COLUMN_NAME = 'state'`
    );

    if (cols[0].cnt === 0) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN state VARCHAR(100) NULL AFTER biller_code`);
      console.log('Added state column to billers table.');
    }

    // 2. Ensure electricity category exists and get its ID
    let [catRows] = await conn.execute(
      `SELECT id FROM bill_categories WHERE category_key = 'electricity' LIMIT 1`
    );

    let electricityCatId;
    if (catRows.length === 0) {
      const [insertCat] = await conn.execute(
        `INSERT INTO bill_categories (category_name, category_key, description, icon, display_order, status)
         VALUES ('Electricity', 'electricity', 'Electricity bills for state and private discoms across India', 'Zap', 1, 'active')`
      );
      electricityCatId = insertCat.insertId;
      console.log('Created electricity category with ID:', electricityCatId);
    } else {
      electricityCatId = catRows[0].id;
    }

    // 3. Representative Electricity Billers from all requested states
    const electricityBillers = [
      // Madhya Pradesh
      {
        name: 'MP Paschim Kshetra Vidyut Vitaran Company (MPPKVVCL)',
        code: 'MPPKVVCL-W',
        state: 'Madhya Pradesh',
        paramName: 'Service Connection Number (IVRS)',
        placeholder: 'Enter 10-digit IVRS number (e.g. 1000234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit IVRS number on top of your West MP electricity bill'
      },
      {
        name: 'MP Poorv Kshetra Vidyut Vitaran Company (MPPKVCL-JBP)',
        code: 'MPPKVCL-JBP',
        state: 'Madhya Pradesh',
        paramName: 'Consumer Number',
        placeholder: 'Enter 10-digit consumer number (e.g. 2000543210)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit consumer number on your East MP bill statement'
      },
      {
        name: 'Madhya Pradesh Madhya Kshetra Vidyut Vitaran Company (MPMKVVCL)',
        code: 'MPMKVVCL-BPL',
        state: 'Madhya Pradesh',
        paramName: 'IVRS Number',
        placeholder: 'Enter 10-digit IVRS number (e.g. 3000987654)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit IVRS consumer number for Central MP Bhopal/Gwalior'
      },

      // Delhi
      {
        name: 'BSES Rajdhani Power Limited',
        code: 'BSES-RAJ',
        state: 'Delhi',
        paramName: 'CA Number (Contract Account)',
        placeholder: 'Enter 9-digit CA number (e.g. 100123456)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit CA number displayed on top of BSES Rajdhani bill'
      },
      {
        name: 'BSES Yamuna Power Limited',
        code: 'BSES-YAM',
        state: 'Delhi',
        paramName: 'CA Number (Contract Account)',
        placeholder: 'Enter 9-digit CA number (e.g. 150987654)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit CA number displayed on top of BSES Yamuna bill'
      },
      {
        name: 'Tata Power Delhi Distribution Limited',
        code: 'TPDDL-DEL',
        state: 'Delhi',
        paramName: 'Consumer Account Number (CA)',
        placeholder: 'Enter 11-digit CA number (e.g. 60001234567)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit CA number shown on top-right of your Tata Power Delhi bill'
      },

      // Maharashtra
      {
        name: 'Adani Electricity Mumbai Limited',
        code: 'ADANI-MUM',
        state: 'Maharashtra',
        paramName: 'Customer Account Number',
        placeholder: 'Enter 9-digit account number (e.g. 150123456)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit account number starting with 10 or 15'
      },
      {
        name: 'Tata Power Mumbai',
        code: 'TATAPOWER-MUM',
        state: 'Maharashtra',
        paramName: 'Consumer Number (CA)',
        placeholder: 'Enter 12-digit CA number (e.g. 900001234567)',
        regex: '^[0-9]{11,12}$',
        minLen: 11,
        maxLen: 12,
        helpText: '11 or 12-digit consumer number on your Tata Power Mumbai statement'
      },
      {
        name: 'Maharashtra State Electricity Distribution Co Ltd (MSEDCL)',
        code: 'MSEDCL-MAHA',
        state: 'Maharashtra',
        paramName: 'Consumer Number (12 digits)',
        placeholder: 'Enter 12-digit consumer number (e.g. 012345678901)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit consumer number printed on your Mahavitaran bill'
      },

      // Uttar Pradesh
      {
        name: 'Uttar Pradesh Power Corporation Limited (UPPCL - Urban)',
        code: 'UPPCL-URBAN',
        state: 'Uttar Pradesh',
        paramName: 'Consumer Account Number',
        placeholder: 'Enter 10-digit account number (e.g. 7210123456)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit urban consumer account number on your UPPCL invoice'
      },
      {
        name: 'Uttar Pradesh Power Corporation Limited (UPPCL - Rural)',
        code: 'UPPCL-RURAL',
        state: 'Uttar Pradesh',
        paramName: 'Account Number',
        placeholder: 'Enter 12-digit rural account number (e.g. 721012345678)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit rural consumer account number on your UPPCL invoice'
      },

      // Rajasthan
      {
        name: 'Jaipur Vidyut Vitran Nigam Limited (JVVNL)',
        code: 'JVVNL-RAJ',
        state: 'Rajasthan',
        paramName: 'K Number',
        placeholder: 'Enter 12-digit K Number (e.g. 210123456789)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit K Number on top left of your Jaipur Discom electricity bill'
      },
      {
        name: 'Ajmer Vidyut Vitran Nigam Limited (AVVNL)',
        code: 'AVVNL-RAJ',
        state: 'Rajasthan',
        paramName: 'K Number',
        placeholder: 'Enter 12-digit K Number (e.g. 220123456789)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit K Number on top left of your Ajmer Discom electricity bill'
      },
      {
        name: 'Jodhpur Vidyut Vitran Nigam Limited (JdVVNL)',
        code: 'JDVVNL-RAJ',
        state: 'Rajasthan',
        paramName: 'K Number',
        placeholder: 'Enter 12-digit K Number (e.g. 230123456789)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit K Number on top left of your Jodhpur Discom electricity bill'
      },

      // Gujarat
      {
        name: 'Dakshin Gujarat Vij Company Limited (DGVCL)',
        code: 'DGVCL-GUJ',
        state: 'Gujarat',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 01234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on your DGVCL bill'
      },
      {
        name: 'Madhya Gujarat Vij Company Limited (MGVCL)',
        code: 'MGVCL-GUJ',
        state: 'Gujarat',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 02234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on your MGVCL bill'
      },
      {
        name: 'Paschim Gujarat Vij Company Limited (PGVCL)',
        code: 'PGVCL-GUJ',
        state: 'Gujarat',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 03234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on your PGVCL bill'
      },
      {
        name: 'Uttar Gujarat Vij Company Limited (UGVCL)',
        code: 'UGVCL-GUJ',
        state: 'Gujarat',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 04234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on your UGVCL bill'
      },
      {
        name: 'Torrent Power Limited',
        code: 'TORRENT-GUJ',
        state: 'Gujarat',
        paramName: 'Service Number',
        placeholder: 'Enter 10-digit service number (e.g. 1023456789)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit service number on Torrent Power Ahmedabad/Surat bill'
      },

      // Karnataka
      {
        name: 'Bangalore Electricity Supply Company (BESCOM)',
        code: 'BESCOM-KA',
        state: 'Karnataka',
        paramName: 'Account ID / Connection ID',
        placeholder: 'Enter 10-digit Account ID (e.g. 5600123456)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit Account ID printed on your BESCOM electricity bill'
      },

      // Telangana
      {
        name: 'Telangana State Southern Power Distribution (TSSPDCL)',
        code: 'TSSPDCL-TG',
        state: 'Telangana',
        paramName: 'Unique Service Number (USC)',
        placeholder: 'Enter 9 to 11-digit USC number (e.g. 102345678)',
        regex: '^[0-9]{9,11}$',
        minLen: 9,
        maxLen: 11,
        helpText: 'Unique Service Number (USC) printed on your TSSPDCL bill'
      },

      // Haryana
      {
        name: 'Dakshin Haryana Bijli Vitran Nigam (DHBVN)',
        code: 'DHBVN-HR',
        state: 'Haryana',
        paramName: 'Account Number',
        placeholder: 'Enter 10-digit account number (e.g. 6001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit account number on your DHBVN bill'
      },
      {
        name: 'Uttar Haryana Bijli Vitran Nigam (UHBVN)',
        code: 'UHBVN-HR',
        state: 'Haryana',
        paramName: 'Account Number',
        placeholder: 'Enter 10-digit account number (e.g. 7001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit account number on your UHBVN bill'
      }
    ];

    for (const b of electricityBillers) {
      const [existing] = await conn.execute(
        `SELECT id FROM billers WHERE biller_code = ? OR biller_name = ? LIMIT 1`,
        [b.code, b.name]
      );

      if (existing.length === 0) {
        await conn.execute(
          `INSERT INTO billers 
            (category_id, biller_name, biller_code, state, param_name, param_placeholder, param_regex, param_min_length, param_max_length, param_help_text, is_demo, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'active')`,
          [electricityCatId, b.name, b.code, b.state, b.paramName, b.placeholder, b.regex, b.minLen, b.maxLen, b.helpText]
        );
        console.log(`   + Added: [${b.state}] ${b.name}`);
      } else {
        await conn.execute(
          `UPDATE billers 
           SET category_id = ?, biller_name = ?, biller_code = ?, state = ?, param_name = ?, param_placeholder = ?, param_regex = ?, param_min_length = ?, param_max_length = ?, param_help_text = ?, is_demo = TRUE, status = 'active'
           WHERE id = ?`,
          [electricityCatId, b.name, b.code, b.state, b.paramName, b.placeholder, b.regex, b.minLen, b.maxLen, b.helpText, existing[0].id]
        );
        console.log(`   ~ Updated: [${b.state}] ${b.name}`);
      }
    }

    // Also update existing water/gas/etc billers state if NULL to reasonable default
    await conn.execute(`UPDATE billers SET state = 'National' WHERE state IS NULL`);

    await conn.commit();
    console.log(`--- Seeding Complete: ${electricityBillers.length} Electricity Billers active ---`);
  } catch (err) {
    await conn.rollback();
    console.error('Error seeding electricity billers:', err);
    throw err;
  } finally {
    conn.release();
  }
}

seedElectricityBillers().then(() => process.exit(0)).catch(() => process.exit(1));
