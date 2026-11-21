const express = require('express');
const cors = require('cors');

const app = express();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const upiRoutes = require('./routes/upiRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const landRoutes = require('./routes/landRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const billPaymentRoutes = require('./routes/billPaymentRoutes');
const notificationController = require('./controllers/notificationController');
const authMiddleware = require('./middleware/authMiddleware');

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication Routes - mounted at /api/v1, /api, and standard base paths
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/admin/auth', adminAuthRoutes);

// Bank Accounts and UPI Routes - mounted at /api/v1, /api, and root paths
app.use('/api/v1/bank-accounts', bankAccountRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/bank-accounts', bankAccountRoutes);

app.use('/api/v1/upi', upiRoutes);
app.use('/api/upi', upiRoutes);
app.use('/upi', upiRoutes);

// Wallet and Ledger Routes - mounted at /api/wallet, /api/v1/wallet and /wallet
app.use('/api/wallet', walletRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/wallet', walletRoutes);

// Transaction History Routes - mounted at /api/transactions, /api/v1/transactions and /transactions
app.use('/api/transactions', transactionRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/transactions', transactionRoutes);

// Digital Land Routes - mounted at /api/land, /api/v1/land and /land
app.use('/api/land', landRoutes);
app.use('/api/v1/land', landRoutes);
app.use('/land', landRoutes);

// Notification Routes - mounted at /api/notifications, /api/v1/notifications and /notifications
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/notification', notificationRoutes);

// Notification Preferences Routes - mounted at /api/notification-preferences, /api/v1/notification-preferences and /notification-preferences
app.get('/api/notification-preferences', authMiddleware, notificationController.getPreferences);
app.get('/api/v1/notification-preferences', authMiddleware, notificationController.getPreferences);
app.get('/notification-preferences', authMiddleware, notificationController.getPreferences);

// Bill Payment Routes - mounted at /api/bills, /api/v1/bills and /bills
app.use('/api/bills', billPaymentRoutes);
app.use('/api/v1/bills', billPaymentRoutes);
app.use('/bills', billPaymentRoutes);

// Health check API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ApnaPay API is running!'
    });
});

// API health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend is healthy'
    });
});

// Handle invalid JSON syntax in request bodies
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload sent in request body.'
        });
    }
    next(err);
});

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
});

module.exports = app;
