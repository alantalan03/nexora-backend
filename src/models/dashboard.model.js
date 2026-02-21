const pool = require("../config/database");

// ========================================
// TOTAL USERS
// ========================================
const getTotalUsers = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS totalUsers
        FROM users
        WHERE company_id = ?
        AND status = 'active'
    `, [company_id]);

    return rows[0].totalUsers;
};


// ========================================
// TOTAL ACTIVE PRODUCTS
// ========================================
const getTotalActiveProducts = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS totalProducts
        FROM products
        WHERE company_id = ?
        AND status = 'active'
    `, [company_id]);

    return rows[0].totalProducts;
};


// ========================================
// TOTAL SALES + REVENUE
// ========================================
const getSalesSummary = async (company_id, start, end) => {

    let whereClause = `
        WHERE company_id = ?
        AND status = 'completed'
    `;

    const params = [company_id];

    if (start && end) {
        whereClause += ` AND DATE(created_at) BETWEEN ? AND ?`;
        params.push(start, end);
    }

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS totalSales,
               IFNULL(SUM(total_amount), 0) AS totalRevenue
        FROM sales
        ${whereClause}
    `, params);

    return rows[0];
};


// ========================================
// TODAY SALES + REVENUE
// ========================================
const getTodaySalesSummary = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS salesToday,
               IFNULL(SUM(total_amount), 0) AS revenueToday
        FROM sales
        WHERE company_id = ?
        AND status = 'completed'
        AND DATE(created_at) = CURDATE()
    `, [company_id]);

    return rows[0];
};

// ========================================
// LOW STOCK PRODUCTS
// ========================================
const getLowStockProducts = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT COUNT(*) AS lowStockProducts
        FROM products
        WHERE company_id = ?
        AND stock <= min_stock
        AND status = 'active'
    `, [company_id]);

    return rows[0].lowStockProducts;
};


// ========================================
// OPEN SERVICE ORDERS (ROLE BASED)
// ========================================
const getOpenServiceOrders = async (company_id, role, userId) => {

    let query = `
        SELECT COUNT(*) AS openServiceOrders
        FROM service_orders
        WHERE status NOT IN ('delivered','cancelled')
        AND company_id = ?
    `;

    const params = [company_id];

    // Si es técnico solo ver sus órdenes
    if (role === "tecnico") {
        query += ` AND technician_id = ?`;
        params.push(userId);
    }

    const [rows] = await pool.query(query, params);

    return rows[0].openServiceOrders;
};

// ========================================
// MONTHLY SALES (CURRENT YEAR)
// ========================================
const getMonthlySales = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            MONTH(created_at) AS month,
            IFNULL(SUM(total_amount), 0) AS revenue
        FROM sales
        WHERE company_id = ?
        AND status = 'completed'
        AND YEAR(created_at) = YEAR(CURDATE())
        GROUP BY MONTH(created_at)
        ORDER BY month
    `, [company_id]);

    return rows;
};
// ========================================
// TOP SELLING PRODUCTS
// ========================================
const getTopProducts = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            p.id,
            p.name,
            SUM(sp.quantity) AS totalSold,
            SUM(sp.subtotal) AS totalRevenue
        FROM sale_products sp
        JOIN products p ON p.id = sp.product_id
        JOIN sales s ON s.id = sp.sale_id
        WHERE s.company_id = ?
        AND s.status = 'completed'
        GROUP BY p.id, p.name
        ORDER BY totalSold DESC
        LIMIT 5
    `, [company_id]);

    return rows;
};

// ========================================
// SALES BY PAYMENT METHOD
// ========================================
const getSalesByPaymentMethod = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            payment_method AS method,
            COUNT(*) AS total,
            IFNULL(SUM(total_amount), 0) AS revenue
        FROM sales
        WHERE company_id = ?
        AND status = 'completed'
        GROUP BY payment_method
        ORDER BY revenue DESC
    `, [company_id]);

    return rows;
};

// ========================================
// TOP CUSTOMERS
// ========================================
const getTopCustomers = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            c.id,
            c.name,
            COUNT(s.id) AS totalPurchases,
            IFNULL(SUM(s.total_amount), 0) AS totalSpent
        FROM sales s
        JOIN customers c ON c.id = s.customer_id
        WHERE s.company_id = ?
        AND s.status = 'completed'
        AND s.customer_id IS NOT NULL
        GROUP BY c.id, c.name
        ORDER BY totalSpent DESC
        LIMIT 5
    `, [company_id]);

    return rows;
};

// ========================================
// SALES BY USER
// ========================================
const getSalesByUser = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            u.id,
            u.name,
            COUNT(s.id) AS totalSales,
            IFNULL(SUM(s.total_amount), 0) AS totalRevenue
        FROM sales s
        JOIN users u ON u.id = s.user_id
        WHERE s.company_id = ?
        AND s.status = 'completed'
        GROUP BY u.id, u.name
        ORDER BY totalRevenue DESC
    `, [company_id]);

    return rows;
};

// ========================================
// AVERAGE TICKET
// ========================================
const getAverageTicket = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            IFNULL(AVG(total_amount), 0) AS averageTicket
        FROM sales
        WHERE company_id = ?
        AND status = 'completed'
    `, [company_id]);

    return Number(rows[0].averageTicket).toFixed(2);
};

// ========================================
// TOTAL PROFIT
// ========================================
const getTotalProfit = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            IFNULL(SUM(sp.profit), 0) AS totalProfit
        FROM sale_products sp
        JOIN sales s ON s.id = sp.sale_id
        WHERE s.company_id = ?
        AND s.status = 'completed'
    `, [company_id]);

    return rows[0].totalProfit;
};

// ========================================
// PROFIT MARGIN PERCENT
// ========================================
const getProfitMarginPercent = async (company_id, start, end) => {

    let whereClause = `
        WHERE s.company_id = ?
        AND s.status = 'completed'
    `;

    const params = [company_id];

    if (start && end) {
        whereClause += ` AND DATE(s.created_at) BETWEEN ? AND ?`;
        params.push(start, end);
    }

    const [rows] = await pool.query(`
        SELECT 
            IFNULL(SUM(sp.profit),0) AS totalProfit,
            IFNULL(SUM(s.total_amount),0) AS totalRevenue
        FROM sale_products sp
        JOIN sales s ON s.id = sp.sale_id
        ${whereClause}
    `, params);

    const totalProfit = Number(rows[0].totalProfit);
    const totalRevenue = Number(rows[0].totalRevenue);

    if (totalRevenue === 0) return 0;

    return ((totalProfit / totalRevenue) * 100).toFixed(2);
};

// ========================================
// MONTHLY GROWTH
// ========================================
const getMonthlyGrowth = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            YEAR(created_at) AS year,
            MONTH(created_at) AS month,
            COUNT(*) AS totalSales,
            IFNULL(SUM(total_amount),0) AS revenue
        FROM sales
        WHERE company_id = ?
        AND status = 'completed'
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year DESC, month DESC
        LIMIT 2
    `, [company_id]);

    if (rows.length < 2) {
        return {
            salesGrowthPercent: 0,
            revenueGrowthPercent: 0
        };
    }

    const currentSales = Number(rows[0].totalSales);
    const previousSales = Number(rows[1].totalSales);

    const currentRevenue = Number(rows[0].revenue);
    const previousRevenue = Number(rows[1].revenue);

    const salesGrowth = previousSales === 0
        ? 100
        : ((currentSales - previousSales) / previousSales) * 100;

    const revenueGrowth = previousRevenue === 0
        ? 100
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    return {
        salesGrowthPercent: salesGrowth.toFixed(2),
        revenueGrowthPercent: revenueGrowth.toFixed(2)
    };
};


module.exports = {
    getTotalUsers,
    getTotalActiveProducts,
    getSalesSummary,
    getTodaySalesSummary,
    getLowStockProducts,
    getOpenServiceOrders,
    getMonthlySales,
    getTopProducts,
    getSalesByPaymentMethod,
    getTopCustomers,
    getSalesByUser,
    getAverageTicket,
    getTotalProfit,
    getProfitMarginPercent,
    getMonthlyGrowth
};