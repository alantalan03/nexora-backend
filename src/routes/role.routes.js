const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/role.controller");

// Solo super_admin puede manejar roles
router.get("/", verifyToken, authorize("super_admin"), controller.getAllRoles);
router.get("/:id", verifyToken, authorize("super_admin"), controller.getRoleById);
router.post("/", verifyToken, authorize("super_admin"), controller.createRole);
router.put("/:id", verifyToken, authorize("super_admin"), controller.updateRole);
router.delete("/:id", verifyToken, authorize("super_admin"), controller.deleteRole);

module.exports = router;