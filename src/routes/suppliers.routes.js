const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const supplierController = require("../controllers/suppliers.controller");

router.post(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    supplierController.createSupplier
);

router.get(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    supplierController.getAllSuppliers
);

router.get(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    supplierController.getSupplierById
);

router.put(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    supplierController.updateSupplier
);

router.delete(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    supplierController.deleteSupplier
);

module.exports = router;