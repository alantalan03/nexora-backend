const pool = require("../config/database");

// ========================================
// CREATE CLIENT
// ========================================
exports.create = async (data) => {

    const {
        name,
        phone,
        email,
        address,
        notes,
        created_by
    } = data;

    const [result] = await pool.query(`
        INSERT INTO clients (
            name,
            phone,
            email,
            address,
            notes,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        name,
        phone || null,
        email || null,
        address || null,
        notes || null,
        created_by
    ]);

    return result.insertId;
};

// ========================================
// FIND ALL (con filtros y paginación)
// ========================================
exports.findAll = async (filters = {}, pagination = {}) => {

    let query = `
        SELECT id, name, phone, email, address, status, created_at
        FROM clients
        WHERE status = 'active'
    `;

    const values = [];

    if (filters.search) {
        query += ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
        values.push(
            `%${filters.search}%`,
            `%${filters.search}%`,
            `%${filters.search}%`
        );
    }

    query += ` ORDER BY created_at DESC`;

    if (pagination.limit) {
        query += ` LIMIT ? OFFSET ?`;
        values.push(pagination.limit, pagination.offset || 0);
    }

    const [rows] = await pool.query(query, values);
    return rows;
};

// ========================================
// FIND BY ID
// ========================================
exports.findById = async (id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM clients
        WHERE id = ?
    `, [id]);

    return rows[0];
};

// ========================================
// UPDATE CLIENT
// ========================================
exports.update = async (id, data) => {

    const {
        name,
        phone,
        email,
        address,
        notes
    } = data;

    const [result] = await pool.query(`
        UPDATE clients
        SET name = ?,
            phone = ?,
            email = ?,
            address = ?,
            notes = ?
        WHERE id = ?
    `, [
        name,
        phone,
        email,
        address,
        notes,
        id
    ]);

    return result.affectedRows;
};

// ========================================
// SOFT DELETE
// ========================================
exports.softDelete = async (id) => {

    const [result] = await pool.query(`
        UPDATE clients
        SET status = 'inactive'
        WHERE id = ?
    `, [id]);

    return result.affectedRows;
};