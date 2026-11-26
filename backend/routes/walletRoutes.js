const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

// All wallet endpoints strictly require valid JWT customer authentication
router.use(authMiddleware);

// 1. GET /api/wallet - Wallet overview
router.get('/', walletController.getWalletOverview);

// 2. GET /api/wallet/balance - Get available wallet balance
router.get('/balance', walletController.getWalletBalance);

// 3. GET /api/wallet/ledger - Get debit and credit entries
router.get('/ledger', walletController.getWalletLedger);

// 4. GET /api/wallet/summary - Get wallet balance summary
router.get('/summary', walletController.getWalletSummary);

// 5. GET /api/wallet/limits - Get transaction limits
router.get('/limits', walletController.getWalletLimits);

// 6. POST /api/wallet/add-money - Add funds to wallet (Instant top-up)
router.post('/add-money', walletController.addMoney);
router.post('/top-up', walletController.addMoney);

// 7. POST /api/wallet/withdraw - Withdraw funds to linked bank
router.post('/withdraw', walletController.withdrawMoney);

// 8. POST /api/wallet/transfer - Wallet-to-wallet transfer
router.post('/transfer', walletController.transferWallet);

// 9. POST /api/wallet/link-bank - Quick link bank from Wallet Withdraw
router.post('/link-bank', walletController.quickLinkBank);

module.exports = router;

