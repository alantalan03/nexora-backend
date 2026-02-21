const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/usage.controller");

router.get(
    "/",
    verifyToken,
    controller.getMyUsage
);

router.get(
    "/company/:companyId",
    verifyToken,
    authorize("super_admin"),
    controller.getCompanyUsage
);

router.get(
    "/summary",
    verifyToken,
    controller.getUsageSummary
);

module.exports = router;