const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const bankAccountController = require('../controllers/bankAccountController');

// All bank account operations require customer authentication
router.use(authMiddleware);

// 1. GET /bank-accounts - List linked bank accounts
router.get('/', bankAccountController.getLinkedAccounts);

// 2. POST /bank-accounts/link - Initiate bank linking
router.post('/link', bankAccountController.initiateLink);

// 3. POST /bank-accounts/verify - Verify bank linking
router.post('/verify', bankAccountController.verifyAccount);

// 4. POST /bank-accounts/resend-otp - Resend verification OTP
router.post('/resend-otp', bankAccountController.resendOtp);
router.post('/:id/resend-otp', bankAccountController.resendOtp);

// 5. DELETE /bank-accounts/:id - Unlink bank account
router.delete('/:id', bankAccountController.unlinkAccount);

// 6. PATCH /bank-accounts/:id/primary - Set primary account
router.patch('/:id/primary', bankAccountController.setPrimaryAccount);
router.put('/:id/primary', bankAccountController.setPrimaryAccount);
router.post('/:id/primary', bankAccountController.setPrimaryAccount);

// 7. POST /bank-accounts/:id/upi-pin - Set / update UPI PIN
router.post('/:id/upi-pin', bankAccountController.setUpiPin);

// 8. POST /bank-accounts/:id/check-balance - Verify UPI PIN & fetch bank balance
router.post('/:id/check-balance', bankAccountController.checkBalance);

module.exports = router;

