const pool = require("../config/database");

// ========================================
// FIND COMPANY BY EMAIL (CONNECTION)
// ========================================
const findByEmail = async (connection, email) => {

    const [rows] = await connection.query(
        `SELECT id FROM companies WHERE email = ? LIMIT 1`,
        [email]
    );

    return rows.length > 0;
};


// ========================================
// CREATE COMPANY (CONNECTION)
// ========================================
const createCompany = async (connection, data) => {

    const { name, email, phone, address } = data;

    const [result] = await connection.query(`
        INSERT INTO companies (
            name,
            email,
            phone,
            address,
            status,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
    `, [
        name,
        email,
        phone,
        address
    ]);

    return result.insertId;
};


// ========================================
// GET ALL COMPANIES
// ========================================
const getAllCompanies = async () => {

    const [rows] = await pool.query(`
        SELECT 
            id,
            name,
            email,
            phone,
            address,
            status,
            created_at,
            updated_at
        FROM companies
        ORDER BY created_at DESC
    `);

    return rows;
};


// ========================================
// GET COMPANY BY ID
// ========================================
const getCompanyById = async (id) => {

    const [rows] = await pool.query(`
        SELECT 
            id,
            name,
            email,
            phone,
            address,
            status,
            created_at,
            updated_at
        FROM companies
        WHERE id = ?
        LIMIT 1
    `, [id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// UPDATE COMPANY
// ========================================
const updateCompany = async (id, data) => {

    const { name, email, phone, address } = data;

    const [result] = await pool.query(`
        UPDATE companies
        SET name = ?,
            email = ?,
            phone = ?,
            address = ?,
            updated_at = NOW()
        WHERE id = ?
    `, [
        name,
        email,
        phone,
        address,
        id
    ]);

    return result.affectedRows;
};


// ========================================
// UPDATE COMPANY STATUS
// ========================================
const updateCompanyStatus = async (id, status) => {

    const [result] = await pool.query(`
        UPDATE companies
        SET status = ?,
            updated_at = NOW()
        WHERE id = ?
    `, [status, id]);

    return result.affectedRows;
};


// ========================================
// COUNT USERS BY COMPANY
// ========================================
const countUsersByCompany = async (companyId) => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) as total
        FROM users
        WHERE company_id = ?
    `, [companyId]);

    return rows[0].total;
};


// ========================================
// CHECK IF COMPANY HAS USERS
// ========================================
const companyHasUsers = async (companyId) => {

    const [rows] = await pool.query(`
        SELECT id
        FROM users
        WHERE company_id = ?
        LIMIT 1
    `, [companyId]);

    return rows.length > 0;
};


// ========================================
// COUNT PRODUCTS BY COMPANY
// ========================================
const countProductsByCompany = async (companyId) => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) as total
        FROM products
        WHERE company_id = ?
    `, [companyId]);

    return rows[0].total;
};


// ========================================
// COUNT SERVICE ORDERS BY COMPANY
// ========================================
const countServiceOrdersByCompany = async (companyId) => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) as total
        FROM service_orders
        WHERE company_id = ?
    `, [companyId]);

    return rows[0].total;
};


module.exports = {
    findByEmail,
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    updateCompanyStatus,
    countUsersByCompany,
    companyHasUsers,
    countProductsByCompany,
    countServiceOrdersByCompany
};