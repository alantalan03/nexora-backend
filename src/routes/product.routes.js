const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/product.controller");

// Todos autenticados pueden ver productos
router.get("/", verifyToken, controller.getAllProducts);
router.get("/:id", verifyToken, controller.getProductById);

// Solo admin y super_admin pueden modificar
router.post(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.createProduct
);

router.put(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.updateProduct
);

router.delete(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.deleteProduct
);

module.exports = router;