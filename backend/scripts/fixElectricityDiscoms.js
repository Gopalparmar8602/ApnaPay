const db = require('../config/db');

async function fixAndEnrichElectricityBillers() {
  console.log('--- Cleaning Duplicate Billers & Adding Regional Discom Mapping ---');
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Add region_name and districts columns if not exist
    const checkCol = async (col) => {
      const [res] = await conn.execute(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'billers' AND COLUMN_NAME = ?`,
        [col]
      );
      return res[0].cnt > 0;
    };

    if (!await checkCol('region_name')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN region_name VARCHAR(150) NULL AFTER state`);
      console.log('Added region_name column to billers table.');
    }
    if (!await checkCol('districts')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN districts TEXT NULL AFTER region_name`);
      console.log('Added districts column to billers table.');
    }

    // 2. Clean up foreign keys on old duplicates before deleting them
    // id: 3 (old generic TATAPOWER) -> re-point any bill_fetches/payments/favorites to id: 45 (Tata Power Delhi) or 46 (Tata Power Mumbai)
    await conn.execute(`UPDATE bill_fetches SET biller_id = 45 WHERE biller_id = 3`);
    await conn.execute(`UPDATE bill_payments SET biller_id = 45 WHERE biller_id = 3`);
    await conn.execute(`UPDATE bill_favorites SET biller_id = 45 WHERE biller_id = 3`);

    // id: 2 (old MPPKVVCL-E duplicate) -> re-point to id: 41
    await conn.execute(`UPDATE bill_fetches SET biller_id = 41 WHERE biller_id = 2`);
    await conn.execute(`UPDATE bill_payments SET biller_id = 41 WHERE biller_id = 2`);
    await conn.execute(`UPDATE bill_favorites SET biller_id = 41 WHERE biller_id = 2`);

    // id: 5 (old BSES-RDL duplicate) -> re-point to id: 43
    await conn.execute(`UPDATE bill_fetches SET biller_id = 43 WHERE biller_id = 5`);
    await conn.execute(`UPDATE bill_payments SET biller_id = 43 WHERE biller_id = 5`);
    await conn.execute(`UPDATE bill_favorites SET biller_id = 43 WHERE biller_id = 5`);

    // Delete duplicate rows
    await conn.execute(`DELETE FROM billers WHERE id IN (2, 3, 5)`);
    console.log('Removed duplicate billers (id: 2, 3, 5).');

    // 3. Complete, verified Electricity Discom mapping with primary regions & districts
    const verifiedBillers = [
      // --- MADHYA PRADESH ---
      {
        id: 1,
        code: 'MPPKVVCL-W',
        name: 'MP Paschim Kshetra Vidyut Vitaran Company (MPPKVVCL – West Discom)',
        state: 'Madhya Pradesh',
        region: 'West Discom (Indore & Ujjain Region)',
        districts: 'Indore, Ujjain, Dewas, Dhar, Khargone, Khandwa, Ratlam, Mandsaur, Neemuch, Barwani, Jhabua, Alirajpur, Burhanpur, Agar Malwa, Shajapur',
        paramName: 'Service Connection Number (IVRS)',
        placeholder: 'Enter 10-digit IVRS number (e.g. 1000234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit IVRS number for Indore & Western MP electricity bill'
      },
      {
        id: 42,
        code: 'MPMKVVCL-C',
        name: 'MP Madhya Kshetra Vidyut Vitaran Company (MPMKVVCL – Central Discom)',
        state: 'Madhya Pradesh',
        region: 'Central Discom (Bhopal & Gwalior Region)',
        districts: 'Bhopal, Gwalior, Sehore, Vidisha, Raisen, Hoshangabad, Narmadapuram, Rajgarh, Betul, Guna, Shivpuri, Bhind, Morena, Sheopur, Datia, Ashoknagar',
        paramName: 'IVRS Number',
        placeholder: 'Enter 10-digit IVRS number (e.g. 3000987654)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit IVRS number for Bhopal, Gwalior & Central MP bill'
      },
      {
        id: 41,
        code: 'MPPKVVCL-JBP',
        name: 'MP Poorv Kshetra Vidyut Vitaran Company (MPPKVVCL-JBP – East Discom)',
        state: 'Madhya Pradesh',
        region: 'East Discom (Jabalpur, Rewa & Sagar Region)',
        districts: 'Jabalpur, Rewa, Sagar, Satna, Katni, Chhindwara, Damoh, Shahdol, Singrauli, Sidhi, Seoni, Mandla, Narsinghpur, Panna, Chhatarpur, Tikamgarh, Dindori, Umaria, Anuppur, Niwari',
        paramName: 'Consumer Number',
        placeholder: 'Enter 10-digit consumer number (e.g. 2000543210)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit consumer number for Jabalpur & Eastern MP bill'
      },

      // --- DELHI ---
      {
        id: 43,
        code: 'BSES-RAJ',
        name: 'BSES Rajdhani Power Limited',
        state: 'Delhi',
        region: 'South & West Delhi',
        districts: 'South Delhi, West Delhi, Dwarka, Saket, Janakpuri, Nehru Place, Vasant Kunj, Hauz Khas, Punjabi Bagh, Palam',
        paramName: 'CA Number (Contract Account)',
        placeholder: 'Enter 9-digit CA number (e.g. 100123456)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit CA number on top of your BSES Rajdhani bill'
      },
      {
        id: 44,
        code: 'BSES-YAM',
        name: 'BSES Yamuna Power Limited',
        state: 'Delhi',
        region: 'East & Central Delhi',
        districts: 'East Delhi, Central Delhi, Laxmi Nagar, Mayur Vihar, Chandni Chowk, Daryaganj, Shahdara, Yamuna Vihar, Karawal Nagar, Anand Vihar',
        paramName: 'CA Number (Contract Account)',
        placeholder: 'Enter 9-digit CA number (e.g. 150987654)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit CA number on top of your BSES Yamuna bill'
      },
      {
        id: 45,
        code: 'TPDDL-DEL',
        name: 'Tata Power Delhi Distribution Limited',
        state: 'Delhi',
        region: 'North & North-West Delhi',
        districts: 'North Delhi, North West Delhi, Rohini, Pitampura, Model Town, Civil Lines, Shalimar Bagh, Narela, Bawana, Badli',
        paramName: 'Consumer Account Number (CA)',
        placeholder: 'Enter 11-digit CA number (e.g. 60001234567)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit CA number on top-right of your Tata Power Delhi bill'
      },

      // --- MAHARASHTRA ---
      {
        id: 4,
        code: 'ADANI-MUM',
        name: 'Adani Electricity Mumbai Limited',
        state: 'Maharashtra',
        region: 'Mumbai Suburban Area',
        districts: 'Mumbai Suburban, Bandra, Andheri, Borivali, Dahisar, Kurla, Ghatkopar, Chembur, Mankhurd, Goregaon, Malad, Kandivali',
        paramName: 'Customer Account Number',
        placeholder: 'Enter 9-digit account number (e.g. 150123456)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit account number starting with 10 or 15'
      },
      {
        id: 46,
        code: 'TATAPOWER-MUM',
        name: 'Tata Power Mumbai',
        state: 'Maharashtra',
        region: 'Mumbai City & Suburban',
        districts: 'Mumbai City, South Mumbai, Colaba, Dadar, Worli, Chembur, Trombay, Kalyan, Dombivli, Mira Bhayandar',
        paramName: 'Consumer Number (CA)',
        placeholder: 'Enter 12-digit CA number (e.g. 900001234567)',
        regex: '^[0-9]{11,12}$',
        minLen: 11,
        maxLen: 12,
        helpText: '11 or 12-digit consumer number on Tata Power Mumbai statement'
      },
      {
        id: 47,
        code: 'MSEDCL-MAHA',
        name: 'Maharashtra State Electricity Distribution Co Ltd (MSEDCL / Mahavitaran)',
        state: 'Maharashtra',
        region: 'Rest of Maharashtra',
        districts: 'Pune, Nagpur, Nashik, Thane, Navi Mumbai, Aurangabad, Chhatrapati Sambhajinagar, Kolhapur, Solapur, Amravati, Nanded, Jalgaon, Akola, Satara, Sangli, Ratnagiri, Ahmednagar',
        paramName: 'Consumer Number (12 digits)',
        placeholder: 'Enter 12-digit consumer number (e.g. 012345678901)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit consumer number printed on Mahavitaran bill'
      },

      // --- RAJASTHAN ---
      {
        id: 50,
        code: 'JVVNL-RAJ',
        name: 'Jaipur Vidyut Vitran Nigam Limited (JVVNL)',
        state: 'Rajasthan',
        region: 'Jaipur & Eastern Rajasthan',
        districts: 'Jaipur, Alwar, Dausa, Bharatpur, Dholpur, Kota, Baran, Jhalawar, Bundi, Tonk, Sawai Madhopur',
        paramName: 'K Number',
        placeholder: 'Enter 12-digit K Number (e.g. 210123456789)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit K Number on top left of your Jaipur Discom bill'
      },
      {
        id: 51,
        code: 'AVVNL-RAJ',
        name: 'Ajmer Vidyut Vitran Nigam Limited (AVVNL)',
        state: 'Rajasthan',
        region: 'Ajmer & Central/Southern Rajasthan',
        districts: 'Ajmer, Bhilwara, Nagaur, Jhunjhunu, Sikar, Udaipur, Rajsamand, Chittorgarh, Banswara, Dungarpur, Pratapgarh',
        paramName: 'K Number',
        placeholder: 'Enter 12-digit K Number (e.g. 220123456789)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit K Number on top left of your Ajmer Discom bill'
      },
      {
        id: 52,
        code: 'JDVVNL-RAJ',
        name: 'Jodhpur Vidyut Vitran Nigam Limited (JdVVNL)',
        state: 'Rajasthan',
        region: 'Jodhpur & Western Rajasthan',
        districts: 'Jodhpur, Bikaner, Barmer, Jaisalmer, Jalore, Pali, Sirohi, Sri Ganganagar, Hanumangarh, Churu',
        paramName: 'K Number',
        placeholder: 'Enter 12-digit K Number (e.g. 230123456789)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit K Number on top left of your Jodhpur Discom bill'
      },

      // --- GUJARAT ---
      {
        id: 53,
        code: 'DGVCL-GUJ',
        name: 'Dakshin Gujarat Vij Company Limited (DGVCL)',
        state: 'Gujarat',
        region: 'South Gujarat',
        districts: 'Surat, Navsari, Valsad, Bharuch, Tapi, Dang',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 01234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on DGVCL bill'
      },
      {
        id: 54,
        code: 'MGVCL-GUJ',
        name: 'Madhya Gujarat Vij Company Limited (MGVCL)',
        state: 'Gujarat',
        region: 'Central Gujarat',
        districts: 'Vadodara, Anand, Kheda, Panchmahal, Dahod, Mahisagar, Chhotaudepur',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 02234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on MGVCL bill'
      },
      {
        id: 55,
        code: 'PGVCL-GUJ',
        name: 'Paschim Gujarat Vij Company Limited (PGVCL)',
        state: 'Gujarat',
        region: 'Saurashtra & Kutch',
        districts: 'Rajkot, Jamnagar, Bhavnagar, Junagadh, Porbandar, Amreli, Surendranagar, Kutch, Morbi, Gir Somnath, Botad, Devbhoomi Dwarka',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 03234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on PGVCL bill'
      },
      {
        id: 56,
        code: 'UGVCL-GUJ',
        name: 'Uttar Gujarat Vij Company Limited (UGVCL)',
        state: 'Gujarat',
        region: 'North Gujarat',
        districts: 'Mehsana, Gandhinagar, Sabarkantha, Banaskantha, Patan, Aravalli',
        paramName: 'Consumer Number',
        placeholder: 'Enter 11-digit consumer number (e.g. 04234567890)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit consumer number on UGVCL bill'
      },
      {
        id: 57,
        code: 'TORRENT-GUJ',
        name: 'Torrent Power Limited',
        state: 'Gujarat',
        region: 'Ahmedabad, Gandhinagar & Surat City',
        districts: 'Ahmedabad, Gandhinagar, Surat',
        paramName: 'Service Number',
        placeholder: 'Enter 10-digit service number (e.g. 1023456789)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit service number on Torrent Power Ahmedabad/Surat bill'
      },

      // --- UTTAR PRADESH ---
      {
        id: 48,
        code: 'UPPCL-URBAN',
        name: 'Uttar Pradesh Power Corporation Limited (UPPCL - Urban)',
        state: 'Uttar Pradesh',
        region: 'All UP Urban Municipal Areas',
        districts: 'Lucknow, Kanpur, Varanasi, Prayagraj, Allahabad, Agra, Meerut, Ghaziabad, Noida, Greater Noida, Bareilly, Gorakhpur, Aligarh, Moradabad, Jhansi, Saharanpur, Mathura, Ayodhya, Firozabad',
        paramName: 'Consumer Account Number',
        placeholder: 'Enter 10-digit account number (e.g. 7210123456)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit urban consumer account number on UPPCL invoice'
      },
      {
        id: 49,
        code: 'UPPCL-RURAL',
        name: 'Uttar Pradesh Power Corporation Limited (UPPCL - Rural)',
        state: 'Uttar Pradesh',
        region: 'All UP Rural Gram Panchayat Areas',
        districts: 'All Rural Areas across Uttar Pradesh, Barabanki, Sitapur, Unnao, Rae Bareli, Sultanpur, Basti, Deoria, Azamgarh, Mirzapur, Ballia, Jaunpur, Ghazipur, Hardoi, Lakhimpur, Badaun',
        paramName: 'Account Number',
        placeholder: 'Enter 12-digit rural account number (e.g. 721012345678)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit rural consumer account number on UPPCL invoice'
      },

      // --- KARNATAKA ---
      {
        id: 58,
        code: 'BESCOM-KA',
        name: 'Bangalore Electricity Supply Company (BESCOM)',
        state: 'Karnataka',
        region: 'Bengaluru & Central Karnataka',
        districts: 'Bengaluru Urban, Bangalore Urban, Bengaluru Rural, Bangalore Rural, Ramanagara, Tumakuru, Chikkaballapura, Kolar, Davanagere, Chitradurga',
        paramName: 'Account ID / Connection ID',
        placeholder: 'Enter 10-digit Account ID (e.g. 5600123456)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit Account ID on BESCOM electricity bill'
      },

      // --- TELANGANA ---
      {
        id: 59,
        code: 'TSSPDCL-TG',
        name: 'Telangana State Southern Power Distribution (TSSPDCL)',
        state: 'Telangana',
        region: 'Southern Telangana & Hyderabad',
        districts: 'Hyderabad, Secunderabad, Ranga Reddy, Medchal-Malkajgiri, Vikarabad, Mahabubnagar, Nalgonda, Suryapet, Wanaparthy, Nagarkurnool',
        paramName: 'Unique Service Number (USC)',
        placeholder: 'Enter 9 to 11-digit USC number (e.g. 102345678)',
        regex: '^[0-9]{9,11}$',
        minLen: 9,
        maxLen: 11,
        helpText: 'Unique Service Number (USC) printed on TSSPDCL bill'
      },

      // --- HARYANA ---
      {
        id: 60,
        code: 'DHBVN-HR',
        name: 'Dakshin Haryana Bijli Vitran Nigam (DHBVN)',
        state: 'Haryana',
        region: 'South & West Haryana',
        districts: 'Gurugram, Gurgaon, Faridabad, Hisar, Rohtak, Sirsa, Rewari, Palwal, Narnaul, Mahendragarh, Bhiwani, Fatehabad, Jind, Charkhi Dadri',
        paramName: 'Account Number',
        placeholder: 'Enter 10-digit account number (e.g. 6001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit account number on DHBVN bill'
      },
      {
        id: 61,
        code: 'UHBVN-HR',
        name: 'Uttar Haryana Bijli Vitran Nigam (UHBVN)',
        state: 'Haryana',
        region: 'North & East Haryana',
        districts: 'Panchkula, Ambala, Yamunanagar, Kurukshetra, Kaithal, Karnal, Panipat, Sonipat, Jhajjar',
        paramName: 'Account Number',
        placeholder: 'Enter 10-digit account number (e.g. 7001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit account number on UHBVN bill'
      }
    ];

    for (const b of verifiedBillers) {
      await conn.execute(
        `UPDATE billers 
         SET biller_name = ?, biller_code = ?, state = ?, region_name = ?, districts = ?,
             param_name = ?, param_placeholder = ?, param_regex = ?, param_min_length = ?, param_max_length = ?, param_help_text = ?,
             status = 'active', is_demo = TRUE
         WHERE id = ?`,
        [
          b.name,
          b.code,
          b.state,
          b.region,
          b.districts,
          b.paramName,
          b.placeholder,
          b.regex,
          b.minLen,
          b.maxLen,
          b.helpText,
          b.id
        ]
      );
      console.log(`   ~ Synced [${b.code}] ${b.name}`);
    }

    await conn.commit();
    console.log('--- Regional Discom Mapping & Duplicate Cleanup Complete ---');
  } catch (err) {
    await conn.rollback();
    console.error('Error fixing electricity billers:', err);
    throw err;
  } finally {
    conn.release();
  }
}

fixAndEnrichElectricityBillers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
