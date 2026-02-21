const Supplier = require("../models/suppliers.model");

// ========================================
// CREATE SUPPLIER
// ========================================
exports.createSupplier = async (req, res) => {

    try {

        const company_id = req.user.company_id;

        const {
            name,
            contact_name,
            phone,
            email,
            address,
            tax_id,
            notes
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Nombre del proveedor requerido"
            });
        }

        const supplierId = await Supplier.createSupplier({
            company_id,
            name,
            contact_name,
            phone,
            email,
            address,
            tax_id,
            notes
        });

        res.status(201).json({
            message: "Proveedor creado correctamente",
            supplierId
        });

    } catch (error) {

        console.error("Error createSupplier:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// ========================================
// GET ALL
// ========================================
exports.getAllSuppliers = async (req, res) => {

    try {

        const suppliers = await Supplier.getAllSuppliers(
            req.user.company_id
        );

        res.status(200).json(suppliers);

    } catch (error) {

        console.error("Error getAllSuppliers:", error);

        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// GET BY ID
// ========================================
exports.getSupplierById = async (req, res) => {

    try {

        const supplier = await Supplier.getSupplierById(
            req.params.id,
            req.user.company_id
        );

        if (!supplier) {
            return res.status(404).json({
                message: "Proveedor no encontrado"
            });
        }

        res.status(200).json(supplier);

    } catch (error) {

        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// UPDATE
// ========================================
exports.updateSupplier = async (req, res) => {

    try {

        const affectedRows = await Supplier.updateSupplier(
            req.params.id,
            req.user.company_id,
            req.body
        );

        if (!affectedRows) {
            return res.status(404).json({
                message: "Proveedor no encontrado"
            });
        }

        res.status(200).json({
            message: "Proveedor actualizado correctamente"
        });

    } catch (error) {

        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// DELETE
// ========================================
exports.deleteSupplier = async (req, res) => {

    try {

        const affectedRows = await Supplier.deleteSupplier(
            req.params.id,
            req.user.company_id
        );

        if (!affectedRows) {
            return res.status(404).json({
                message: "Proveedor no encontrado"
            });
        }

        res.status(200).json({
            message: "Proveedor desactivado correctamente"
        });

    } catch (error) {

        res.status(500).json({
            message: "Error interno"
        });
    }
};