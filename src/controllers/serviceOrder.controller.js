const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const ServiceOrder = require("../models/serviceOrder.model");

// ========================================
// CREATE SERVICE ORDER
// ========================================
exports.createServiceOrder = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            client_id,
            device_model,
            device_brand,
            problem_description,
            estimated_cost = 0
        } = req.body;

        if (!client_id || !device_model) {
            return res.status(400).json({
                message: "Cliente y modelo son obligatorios"
            });
        }

        await connection.beginTransaction();

        const public_token = uuidv4();

        const orderId = await ServiceOrder.createServiceOrder(
            connection,
            {
                client_id,
                device_model,
                device_brand: device_brand || null,
                problem_description: problem_description || null,
                estimated_cost,
                created_by: req.user.id,
                public_token
            }
        );

        await ServiceOrder.insertStatusHistory(
            connection,
            orderId,
            "received",
            req.user.id
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            message: "Orden creada correctamente",
            orderId,
            public_token
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error createServiceOrder:", error);

        res.status(500).json({
            message: "Error al crear la orden"
        });
    }
};


// ========================================
// GET ALL SERVICE ORDERS
// ========================================
exports.getAllServiceOrders = async (req, res) => {
    try {

        const orders = await ServiceOrder.getAllServiceOrders();

        res.status(200).json(orders);

    } catch (error) {
        console.error("Error getAllServiceOrders:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// GET SERVICE ORDER BY ID
// ========================================
exports.getServiceOrderById = async (req, res) => {
    try {

        const { id } = req.params;

        const order = await ServiceOrder.getServiceOrderById(id);

        if (!order) {
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        res.status(200).json(order);

    } catch (error) {
        console.error("Error getServiceOrderById:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// ASSIGN TECHNICIAN
// ========================================
exports.assignTechnician = async (req, res) => {
    try {

        const { id } = req.params;
        const { technician_id } = req.body;

        const affectedRows = await ServiceOrder.assignTechnician(
            id,
            technician_id
        );

        if (!affectedRows) {
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        res.status(200).json({
            message: "Técnico asignado correctamente"
        });

    } catch (error) {
        console.error("Error assignTechnician:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// UPDATE STATUS
// ========================================
exports.updateStatus = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "received",
            "diagnosing",
            "waiting_parts",
            "ready",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Estado inválido"
            });
        }

        await connection.beginTransaction();

        const exists = await ServiceOrder.orderExists(connection, id);

        if (!exists) {
            throw new Error("Orden no encontrada");
        }

        await ServiceOrder.updateStatus(connection, id, status);

        await ServiceOrder.insertStatusHistory(
            connection,
            id,
            status,
            req.user.id
        );

        await connection.commit();
        connection.release();

        res.status(200).json({
            message: "Estado actualizado correctamente"
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        res.status(500).json({
            message: error.message
        });
    }
};


// ========================================
// CLOSE SERVICE ORDER
// ========================================
exports.closeServiceOrder = async (req, res) => {
    try {

        const { id } = req.params;

        const affectedRows = await ServiceOrder.closeServiceOrder(id);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        res.status(200).json({
            message: "Orden cerrada correctamente"
        });

    } catch (error) {
        console.error("Error closeServiceOrder:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};