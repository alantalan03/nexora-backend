const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/serviceOrder.controller");

router.get("/", verifyToken, controller.getAllServiceOrders);

router.get("/:id", verifyToken, controller.getServiceOrderById);

router.post(
    "/",
    verifyToken,
    authorize("admin", "vendedor", "super_admin"),
    controller.createServiceOrder
);

router.put(
    "/:id/assign",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.assignTechnician
);

router.put(
    "/:id/status",
    verifyToken,
    authorize("admin", "tecnico", "super_admin"),
    controller.updateStatus
);

router.put(
    "/:id/close",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.closeServiceOrder
);

module.exports = router;