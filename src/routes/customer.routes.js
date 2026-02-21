const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

const controller = require("../controllers/customer.controller");

router.get("/", verifyToken, controller.getAllCustomers);
router.get("/:id", verifyToken, controller.getCustomerById);

router.post(
    "/",
    verifyToken,
    authorize("admin", "super_admin", "vendedor"),
    controller.createCustomer
);
router.get(
    "/:id/sales",
    verifyToken,
    controller.getCustomerSales
);

router.put(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin", "vendedor"),
    controller.updateCustomer
);

router.delete(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.deleteCustomer
);



module.exports = router;