const pool = require("../config/database");

// ========================================
// BUILD FILTERS
// ========================================
const buildFilters = ({ company_id, search }) => {

    let whereClause = "WHERE company_id = ? AND status = 'active'";
    let values = [company_id];

    if (search) {
        whereClause += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
        values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    return { whereClause, values };
};

// ========================================
// GET ALL CUSTOMERS
// ========================================
const getAllCustomers = async ({ company_id, page, limit, search }) => {

    const offset = (page - 1) * limit;

    const { whereClause, values } = buildFilters({
        company_id,
        search
    });

    const [data] = await pool.query(`
        SELECT 
            id,
            name,
            email,
            phone,
            address,
            created_at
        FROM customers
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `, [...values, limit, offset]);

    const [totalResult] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM customers
        ${whereClause}
    `, values);

    return {
        data,
        total: totalResult[0].total
    };
};

// ========================================
// GET BY ID
// ========================================
const getCustomerById = async (id, company_id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM customers
        WHERE id = ?
        AND company_id = ?
        AND status = 'active'
        LIMIT 1
    `, [id, company_id]);

    return rows.length ? rows[0] : null;
};

// ========================================
// CREATE CUSTOMER
// ========================================
const createCustomer = async (data) => {

    const {
        company_id,
        name,
        phone,
        email,
        address,
        notes
    } = data;

    const [result] = await pool.query(`
        INSERT INTO customers (
            company_id,
            name,
            phone,
            email,
            address,
            notes,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    `, [
        company_id,
        name,
        phone,
        email,
        address,
        notes
    ]);

    return result.insertId;
};

// ========================================
// UPDATE CUSTOMER
// ========================================
const updateCustomer = async (id, company_id, data) => {

    const { name, phone, email, address, notes } = data;

    const [result] = await pool.query(`
        UPDATE customers
        SET name = ?,
            phone = ?,
            email = ?,
            address = ?,
            notes = ?
        WHERE id = ?
        AND company_id = ?
    `, [
        name,
        phone,
        email,
        address,
        notes,
        id,
        company_id
    ]);

    return result.affectedRows;
};

// ========================================
// SOFT DELETE
// ========================================
const softDeleteCustomer = async (id, company_id) => {

    const [result] = await pool.query(`
        UPDATE customers
        SET status = 'inactive'
        WHERE id = ?
        AND company_id = ?
    `, [id, company_id]);

    return result.affectedRows;
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    softDeleteCustomer
};