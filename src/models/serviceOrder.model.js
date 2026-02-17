const pool = require("../config/database");

// ========================================
// CREATE SERVICE ORDER
// ========================================
const createServiceOrder = async (
    connection,
    {
        client_id,
        device_model,
        device_brand,
        problem_description,
        estimated_cost,
        created_by,
        public_token
    }
) => {

    const [result] = await connection.query(`
        INSERT INTO service_orders (
            client_id,
            device_model,
            device_brand,
            problem_description,
            estimated_cost,
            status,
            created_by,
            public_token
        )
        VALUES (?, ?, ?, ?, ?, 'received', ?, ?)
    `, [
        client_id,
        device_model,
        device_brand,
        problem_description,
        estimated_cost,
        created_by,
        public_token
    ]);

    return result.insertId;
};


// ========================================
// INSERT STATUS HISTORY
// ========================================
const insertStatusHistory = async (
    connection,
    service_order_id,
    status,
    changed_by
) => {

    await connection.query(`
        INSERT INTO service_order_status_history (
            service_order_id,
            status,
            changed_by
        )
        VALUES (?, ?, ?)
    `, [
        service_order_id,
        status,
        changed_by
    ]);
};


// ========================================
// GET ALL SERVICE ORDERS
// ========================================
const getAllServiceOrders = async () => {

    const [rows] = await pool.query(`
        SELECT 
            so.id,
            so.device_model,
            so.device_brand,
            so.status,
            so.estimated_cost,
            so.created_at,
            c.name AS client_name,
            u.name AS technician_name
        FROM service_orders so
        JOIN clients c ON so.client_id = c.id
        LEFT JOIN users u ON so.technician_id = u.id
        ORDER BY so.created_at DESC
    `);

    return rows;
};


// ========================================
// GET SERVICE ORDER BY ID
// ========================================
const getServiceOrderById = async (id) => {

    const [rows] = await pool.query(`
        SELECT 
            so.*,
            c.name AS client_name,
            c.phone,
            c.email,
            u.name AS technician_name
        FROM service_orders so
        JOIN clients c ON so.client_id = c.id
        LEFT JOIN users u ON so.technician_id = u.id
        WHERE so.id = ?
    `, [id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// CHECK IF ORDER EXISTS
// ========================================
const orderExists = async (connection, id) => {

    const [rows] = await connection.query(
        `SELECT id FROM service_orders WHERE id = ?`,
        [id]
    );

    return rows.length > 0;
};


// ========================================
// ASSIGN TECHNICIAN
// ========================================
const assignTechnician = async (id, technician_id) => {

    const [result] = await pool.query(`
        UPDATE service_orders
        SET technician_id = ?
        WHERE id = ?
    `, [technician_id, id]);

    return result.affectedRows;
};


// ========================================
// UPDATE STATUS
// ========================================
const updateStatus = async (
    connection,
    id,
    status
) => {

    await connection.query(`
        UPDATE service_orders
        SET status = ?
        WHERE id = ?
    `, [status, id]);
};


// ========================================
// CLOSE SERVICE ORDER
// ========================================
const closeServiceOrder = async (id) => {

    const [result] = await pool.query(`
        UPDATE service_orders
        SET status = 'delivered'
        WHERE id = ?
    `, [id]);

    return result.affectedRows;
};


module.exports = {
    createServiceOrder,
    insertStatusHistory,
    getAllServiceOrders,
    getServiceOrderById,
    orderExists,
    assignTechnician,
    updateStatus,
    closeServiceOrder
};