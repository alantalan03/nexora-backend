const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/sale.controller");

// ============================
// CREATE SALE
// ============================
router.post(
    "/",
    verifyToken,
    authorize("admin", "vendedor", "super_admin"),
    controller.createSale
);

// ============================
// GET ALL SALES
// ============================
router.get(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.getAllSales
);

// ============================
// GET SALE BY ID
// ============================
router.get(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin", "vendedor"),
    controller.getSaleById
);

// ============================
// CANCEL SALE
// ============================
router.put(
    "/:id/cancel",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.cancelSale
);

// ============================
// DAILY SUMMARY (DEBE IR ARRIBA)
// ============================
router.get(
    "/summary/daily",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.getDailySummary
);

module.exports = router;