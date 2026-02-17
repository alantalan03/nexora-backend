const Role = require("../models/role.model");

// ========================================
// GET ALL ROLES
// ========================================
exports.getAllRoles = async (req, res) => {
    try {

        const roles = await Role.getAllRoles();

        res.status(200).json(roles);

    } catch (error) {
        console.error("Error getAllRoles:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// GET ROLE BY ID
// ========================================
exports.getRoleById = async (req, res) => {
    try {

        const { id } = req.params;

        const role = await Role.getRoleById(id);

        if (!role) {
            return res.status(404).json({
                message: "Rol no encontrado"
            });
        }

        res.status(200).json(role);

    } catch (error) {
        console.error("Error getRoleById:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// CREATE ROLE
// ========================================
exports.createRole = async (req, res) => {
    try {

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "El nombre del rol es obligatorio"
            });
        }

        const existing = await Role.findByName(name);

        if (existing) {
            return res.status(400).json({
                message: "El rol ya existe"
            });
        }

        const roleId = await Role.createRole(name, description);

        res.status(201).json({
            message: "Rol creado correctamente",
            roleId
        });

    } catch (error) {
        console.error("Error createRole:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// UPDATE ROLE
// ========================================
exports.updateRole = async (req, res) => {
    try {

        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "El nombre del rol es obligatorio"
            });
        }

        const exists = await Role.findByNameExcludingId(name, id);

        if (exists) {
            return res.status(400).json({
                message: "Ya existe otro rol con ese nombre"
            });
        }

        const affectedRows = await Role.updateRole(id, name, description);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Rol no encontrado"
            });
        }

        res.status(200).json({
            message: "Rol actualizado correctamente"
        });

    } catch (error) {
        console.error("Error updateRole:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// DELETE ROLE (SOFT)
// ========================================
exports.deleteRole = async (req, res) => {
    try {

        const { id } = req.params;

        const affectedRows = await Role.softDeleteRole(id);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Rol no encontrado"
            });
        }

        res.status(200).json({
            message: "Rol desactivado correctamente"
        });

    } catch (error) {
        console.error("Error deleteRole:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};