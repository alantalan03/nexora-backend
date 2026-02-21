const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const { validateSubscription, validatePlanLimit } = require("../middlewares/subscription.middleware");

const controller = require("../controllers/user.controller");

// GET ALL
router.get(
    "/",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.getAllUsers
);

// GET BY ID
router.get(
    "/:id",
    verifyToken,
    authorize("admin", "super_admin"),
    controller.getUserById
);

// CREATE
router.post(
    "/",
    verifyToken,
    validateSubscription,
    validatePlanLimit("users"),
    authorize("admin", "super_admin"),
    controller.createUser
);

// UPDATE
router.put(
    "/:id",
    verifyToken,
    validateSubscription,
    authorize("admin", "super_admin"),
    controller.updateUser
);

// CHANGE PASSWORD
router.put(
    "/:id/password",
    verifyToken,
    validateSubscription,
    authorize("admin", "super_admin"),
    controller.changePassword
);

// TOGGLE STATUS
router.put(
    "/:id/status",
    verifyToken,
    validateSubscription,
    authorize("admin", "super_admin"),
    controller.toggleUserStatus
);

module.exports = router;