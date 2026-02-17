const pool = require("../config/database");

// ========================================
// GET ALL ACTIVE STATUS
// ========================================
const getAllActiveStatuses = async () => {

    const [rows] = await pool.query(`
        SELECT 
            id,
            name,
            code,
            sort_order,
            is_final,
            status
        FROM service_status_catalog
        WHERE status = 'active'
        ORDER BY sort_order ASC
    `);

    return rows;
};


// ========================================
// GET STATUS BY ID
// ========================================
const getStatusById = async (id) => {

    const [rows] = await pool.query(`
        SELECT 
            id,
            name,
            code,
            sort_order,
            is_final,
            status,
            created_at
        FROM service_status_catalog
        WHERE id = ?
    `, [id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// FIND STATUS BY CODE
// ========================================
const findByCode = async (code) => {

    const [rows] = await pool.query(
        `SELECT id FROM service_status_catalog WHERE code = ?`,
        [code]
    );

    return rows.length ? rows[0] : null;
};


// ========================================
// CREATE STATUS
// ========================================
const createStatus = async ({
    name,
    code,
    sort_order = 0,
    is_final = false
}) => {

    const [result] = await pool.query(`
        INSERT INTO service_status_catalog (
            name,
            code,
            sort_order,
            is_final
        )
        VALUES (?, ?, ?, ?)
    `, [
        name,
        code,
        sort_order,
        is_final
    ]);

    return result.insertId;
};


// ========================================
// UPDATE STATUS
// ========================================
const updateStatus = async (id, {
    name,
    sort_order,
    is_final
}) => {

    const [result] = await pool.query(`
        UPDATE service_status_catalog
        SET name = ?,
            sort_order = ?,
            is_final = ?
        WHERE id = ?
    `, [
        name,
        sort_order,
        is_final,
        id
    ]);

    return result.affectedRows;
};


// ========================================
// SOFT DELETE STATUS
// ========================================
const softDeleteStatus = async (id) => {

    const [result] = await pool.query(`
        UPDATE service_status_catalog
        SET status = 'inactive'
        WHERE id = ?
    `, [id]);

    return result.affectedRows;
};


module.exports = {
    getAllActiveStatuses,
    getStatusById,
    findByCode,
    createStatus,
    updateStatus,
    softDeleteStatus
};