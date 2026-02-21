const pool = require("../config/database");

// ========================================
// BUILD FILTERS (MULTIEMPRESA)
// ========================================
const buildFilters = ({ company_id, search, role }) => {

    let whereClause = "WHERE u.company_id = ?";
    let values = [company_id];

    if (search) {
        whereClause += " AND (u.name LIKE ? OR u.email LIKE ?)";
        values.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
        whereClause += " AND r.name = ?";
        values.push(role);
    }

    return { whereClause, values };
};


// ========================================
// GET ALL USERS
// ========================================
const getAllUsers = async ({
    company_id,
    page,
    limit,
    search,
    role
}) => {

    const offset = (page - 1) * limit;

    const { whereClause, values } = buildFilters({
        company_id,
        search,
        role
    });

    const [users] = await pool.query(`
        SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.status,
            u.last_login,
            u.created_at,
            r.name AS role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
    `, [...values, Number(limit), Number(offset)]);

    const [totalResult] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ${whereClause}
    `, values);

    return {
        data: users,
        total: totalResult[0].total
    };
};


// ========================================
// GET USER BY ID
// ========================================
const getUserById = async (id, company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.status,
            u.last_login,
            u.created_at,
            r.name AS role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
        AND u.company_id = ?
        LIMIT 1
    `, [id, company_id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// FIND USER BY EMAIL (MULTIEMPRESA)
// ========================================
const findByEmailGlobal = async (email) => {
    const [rows] = await pool.query(`
        SELECT id FROM users
        WHERE email = ?
        LIMIT 1
    `, [email]);

    return rows.length ? rows[0] : null;
};


// ========================================
// CREATE USER
// ========================================
const createUser = async ({
    company_id,
    name,
    email,
    password,
    phone,
    role_id
}) => {

    const [result] = await pool.query(`
        INSERT INTO users (
            company_id,
            name,
            email,
            password,
            phone,
            role_id,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    `, [
        company_id,
        name,
        email,
        password,
        phone,
        role_id
    ]);

    return result.insertId;
};


// ========================================
// UPDATE USER
// ========================================
const updateUser = async (id, company_id, data) => {

    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push("name = ?");
        values.push(data.name);
    }

    if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email);
    }

    if (data.phone !== undefined) {
        fields.push("phone = ?");
        values.push(data.phone);
    }

    if (data.role_id !== undefined) {
        fields.push("role_id = ?");
        values.push(data.role_id);
    }

    // 🚨 Si no se envió ningún campo
    if (!fields.length) {
        return 0;
    }

    const sql = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
        AND company_id = ?
    `;

    values.push(id, company_id);

    const [result] = await pool.query(sql, values);

    return result.affectedRows;
};


// ========================================
// UPDATE PASSWORD
// ========================================
const updatePassword = async (
    id,
    company_id,
    hashedPassword
) => {

    const [result] = await pool.query(`
        UPDATE users
        SET password = ?
        WHERE id = ?
        AND company_id = ?
    `, [hashedPassword, id, company_id]);

    return result.affectedRows;
};


// ========================================
// UPDATE STATUS
// ========================================
const updateUserStatus = async (
    id,
    company_id,
    status
) => {

    const [result] = await pool.query(`
        UPDATE users
        SET status = ?
        WHERE id = ?
        AND company_id = ?
    `, [status, id, company_id]);

    return result.affectedRows;
};


module.exports = {
    getAllUsers,
    getUserById,
    findByEmailGlobal,
    createUser,
    updateUser,
    updatePassword,
    updateUserStatus
};