const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const controller = require("../controllers/company.controller");


// ==================================================
// 🔓 PUBLIC ROUTE (SAAS REGISTER)
// ==================================================

// Registro automático:
// - Crea empresa
// - Crea admin
// - Crea suscripción trial
// - Devuelve JWT
router.post("/register", controller.registerCompany);



// ==================================================
// 🔐 SUPER ADMIN ROUTES
// ==================================================

// Crear empresa manualmente
router.post(
    "/",
    verifyToken,
    authorize("super_admin"),
    controller.createCompany
);

// Obtener todas las empresas
router.get(
    "/",
    verifyToken,
    authorize("super_admin"),
    controller.getAllCompanies
);

// Obtener empresa por ID
router.get(
    "/:id",
    verifyToken,
    authorize("super_admin"),
    controller.getCompanyById
);

// Actualizar empresa
router.put(
    "/:id",
    verifyToken,
    authorize("super_admin"),
    controller.updateCompany
);

// Activar / Desactivar empresa
router.put(
    "/:id/status",
    verifyToken,
    authorize("super_admin"),
    controller.toggleCompanyStatus
);

// Estadísticas de empresa
router.get(
    "/:id/stats",
    verifyToken,
    authorize("super_admin"),
    controller.getCompanyStats
);

// Crear usuario dentro de una empresa específica
router.post(
    "/:companyId/users",
    verifyToken,
    authorize("super_admin"),
    controller.createCompanyUser
);


module.exports = router;