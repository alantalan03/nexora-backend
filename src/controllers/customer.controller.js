const Customer = require("../models/customer.model");
const Sale = require("../models/sale.model");

// ========================================
// GET ALL
// ========================================
exports.getAllCustomers = async (req, res) => {
    try {

        const { page = 1, limit = 10, search = "" } = req.query;

        const result = await Customer.getAllCustomers({
            company_id: req.user.company_id,
            page: Number(page),
            limit: Number(limit),
            search
        });

        res.status(200).json({
            data: result.data,
            pagination: {
                total: result.total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(result.total / limit)
            }
        });

    } catch (error) {
        console.error("Error getAllCustomers:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ========================================
// GET BY ID
// ========================================
exports.getCustomerById = async (req, res) => {
    try {

        const { id } = req.params;

        const customer = await Customer.getCustomerById(
            id,
            req.user.company_id
        );

        if (!customer) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.status(200).json(customer);

    } catch (error) {
        console.error("Error getCustomerById:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ========================================
// CREATE
// ========================================
exports.createCustomer = async (req, res) => {
    try {

        const { name, phone, email, address, notes } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Nombre es obligatorio"
            });
        }

        const customerId = await Customer.createCustomer({
            company_id: req.user.company_id,
            name,
            phone: phone || null,
            email: email || null,
            address: address || null,
            notes: notes || null
        });

        res.status(201).json({
            message: "Cliente creado correctamente",
            customerId
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "Email o teléfono ya registrado"
            });
        }

        console.error("Error createCustomer:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ========================================
// UPDATE
// ========================================
exports.updateCustomer = async (req, res) => {
    try {

        const { id } = req.params;
        const { name, phone, email, address, notes } = req.body;

        const affectedRows = await Customer.updateCustomer(
            id,
            req.user.company_id,
            { name, phone, email, address, notes }
        );

        if (!affectedRows) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.status(200).json({
            message: "Cliente actualizado correctamente"
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "Email o teléfono ya registrado"
            });
        }

        console.error("Error updateCustomer:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ========================================
// DELETE
// ========================================
exports.deleteCustomer = async (req, res) => {
    try {

        const { id } = req.params;

        const affectedRows = await Customer.softDeleteCustomer(
            id,
            req.user.company_id
        );

        if (!affectedRows) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.status(200).json({
            message: "Cliente eliminado correctamente"
        });

    } catch (error) {
        console.error("Error deleteCustomer:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

exports.getCustomerSales = async (req, res) => {
    try {

        const { id } = req.params;

        const customer = await Customer.getCustomerById(
            id,
            req.user.company_id
        );

        if (!customer) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        const summary = await Sale.getCustomerSalesSummary(
            req.user.company_id,
            id
        );

        const sales = await Sale.getSalesByCustomer(
            req.user.company_id,
            id
        );

        res.status(200).json({
            customer: {
                id: customer.id,
                name: customer.name
            },
            summary,
            sales
        });

    } catch (error) {
        console.error("Error getCustomerSales:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};