const pool = require("../config/database");

// ========================================
// TOTAL USERS
// ========================================
const getTotalUsers = async () => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS totalUsers
        FROM users
    `);

    return rows[0].totalUsers;
};


// ========================================
// TOTAL ACTIVE PRODUCTS
// ========================================
const getTotalActiveProducts = async () => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS totalProducts
        FROM products
        WHERE status = 'active'
    `);

    return rows[0].totalProducts;
};


// ========================================
// TOTAL SALES + REVENUE
// ========================================
const getSalesSummary = async () => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS totalSales,
               IFNULL(SUM(total_amount), 0) AS totalRevenue
        FROM sales
    `);

    return rows[0];
};


// ========================================
// TODAY SALES + REVENUE
// ========================================
const getTodaySalesSummary = async () => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS salesToday,
               IFNULL(SUM(total_amount), 0) AS revenueToday
        FROM sales
        WHERE DATE(created_at) = CURDATE()
    `);

    return rows[0];
};


// ========================================
// LOW STOCK PRODUCTS
// ========================================
const getLowStockProducts = async () => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS lowStockProducts
        FROM products
        WHERE stock <= min_stock
        AND status = 'active'
    `);

    return rows[0].lowStockProducts;
};


// ========================================
// OPEN SERVICE ORDERS (ROLE BASED)
// ========================================
const getOpenServiceOrders = async (role, userId) => {

    let query = `
        SELECT COUNT(*) AS openServiceOrders
        FROM service_orders
        WHERE status NOT IN ('delivered','cancelled')
    `;

    const params = [];

    // Si es técnico solo ver sus órdenes
    if (role === "tecnico") {
        query += ` AND technician_id = ?`;
        params.push(userId);
    }

    const [rows] = await pool.query(query, params);

    return rows[0].openServiceOrders;
};


module.exports = {
    getTotalUsers,
    getTotalActiveProducts,
    getSalesSummary,
    getTodaySalesSummary,
    getLowStockProducts,
    getOpenServiceOrders
};