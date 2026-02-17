const ServiceStatus = require("../models/serviceStatus.model");

// ========================================
// GET ALL ACTIVE STATUS
// ========================================
exports.getAllStatuses = async (req, res) => {
    try {

        const statuses = await ServiceStatus.getAllActiveStatuses();

        res.status(200).json(statuses);

    } catch (error) {
        console.error("Error getAllStatuses:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// GET STATUS BY ID
// ========================================
exports.getStatusById = async (req, res) => {
    try {

        const { id } = req.params;

        const status = await ServiceStatus.getStatusById(id);

        if (!status) {
            return res.status(404).json({
                message: "Estado no encontrado"
            });
        }

        res.status(200).json(status);

    } catch (error) {
        console.error("Error getStatusById:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// CREATE STATUS
// ========================================
exports.createStatus = async (req, res) => {
    try {

        const { name, code, sort_order = 0, is_final = false } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                message: "Nombre y código son requeridos"
            });
        }

        const existing = await ServiceStatus.findByCode(code);

        if (existing) {
            return res.status(400).json({
                message: "El código ya existe"
            });
        }

        const statusId = await ServiceStatus.createStatus({
            name,
            code,
            sort_order,
            is_final
        });

        res.status(201).json({
            message: "Estado creado correctamente",
            statusId
        });

    } catch (error) {
        console.error("Error createStatus:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// UPDATE STATUS
// ========================================
exports.updateStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { name, sort_order, is_final } = req.body;

        const affectedRows = await ServiceStatus.updateStatus(id, {
            name,
            sort_order,
            is_final
        });

        if (!affectedRows) {
            return res.status(404).json({
                message: "Estado no encontrado"
            });
        }

        res.status(200).json({
            message: "Estado actualizado correctamente"
        });

    } catch (error) {
        console.error("Error updateStatus:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// DELETE STATUS (SOFT)
// ========================================
exports.deleteStatus = async (req, res) => {
    try {

        const { id } = req.params;

        const affectedRows = await ServiceStatus.softDeleteStatus(id);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Estado no encontrado"
            });
        }

        res.status(200).json({
            message: "Estado desactivado correctamente"
        });

    } catch (error) {
        console.error("Error deleteStatus:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};