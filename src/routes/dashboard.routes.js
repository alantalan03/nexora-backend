const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const dashboardController = require("../controllers/dashboard.controller");

// Solo admin y super_admin pueden ver dashboard completo
router.get(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    dashboardController.getDashboardData
);

// ============================
// MONTHLY SALES
// ============================
router.get(
    "/sales/monthly",
    verifyToken,
    authorize("admin", "super_admin"),
    dashboardController.getMonthlySales
);

// ============================
// TOP PRODUCTS
// ============================
router.get(
    "/top-products",
    verifyToken,
    authorize("admin", "super_admin"),
    dashboardController.getTopProducts
);

// ============================
// PAYMENT METHODS
// ============================
router.get(
    "/payment-methods",
    verifyToken,
    authorize("admin", "super_admin"),
    dashboardController.getPaymentMethods
);

module.exports = router;