const Communication = require("../models/communication.model");

// SEND MESSAGE (AUTH USER)
exports.sendMessage = async (req, res) => {
    try {

        const { service_order_id, message, image_url } = req.body;

        if (!service_order_id || !message) {
            return res.status(400).json({
                message: "Orden y mensaje son requeridos"
            });
        }

        await Communication.createMessage({
            service_order_id,
            sender_type: req.user.role === "tecnico" ? "technician" : "admin",
            sender_id: req.user.id,
            message,
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