const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const purchaseController = require("../controllers/purchase.controller");

// ========================================
// CREATE PURCHASE
// ========================================
router.post(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    purchaseController.createPurchase
);

// ========================================
// GET ALL PURCHASES
// ========================================
router.get(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    purchaseController.getAllPurchases
);

// ========================================
// GET PURCHASE BY ID
// ========================================
router.get(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    purchaseController.getPurchaseById
);

// ========================================
// CANCEL PURCHASE
// ========================================
router.put(
    "/:id/cancel",
    verifyToken,
    authorize("admin", "super_admin"),
    purchaseController.cancelPurchase
);

module.exports = router;