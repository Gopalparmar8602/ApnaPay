
require('dotenv').config();

const app = require('./app');
const db = require('./config/db');
const { warmTransporter } = require('./services/emailService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await db.getConnection();

    console.log('MySQL database connected successfully!');
    connection.release();

    app.listen(PORT, () => {
      console.log(`ApnaPay server running at http://localhost:${PORT}`);
      // Pre-warm SMTP pool in background for instant 1-2s OTP delivery
      warmTransporter().catch((err) => {
        console.warn('[Server] Pre-warm transporter note:', err.message);
      });
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

startServer();

