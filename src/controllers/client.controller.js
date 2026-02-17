const Client = require("../models/client.model");

// ========================================
// CREATE CLIENT
// ========================================
exports.createClient = async (req, res) => {
    try {

        const { name, phone, email, address, notes } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "El nombre es obligatorio"
            });
        }

        const clientId = await Client.create({
            name,
            phone,
            email,
            address,
            notes,
            created_by: req.user.id
        });

        res.status(201).json({
            message: "Cliente creado correctamente",
            clientId
        });

    } catch (error) {
        console.error("Error createClient:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// ========================================
// GET ALL CLIENTS
// ========================================
exports.getAllClients = async (req, res) => {
    try {

        const filters = {
            search: req.query.search || null
        };

        const pagination = {
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0
        };

        const clients = await Client.findAll(filters, pagination);

        res.status(200).json(clients);

    } catch (error) {
        console.error("Error getAllClients:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// GET CLIENT BY ID
// ========================================
exports.getClientById = async (req, res) => {
    try {

        const { id } = req.params;

        const client = await Client.findById(id);

        if (!client) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.status(200).json(client);

    } catch (error) {
        console.error("Error getClientById:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// UPDATE CLIENT
// ========================================
exports.updateClient = async (req, res) => {
    try {

        const { id } = req.params;

        const affected = await Client.update(id, req.body);

        if (affected === 0) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.status(200).json({
            message: "Cliente actualizado correctamente"
        });

    } catch (error) {
        console.error("Error updateClient:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// DELETE CLIENT
// ========================================
exports.deleteClient = async (req, res) => {
    try {

        const { id } = req.params;

        const affected = await Client.softDelete(id);

        if (affected === 0) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.status(200).json({
            message: "Cliente desactivado correctamente"
        });

    } catch (error) {
        console.error("Error deleteClient:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// GET CLIENT HISTORY (ventas + órdenes)
// ========================================
exports.getClientHistory = async (req, res) => {
    try {

        const { id } = req.params;

        // Ventas del cliente
        const [sales] = await pool.query(`
            SELECT id, total_amount, payment_method, created_at
            FROM sales
            WHERE client_id = ?
            ORDER BY created_at DESC
        `, [id]);

        // Órdenes de servicio del cliente
        const [serviceOrders] = await pool.query(`
            SELECT id, device_model, status, estimated_cost, created_at
            FROM service_orders
            WHERE client_id = ?
            ORDER BY created_at DESC
        `, [id]);

        res.status(200).json({
            sales,
            serviceOrders
        });

    } catch (error) {
        console.error("Error getClientHistory:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};