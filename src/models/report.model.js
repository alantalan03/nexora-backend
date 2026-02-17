const pool = require("../config/database");

// ========================================
// SALES SUMMARY
// ========================================
const getSalesSummary = async (startDate, endDate) => {

    const [rows] = await pool.query(`
        SELECT 
            COUNT(*) AS totalSales,
            IFNULL(SUM(total_amount), 0) AS totalRevenue,
            IFNULL(AVG(total_amount), 0) AS averageTicket
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
    `, [startDate, endDate]);

    return rows[0];
};


// ========================================
// SALES BY DAY
// ========================================
const getSalesByDay = async (startDate, endDate) => {

    const [rows] = await pool.query(`
        SELECT 
            DATE(created_at) AS date,
            COUNT(*) AS totalSales,
            IFNULL(SUM(total_amount), 0) AS totalRevenue
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `, [startDate, endDate]);

    return rows;
};


// ========================================
// TOP SELLING PRODUCTS
// ========================================
const getTopProducts = async (limit) => {

    const [rows] = await pool.query(`
        SELECT 
            p.id,
            p.name,
            SUM(si.quantity) AS totalSold
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.id
        ORDER BY totalSold DESC
        LIMIT ?
    `, [Number(limit)]);

    return rows;
};


// ========================================
// LOW STOCK REPORT
// ========================================
const getLowStockReport = async () => {

    const [rows] = await pool.query(`
        SELECT 
            id,
            name,
            sku,
            stock,
            min_stock
        FROM products
        WHERE stock <= min_stock
          AND status = 'active'
        ORDER BY stock ASC
    `);

    return rows;
};


// ========================================
// TECHNICIAN PERFORMANCE
// ========================================
const getTechnicianPerformance = async (startDate, endDate) => {

    const [rows] = await pool.query(`
        SELECT 
            u.id,
            u.name,
            COUNT(so.id) AS totalOrders,
            SUM(CASE WHEN so.status = 'delivered' THEN 1 ELSE 0 END) AS completedOrders
        FROM service_orders so
        JOIN users u ON so.technician_id = u.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY u.id
        ORDER BY totalOrders DESC
    `, [startDate, endDate]);

    return rows;
};


// ========================================
// GENERAL DASHBOARD REPORT
// ========================================
const getGeneralReport = async () => {

    const [[sales]] = await pool.query(`
        SELECT 
            COUNT(*) AS totalSales,
            IFNULL(SUM(total_amount),0) AS totalRevenue
        FROM sales
    `);

    const [[orders]] = await pool.query(`
        SELECT COUNT(*) AS totalServiceOrders
        FROM service_orders
    `);

    const [[products]] = await pool.query(`
        SELECT COUNT(*) AS totalProducts
        FROM products
        WHERE status = 'active'
    `);

    const [[users]] = await pool.query(`
        SELECT COUNT(*) AS totalUsers
        FROM users
    `);

    return {
        totalSales: sales.totalSales,
        totalRevenue: sales.totalRevenue,
        totalServiceOrders: orders.totalServiceOrders,
        totalProducts: products.totalProducts,
        totalUsers: users.totalUsers
    };
};


module.exports = {
    getSalesSummary,
    getSalesByDay,
    getTopProducts,
    getLowStockReport,
    getTechnicianPerformance,
    getGeneralReport
};