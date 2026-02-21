const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const controller = require("../controllers/communication.controller");

// =============================
// PUBLIC ROUTES (CLIENT)
// =============================
router.get("/public/:token", controller.getPublicConversation);
router.post("/public/:token", controller.sendPublicMessage);

// =============================
// PRIVATE ROUTES (DASHBOARD)
// =============================
router.post("/", verifyToken, controller.sendMessage);
router.get("/:id", verifyToken, controller.getConversation);

module.exports = router;