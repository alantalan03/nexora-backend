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

module.exports = router;