const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const ServiceOrder = require("../models/serviceOrder.model");

// ========================================
// CREATE SERVICE ORDER
// ========================================
exports.createServiceOrder = async (req, res) => {

    const connection = await pool.getConnection();
    const company_id = req.user.company_id;

    try {

        const {
            customer_id,
            device_type,
            problem_description,
            estimated_cost = 0
        } = req.body;

        if (!customer_id || !device_type) {
            return res.status(400).json({
                message: "Cliente y tipo de dispositivo son obligatorios"
            });
        }

        await connection.beginTransaction();

        // 🔥 1. Obtener datos del cliente (snapshot)
        const [customerRows] = await connection.query(`
            SELECT name, phone, email
            FROM customers
            WHERE id = ?
            AND company_id = ?
        `, [customer_id, company_id]);

        if (customerRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        const customer = customerRows[0];

        // 🔥 2. Generar número seguro
        const order_number = await ServiceOrder.generateOrderNumber(
            connection,
            company_id
        );

        const public_token = uuidv4();

        // 🔥 3. Crear orden
        const orderId = await ServiceOrder.createServiceOrder(
            connection,
            {
                company_id,
                customer_id,
                order_number,
                customer_name: customer.name,
                customer_phone: customer.phone || null,
                customer_email: customer.email || null,
                device_type,
                problem_description: problem_description || null,
                estimated_cost,
                created_by: req.user.id,
                public_token
            }
        );

        // 🔥 4. Insertar historial inicial
        await ServiceOrder.insertStatusHistory(
            connection,
            {
                company_id,
                service_order_id: orderId,
                status: "pending",
                changed_by: req.user.id
            }
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            message: "Orden creada correctamente",
            orderId,
            order_number,
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
// GET ALL
// ========================================
exports.getAllServiceOrders = async (req, res) => {

    try {

        const orders = await ServiceOrder.getAllServiceOrders(
            req.user.company_id
        );

        res.status(200).json(orders);

    } catch (error) {

        console.error("Error getAllServiceOrders:", error);

        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// GET BY ID
// ========================================
exports.getServiceOrderById = async (req, res) => {

    try {

        const { id } = req.params;

        const order = await ServiceOrder.getServiceOrderById(
            id,
            req.user.company_id
        );

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

        if (!technician_id) {
            return res.status(400).json({
                message: "El técnico es obligatorio"
            });
        }

        const affectedRows = await ServiceOrder.assignTechnician(
            id,
            technician_id,
            req.user.company_id
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
    const company_id = req.user.company_id;

    try {

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "diagnosis",
            "approved",
            "in_progress",
            "completed",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Estado inválido"
            });
        }

        await connection.beginTransaction();

        const exists = await ServiceOrder.orderExists(
            connection,
            id,
            company_id
        );

        if (!exists) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        await ServiceOrder.updateStatus(
            connection,
            id,
            status,
            company_id
        );

        await ServiceOrder.insertStatusHistory(
            connection,
            {
                company_id,
                service_order_id: id,
                status,
                changed_by: req.user.id
            }
        );
        await connection.commit();
        connection.release();

        res.status(200).json({
            message: "Estado actualizado correctamente"
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error updateStatus:", error);

        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// CLOSE
// ========================================
exports.closeServiceOrder = async (req, res) => {

    try {

        const { id } = req.params;

        const affectedRows = await ServiceOrder.closeServiceOrder(
            id,
            req.user.company_id
        );

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