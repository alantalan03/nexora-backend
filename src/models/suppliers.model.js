const pool = require("../config/database");

// ========================================
// CREATE SUPPLIER
// ========================================
const createSupplier = async ({
    company_id,
    name,
    contact_name,
    phone,
    email,
    address,
    tax_id,
    notes
}) => {

    const [result] = await pool.query(`
        INSERT INTO suppliers (
            company_id,
            name,
            contact_name,
            phone,
            email,
            address,
            tax_id,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        company_id,
        name,
        contact_name,
        phone,
        email,
        address,
        tax_id,
        notes
    ]);

    return result.insertId;
};

// ========================================
// GET ALL SUPPLIERS
// ========================================
const getAllSuppliers = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM suppliers
        WHERE company_id = ?
        AND status = 'active'
        ORDER BY created_at DESC
    `, [company_id]);

    return rows;
};

// ========================================
// GET SUPPLIER BY ID
// ========================================
const getSupplierById = async (id, company_id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM suppliers
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
    `, [id, company_id]);

    return rows.length ? rows[0] : null;
};

// ========================================
// UPDATE SUPPLIER
// ========================================
const updateSupplier = async (
    id,
    company_id,
    data
) => {

    const {
        name,
        contact_name,
        phone,
        email,
        address,
        tax_id,
        notes
    } = data;

    const [result] = await pool.query(`
        UPDATE suppliers
        SET name = ?,
            contact_name = ?,
            phone = ?,
            email = ?,
            address = ?,
            tax_id = ?,
            notes = ?
        WHERE id = ?
        AND company_id = ?
    `, [
        name,
        contact_name,
        phone,
        email,
        address,
        tax_id,
        notes,
        id,
        company_id
    ]);

    return result.affectedRows;
};

// ========================================
// SOFT DELETE SUPPLIER
// ========================================
const deleteSupplier = async (id, company_id) => {

    const [result] = await pool.query(`
        UPDATE suppliers
        SET status = 'inactive'
        WHERE id = ?
        AND company_id = ?
    `, [id, company_id]);

    return result.affectedRows;
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};