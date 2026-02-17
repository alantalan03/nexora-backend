const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/serviceStatus.controller");

// Solo admin puede modificar catálogo
router.get("/", verifyToken, controller.getAllStatuses);
router.get("/:id", verifyToken, controller.getStatusById);

router.post("/", verifyToken, authorize("admin","super_admin"), controller.createStatus);
router.put("/:id", verifyToken, authorize("admin","super_admin"), controller.updateStatus);
router.delete("/:id", verifyToken, authorize("admin","super_admin"), controller.deleteStatus);

module.exports = router;