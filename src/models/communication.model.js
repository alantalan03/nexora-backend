const pool = require("../config/database");

// ========================================
// CREATE MESSAGE
// ========================================
const createMessage = async ({
    service_order_id,
    sender_type,
    sender_id = null,
    message,
    image_url = null
}) => {

    const [result] = await pool.query(`
        INSERT INTO service_order_messages (
            service_order_id,
            sender_type,
            sender_id,
            message,
            image_url
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        service_order_id,
        sender_type,
        sender_id,
        message,
        image_url
    ]);

    return result;
};


// ========================================
// GET MESSAGES BY ORDER
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
// FIND ORDER BY PUBLIC TOKEN
// ========================================
const findOrderByToken = async (token) => {

    const [rows] = await pool.query(`
        SELECT id
        FROM service_orders
        WHERE public_token = ?
    `, [token]);

    return rows.length ? rows[0] : null;
};


module.exports = {
    createMessage,
    getMessagesByOrderId,
    getPublicMessagesByOrderId,
    findOrderByToken
};