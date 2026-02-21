const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/serviceOrder.controller");

// ========================================
// GET ALL SERVICE ORDERS
// ========================================
router.get(
    "/",
    verifyToken,
    controller.getAllServiceOrders
);

// ========================================
// GET SERVICE ORDER BY ID
// ========================================
router.get(
    "/:id",
    verifyToken,
    controller.getServiceOrderById
);

// ========================================
// CREATE SERVICE ORDER
// ========================================
router.post(
    "/",
    verifyToken,
    authorize("admin", "vendedor", "super_admin"),
    controller.createServiceOrder
);

// ========================================
// ASSIGN TECHNICIAN
// ========================================
router.put(
    "/:id/assign",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.assignTechnician
);

// ========================================
// UPDATE STATUS
// ========================================
router.put(
    "/:id/status",
    verifyToken,
    authorize("admin", "tecnico", "super_admin"),
    controller.updateStatus
);

// ========================================
// CLOSE SERVICE ORDER
// ========================================
router.put(
    "/:id/close",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.closeServiceOrder
);

module.exports = router;