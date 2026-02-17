const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/report.controller");

router.get("/sales-summary", verifyToken, authorize("admin","super_admin"), controller.getSalesSummary);

router.get("/sales-by-day", verifyToken, authorize("admin","super_admin"), controller.getSalesByDay);

router.get("/top-products", verifyToken, authorize("admin","super_admin"), controller.getTopProducts);

router.get("/low-stock", verifyToken, authorize("admin","super_admin"), controller.getLowStockReport);

router.get("/technician-performance", verifyToken, authorize("admin","super_admin"), controller.getTechnicianPerformance);

router.get("/general", verifyToken, authorize("admin","super_admin"), controller.getGeneralReport);

module.exports = router;