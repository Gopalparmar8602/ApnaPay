
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upiController = require('../controllers/upiController');

// All UPI handle operations require customer authentication
router.use(authMiddleware);

// 1. GET /upi/handles - List user's UPI handles
router.get('/handles', upiController.getUpiHandles);

// 2. POST /upi/handles - Register / request new UPI handle
router.post('/handles', upiController.createUpiHandle);

// 3. DELETE /upi/handles/:id - Delete UPI handle
router.delete('/handles/:id', upiController.deleteUpiHandle);

// 4. PATCH /upi/handles/:id/primary - Set default UPI handle
router.patch('/handles/:id/primary', upiController.setPrimaryUpiHandle);

module.exports = router;
