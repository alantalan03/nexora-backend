const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/sale.controller");

router.post(
    "/",
    verifyToken,
    authorize("admin", "vendedor", "super_admin"),
    controller.createSale
);

module.exports = router;