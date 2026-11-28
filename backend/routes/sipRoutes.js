const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    getProducts,
    getProductById,
    createSIP,
    getUserSIPs,
    getSIPDetails,
    getInstallments,
    pauseSIP,
    resumeSIP,
    cancelSIP,
    createMandate,
    getMandate,
    getTransactions,
    createOneTimeInvestment,
    getUserInvestmentOrders,
    getInvestmentOrderDetails,
    getInvestmentAccount,
    setupInvestmentAccount,
    modifySIP,
    getWatchlist,
    toggleWatchlist,
    getPortfolio,
    handleWebhook,
    getAdminIntegrationInfo
} = require("../controllers/sipController");

// Investment Account (PAN / MF KYC)
router.get("/investment-account", authMiddleware, getInvestmentAccount);
router.post("/investment-account", authMiddleware, setupInvestmentAccount);

// Watchlist & Portfolio
router.get("/watchlist", authMiddleware, getWatchlist);
router.post("/watchlist/toggle", authMiddleware, toggleWatchlist);
router.get("/portfolio", authMiddleware, getPortfolio);

// Webhook & Admin Integration Health
router.post("/webhook", handleWebhook);
router.get("/admin/integration", getAdminIntegrationInfo);

// Products (Public)
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// SIP plans (Protected with Auth)
router.post("/create", authMiddleware, createSIP);
router.get("/my-sips", authMiddleware, getUserSIPs);
router.get("/user/:userId", getUserSIPs);
router.get("/details/:id", getSIPDetails);

// Installments
router.get("/:id/installments", getInstallments);

// Pause / Resume / Modify / Cancel (Protected)
router.put("/:id/pause", authMiddleware, pauseSIP);
router.put("/:id/resume", authMiddleware, resumeSIP);
router.patch("/:id/modify", authMiddleware, modifySIP);
router.post("/:id/cancel", authMiddleware, cancelSIP);

// Mandates (Protected)
router.post("/:id/mandate", authMiddleware, createMandate);
router.get("/:id/mandate", getMandate);

// Transactions
router.get("/:id/transactions", getTransactions);

// Create One-Time Investment (Protected)
router.post("/investments/one-time", authMiddleware, createOneTimeInvestment);

// Get User Investment Orders (Protected & Param supported)
router.get("/investments/my-orders", authMiddleware, getUserInvestmentOrders);
router.get("/investments/user/:userId", getUserInvestmentOrders);

// Get Single Investment Order Details
router.get("/investments/:id", getInvestmentOrderDetails);

module.exports = router;
