const pool = require("../config/database");

// ========================================
// CREATE SERVICE ORDER
// ========================================
const createServiceOrder = async (
    connection,
    {
        company_id,
        customer_id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        device_type,
        problem_description,
        estimated_cost,
        created_by,
        public_token
    }
) => {

    const [result] = await connection.query(`
        INSERT INTO service_orders (
            company_id,
            customer_id,
            order_number,
            customer_name,
            customer_phone,
            customer_email,
            device_type,
            problem_description,
            estimated_cost,
            status,
            created_by,
            public_token
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
        company_id,
        customer_id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        device_type,
        problem_description,
        estimated_cost,
        created_by,
        public_token
    ]);

    return result.insertId;
};


// ========================================
// GENERATE ORDER NUMBER (ANTI-CONCURRENCY)
// ========================================
const generateOrderNumber = async (connection, company_id) => {

    const [rows] = await connection.query(`
        SELECT order_number
        FROM service_orders
        WHERE company_id = ?
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
    `, [company_id]);

    let nextNumber = 1;

    if (rows.length > 0 && rows[0].order_number) {
        const lastNumber = parseInt(rows[0].order_number.split("-")[1]);
        nextNumber = lastNumber + 1;
    }

    return `SO-${String(nextNumber).padStart(5, "0")}`;
};


// ========================================
// INSERT STATUS HISTORY
// ========================================
const insertStatusHistory = async (
    connection,
    {
        company_id,
        service_order_id,
        status,
        changed_by,
        notes = null
    }
) => {

    if (!status) {
        throw new Error("Estado no proporcionado");
    }

    // 🔎 Buscar status_id en el catálogo de la empresa
    const [statusRows] = await connection.query(`
        SELECT id
        FROM service_order_status_catalog
        WHERE name = ?
        AND company_id = ?
        LIMIT 1
    `, [status, company_id]);

    if (statusRows.length === 0) {
        throw new Error("Estado no válido en catálogo");
    }

    const status_id = statusRows[0].id;

    // 📝 Insertar historial
    await connection.query(`
        INSERT INTO service_order_status_history (
            company_id,
            service_order_id,
            status_id,
            changed_by,
            notes
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        company_id,
        service_order_id,
        status_id,
        changed_by,
        notes
    ]);
};


// ========================================
// GET ALL SERVICE ORDERS (MULTI-TENANT)
// ========================================
const getAllServiceOrders = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            so.id,
            so.order_number,
            so.customer_name,
            so.device_type,
            so.status,
            so.estimated_cost,
            so.final_cost,
            so.created_at,
            u.name AS technician_name
        FROM service_orders so
        LEFT JOIN users u 
            ON so.technician_id = u.id 
            AND u.company_id = so.company_id
        WHERE so.company_id = ?
        ORDER BY so.created_at DESC
    `, [company_id]);

    return rows;
};


// ========================================
// GET SERVICE ORDER BY ID
// ========================================
const getServiceOrderById = async (id, company_id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM service_orders
        WHERE id = ?
        AND company_id = ?
    `, [id, company_id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// CHECK IF ORDER EXISTS
// ========================================
const orderExists = async (connection, id, company_id) => {

    const [rows] = await connection.query(`
        SELECT id
        FROM service_orders
        WHERE id = ?
        AND company_id = ?
    `, [id, company_id]);

    return rows.length > 0;
};


// ========================================
// ASSIGN TECHNICIAN
// ========================================
const assignTechnician = async (id, technician_id, company_id) => {

    const [result] = await pool.query(`
        UPDATE service_orders
        SET technician_id = ?
        WHERE id = ?
        AND company_id = ?
    `, [technician_id, id, company_id]);

    return result.affectedRows;
};


// ========================================
// UPDATE STATUS
// ========================================
const updateStatus = async (
    connection,
    id,
    status,
    company_id
) => {

    await connection.query(`
        UPDATE service_orders
        SET status = ?
        WHERE id = ?
        AND company_id = ?
    `, [status, id, company_id]);
};


// ========================================
// CLOSE SERVICE ORDER
// ========================================
const closeServiceOrder = async (id, company_id) => {

    const [result] = await pool.query(`
        UPDATE service_orders
        SET status = 'delivered'
        WHERE id = ?
        AND company_id = ?
    `, [id, company_id]);

    return result.affectedRows;
};


module.exports = {
    createServiceOrder,
    generateOrderNumber,
    insertStatusHistory,
    getAllServiceOrders,
    getServiceOrderById,
    orderExists,
    assignTechnician,
    updateStatus,
    closeServiceOrder
};