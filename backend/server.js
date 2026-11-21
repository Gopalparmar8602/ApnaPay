
require('dotenv').config();

const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await db.getConnection();

    console.log('MySQL database connected successfully!');
    connection.release();

    app.listen(PORT, () => {
      console.log(`ApnaPay server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

startServer();

