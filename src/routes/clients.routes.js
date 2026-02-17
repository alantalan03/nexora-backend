const express = require("express");
const router = express.Router();

const controller = require("../controllers/client.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.use(verifyToken);

router.get("/", clientController.getAllClients);
router.get("/:id", clientController.getClientById);
router.get("/:id/history", clientController.getClientHistory);

router.post("/", authorize("admin","vendedor","super_admin"), clientController.createClient);

router.put("/:id", authorize("admin","vendedor","super_admin"), clientController.updateClient);

router.delete("/:id", authorize("admin","super_admin"), clientController.deleteClient);

module.exports = router;