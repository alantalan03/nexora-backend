const pool = require("../config/database");

// ========================================
// BUILD FILTERS
// ========================================
const buildFilters = ({ search, role }) => {

    let whereClause = "WHERE 1=1";
    let values = [];

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
    page,
    limit,
    search,
    role
}) => {

    const offset = (page - 1) * limit;

    const { whereClause, values } = buildFilters({ search, role });

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
const getUserById = async (id) => {

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
    `, [id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// FIND USER BY EMAIL
// ========================================
const findByEmail = async (email) => {

    const [rows] = await pool.query(
        `SELECT id FROM users WHERE email = ?`,
        [email]
    );

    return rows.length ? rows[0] : null;
};


// ========================================
// CREATE USER
// ========================================
const createUser = async ({
    name,
    email,
    password,
    phone,
    role_id
}) => {

    const [result] = await pool.query(`
        INSERT INTO users (
            name,
            email,
            password,
            phone,
            role_id,
            status
        )
        VALUES (?, ?, ?, ?, ?, 'active')
    `, [
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
const updateUser = async (
    id,
    { name, email, phone, role_id }
) => {

    const [result] = await pool.query(`
        UPDATE users
        SET name = ?,
            email = ?,
            phone = ?,
            role_id = ?
        WHERE id = ?
    `, [
        name,
        email,
        phone,
        role_id,
        id
    ]);

    return result.affectedRows;
};


// ========================================
// UPDATE PASSWORD
// ========================================
const updatePassword = async (id, hashedPassword) => {

    const [result] = await pool.query(`
        UPDATE users
        SET password = ?
        WHERE id = ?
    `, [hashedPassword, id]);

    return result.affectedRows;
};


// ========================================
// UPDATE STATUS
// ========================================
const updateUserStatus = async (id, status) => {

    const [result] = await pool.query(`
        UPDATE users
        SET status = ?
        WHERE id = ?
    `, [status, id]);

    return result.affectedRows;
};


module.exports = {
    getAllUsers,
    getUserById,
    findByEmail,
    createUser,
    updateUser,
    updatePassword,
    updateUserStatus
};