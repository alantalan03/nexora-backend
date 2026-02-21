const Communication = require("../models/communication.model");

// ==========================================
// SEND MESSAGE (AUTH USER)
// ==========================================
const sendMessage = async (req, res) => {
    try {
        const { service_order_id, message, image_url } = req.body;

        if (!service_order_id || !message?.trim()) {
            return res.status(400).json({
                message: "Orden y mensaje son requeridos"
            });
        }

        // 1️⃣ Validar orden existente
        const order = await Communication.findOrderById(service_order_id);

        if (!order) {
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        // 2️⃣ Validar misma empresa (SaaS ready)
        if (order.company_id !== req.user.company_id) {
            return res.status(403).json({
                message: "No autorizado para esta orden"
            });
        }

        // 3️⃣ Validar estado
        if (order.status === "closed" || order.status === "cancelled") {
            return res.status(400).json({
                message: "La orden está cerrada"
            });
        }

        await Communication.createMessage({
            company_id: req.user.company_id,
            service_order_id,
            sender_type: req.user.role === "tecnico" ? "technician" : "admin",
            sender_id: req.user.id,
            message: message.trim(),
            image_url
        });

        res.status(201).json({
            message: "Mensaje enviado correctamente"
        });

    } catch (error) {
        console.error("Error sendMessage:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ==========================================
// GET CONVERSATION (AUTH)
// ==========================================
const getConversation = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Communication.findOrderById(id);

        if (!order) {
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        if (order.company_id !== req.user.company_id) {
            return res.status(403).json({
                message: "No autorizado"
            });
        }

        const messages = await Communication.getMessagesByOrderId(id);

        // Marcar mensajes como leídos (opcional profesional)
        await Communication.markMessagesAsRead(id, req.user.role);

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error getConversation:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ==========================================
// GET PUBLIC CONVERSATION
// ==========================================
const getPublicConversation = async (req, res) => {
    try {
        const { token } = req.params;

        const order = await Communication.findOrderByToken(token);

        if (!order) {
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        if (order.status === "closed" || order.status === "cancelled") {
            return res.status(400).json({
                message: "Orden cerrada"
            });
        }

        const messages = await Communication.getPublicMessagesByOrderId(order.id);

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error getPublicConversation:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ==========================================
// SEND PUBLIC MESSAGE
// ==========================================
const sendPublicMessage = async (req, res) => {
    try {
        const { token } = req.params;
        const { message, image_url } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({
                message: "Mensaje requerido"
            });
        }

        const order = await Communication.findOrderByToken(token);

        if (!order) {
            return res.status(404).json({
                message: "Orden no encontrada"
            });
        }

        if (order.status === "closed" || order.status === "cancelled") {
            return res.status(400).json({
                message: "La orden está cerrada"
            });
        }

        await Communication.createMessage({
            company_id: order.company_id,
            service_order_id: order.id,
            sender_type: "client",
            sender_id: null,
            message: message.trim(),
            image_url
        });

        res.status(201).json({
            message: "Mensaje enviado correctamente"
        });

    } catch (error) {
        console.error("Error sendPublicMessage:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};

module.exports = {
    sendMessage,
    getConversation,
    getPublicConversation,
    sendPublicMessage
};