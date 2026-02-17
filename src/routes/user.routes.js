const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/user.controller");

router.get("/", verifyToken, authorize("admin","super_admin"), controller.getAllUsers);
router.get("/:id", verifyToken, authorize("admin","super_admin"), controller.getUserById);
router.post("/", verifyToken, authorize("admin","super_admin"), controller.createUser);
router.put("/:id", verifyToken, authorize("admin","super_admin"), controller.updateUser);
router.put("/:id/password", verifyToken, authorize("admin","super_admin"), controller.changePassword);
router.put("/:id/status", verifyToken, authorize("admin","super_admin"), controller.toggleUserStatus);

module.exports = router;