const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const controller = require("../controllers/communication.controller");

// Privado (dashboard)
router.post("/", verifyToken, controller.sendMessage);
router.get("/:id", verifyToken, controller.getConversation);

// Público (cliente sin login)
router.get("/public/:token", controller.getPublicConversation);
router.post("/public/:token", controller.sendPublicMessage);

module.exports = router;