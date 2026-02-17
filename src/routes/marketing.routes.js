const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/marketing.controller");

// Middleware base
router.use(verifyToken);
router.use(authorize("admin", "marketing", "super_admin"));

// Routes
router.get("/", controller.getAllPosts);
router.post("/", controller.createPost);
router.put("/:id", controller.updatePost);
router.put("/:id/publish", controller.publishPost);

// Delete con restricción más alta
router.delete(
    "/:id",
    authorize("admin", "super_admin"),
    controller.deletePost
);

module.exports = router;