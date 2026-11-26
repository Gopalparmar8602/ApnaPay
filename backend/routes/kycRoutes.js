const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getKycStatus,
  sendMobileOtp,
  verifyMobileOtp,
  resendMobileOtp,
  updatePersonalDetails,
  submitKyc,
  addKycDocument,
  getKycDocuments,
  deleteKycDocument,
  initiatePanVerification,
  verifyPanOtp,
  resendPanOtp,
  initiateAadhaarVerification,
  verifyAadhaarOtp,
  resendAadhaarOtp,
  submitKycDetails,
  upgradeWalletLimit,
  resetKycDemo
} = require("../controllers/kycController");

// All customer KYC routes require authentication
router.use(authMiddleware);

// ======================================
// 1. STEP 1 & 2: PAN VERIFICATION & OTP
// ======================================
// POST /api/v1/kyc/pan/verify - Validate PAN, Name, DOB & dispatch OTP
router.post("/pan/verify", initiatePanVerification);

// POST /api/v1/kyc/pan/verify-otp - Verify PAN OTP
router.post("/pan/verify-otp", verifyPanOtp);

// POST /api/v1/kyc/pan/resend-otp - Resend PAN OTP
router.post("/pan/resend-otp", resendPanOtp);

// ======================================
// 2. STEP 2 (AADHAAR) VERIFICATION & OTP
// ======================================
// POST /api/v1/kyc/aadhaar/verify - Validate 12-digit Aadhaar & dispatch UIDAI OTP
router.post("/aadhaar/verify", initiateAadhaarVerification);

// POST /api/v1/kyc/aadhaar/verify-otp - Verify Aadhaar OTP & proceed to Step 3
router.post("/aadhaar/verify-otp", verifyAadhaarOtp);

// POST /api/v1/kyc/aadhaar/resend-otp - Resend Aadhaar OTP
router.post("/aadhaar/resend-otp", resendAadhaarOtp);

// ======================================
// 3. STEP 3: PHONEPE WALLET KYC DETAILS
// ======================================
// POST /api/v1/kyc/details - Submit parent, occupation, income, nominee, declarations
router.post("/details", submitKycDetails);

// ======================================
// 4. STEP 4: WALLET LIMIT UPGRADE
// ======================================
// POST /api/v1/kyc/wallet/upgrade-limit - Upgrade to ₹2 Lakh Higher Limits or ₹1 Lakh Standard
router.post("/wallet/upgrade-limit", upgradeWalletLimit);

// ======================================
// 3. DEMO RESET ENDPOINT
// ======================================
// POST /api/v1/kyc/reset-demo - Reset KYC to step 1 for testing
router.post("/reset-demo", resetKycDemo);

// ======================================
// 1. MOBILE OTP VERIFICATION ENDPOINTS
// ======================================
// POST /api/v1/kyc/send-otp - Generate & dispatch 6-digit SMS OTP
router.post("/send-otp", sendMobileOtp);

// POST /api/v1/kyc/verify-otp - Verify hashed 6-digit OTP & mark mobile verified
router.post("/verify-otp", verifyMobileOtp);

// POST /api/v1/kyc/resend-otp - Resend OTP with cooldown & rate limit
router.post("/resend-otp", resendMobileOtp);

// ======================================
// 2. PERSONAL DETAILS & KYC STEPS
// ======================================
// PUT /api/v1/kyc/personal-details - Save demographic information
router.put("/personal-details", updatePersonalDetails);

// POST /api/v1/kyc/upload-document - Upload single document
router.post("/upload-document", addKycDocument);

// ======================================
// 3. KYC STATUS & SUBMISSION ENDPOINTS
// ======================================
// GET /api/v1/kyc/status - Get user KYC and mobile verification status
router.get("/status", getKycStatus);

// POST /api/v1/kyc/submit - Submit KYC documents (requires verified mobile)
router.post("/submit", submitKyc);

// POST /api/v1/kyc/documents - Add supplementary KYC document
router.post("/documents", addKycDocument);

// GET /api/v1/kyc/documents - Get all uploaded KYC documents
router.get("/documents", getKycDocuments);

// DELETE /api/v1/kyc/documents/:id - Delete a pending document
router.delete("/documents/:id", deleteKycDocument);

module.exports = router;
