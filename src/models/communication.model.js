const pool = require("../config/database");

// ========================================
// CREATE MESSAGE
// ========================================
const createMessage = async ({
    company_id,
    service_order_id,
    sender_type,
    sender_id = null,
    message,
    image_url = null
}) => {

    const [result] = await pool.query(`
        INSERT INTO service_order_messages (
            company_id,
            service_order_id,
            sender_type,
            sender_id,
            message,
            image_url
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        company_id,
        service_order_id,
        sender_type,
        sender_id,
        message,
        image_url
    ]);

    return result;
};

// ========================================
// GET ALL MESSAGES (PRIVATE)
// ========================================
const getMessagesByOrderId = async (service_order_id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM service_order_messages
        WHERE service_order_id = ?
        ORDER BY created_at ASC
    `, [service_order_id]);

    return rows;
};


// ========================================
// GET PUBLIC MESSAGES
// ========================================
const getPublicMessagesByOrderId = async (service_order_id) => {

    const [rows] = await pool.query(`
        SELECT sender_type, message, image_url, created_at
        FROM service_order_messages
        WHERE service_order_id = ?
        ORDER BY created_at ASC
    `, [service_order_id]);

    return rows;
};


// ========================================
// FIND ORDER BY ID (SaaS Ready)
// ========================================
const findOrderById = async (id) => {

    const [rows] = await pool.query(`
        SELECT id, status, company_id
        FROM service_orders
        WHERE id = ?
    `, [id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// FIND ORDER BY PUBLIC TOKEN
// ========================================
const findOrderByToken = async (token) => {

    const [rows] = await pool.query(`
        SELECT id, status, company_id
        FROM service_orders
        WHERE public_token = ?
    `, [token]);

    return rows.length ? rows[0] : null;
};


// ========================================
// MARK MESSAGES AS READ
// ========================================
const markMessagesAsRead = async (service_order_id, userRole) => {

    const oppositeType =
        userRole === "tecnico" ? "admin" : "technician";

    await pool.query(`
        UPDATE service_order_messages
        SET is_read = TRUE
        WHERE service_order_id = ?
        AND sender_type = ?
        AND is_read = FALSE
    `, [service_order_id, oppositeType]);
};


module.exports = {
    createMessage,
    getMessagesByOrderId,
    getPublicMessagesByOrderId,
    findOrderById,
    findOrderByToken,
    markMessagesAsRead
};