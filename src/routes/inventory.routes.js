const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const inventoryController = require("../controllers/inventory.controller");

// Ajuste manual (admin y super_admin)
router.post(
    "/adjust",
    verifyToken,
    authorize("admin", "super_admin"),
    inventoryController.adjustInventory
);

// Registrar compra (admin y super_admin)
router.post(
    "/purchase",
    verifyToken,
    authorize("admin", "super_admin"),
    inventoryController.registerPurchase
);

// Movimientos por producto
router.get(
    "/movements/:product_id",
    verifyToken,
    inventoryController.getProductMovements
);

// Historial global (admin)
router.get(
    "/movements",
    verifyToken,
    authorize("admin", "super_admin"),
    inventoryController.getAllMovements
);

router.get(
    "/low-stock",
    verifyToken,
    authorize("admin", "super_admin"),
    inventoryController.getLowStockProducts
);

module.exports = router;