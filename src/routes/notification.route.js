const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const controller = require("../controllers/notification.controller");

router.get("/", verifyToken, controller.getUserNotifications);

router.put("/:id/read", verifyToken, controller.markAsRead);

module.exports = router;