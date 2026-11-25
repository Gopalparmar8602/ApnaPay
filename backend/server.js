const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const db = require('./config/db');
const { warmTransporter } = require('./services/emailService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log('MySQL database connected successfully!');
    connection.release();
  } catch (error) {
    const errMsg = error.code || error.message || (error.errors && error.errors[0]?.message) || 'ECONNREFUSED';
    console.warn(`[Database Warning] Could not connect to MySQL (${errMsg}).`);
    console.warn(`Please ensure your MySQL service (e.g. XAMPP) is running on port ${process.env.DB_PORT || 3306}.`);
  }

  app.listen(PORT, () => {
    console.log(`ApnaPay server running at http://localhost:${PORT}`);
    // Pre-warm SMTP pool in background for instant 1-2s OTP delivery
    if (typeof warmTransporter === 'function') {
      warmTransporter().catch((err) => {
        console.warn('[SMTP Warning] Pre-warm connection failed:', err.message);
      });
    }
  });
}

startServer();
