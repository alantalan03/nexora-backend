const Dashboard = require("../models/dashboard.model");

exports.getDashboardData = async (req, res) => {
    try {

        const company_id = req.user.company_id;
        const userRole = req.user.role;
        const userId = req.user.id;

        const startDate = req.query.start;
        const endDate = req.query.end;

        const [
            totalUsers,
            totalProducts,
            salesSummary,
            todaySalesSummary,
            lowStockProducts,
            openServiceOrders,
            topCustomers,
            salesByUser,
            averageTicket,
            totalProfit,
            profitMarginPercent,
            growth
        ] = await Promise.all([
            Dashboard.getTotalUsers(company_id),
            Dashboard.getTotalActiveProducts(company_id),
            Dashboard.getSalesSummary(company_id, startDate, endDate),
            Dashboard.getTodaySalesSummary(company_id),
            Dashboard.getLowStockProducts(company_id),
            Dashboard.getOpenServiceOrders(company_id, userRole, userId),
            Dashboard.getTopCustomers(company_id),
            Dashboard.getSalesByUser(company_id),
            Dashboard.getAverageTicket(company_id),
            Dashboard.getTotalProfit(company_id),
            Dashboard.getProfitMarginPercent(company_id, startDate, endDate),
            Dashboard.getMonthlyGrowth(company_id)
        ]);

        res.status(200).json({
            users: totalUsers,
            products: totalProducts,
            totalSales: salesSummary.totalSales,
            totalRevenue: salesSummary.totalRevenue,
            salesToday: todaySalesSummary.salesToday,
            revenueToday: todaySalesSummary.revenueToday,
            lowStockProducts,
            openServiceOrders,
            averageTicket,
            totalProfit,
            profitMarginPercent,
            growth,
            topCustomers,
            salesByUser
        });

    } catch (error) {
        console.error("Error dashboard:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};
// ========================================
// MONTHLY SALES
// ========================================
exports.getMonthlySales = async (req, res) => {
    
    try {

        const data = await Dashboard.getMonthlySales(req.user.company_id);

        res.status(200).json(data);

    } catch (error) {
        console.error("Error monthly sales:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// ========================================
// TOP PRODUCTS
// ========================================
exports.getTopProducts = async (req, res) => {
    try {

       const data = await Dashboard.getTopProducts(req.user.company_id);

        res.status(200).json(data);

    } catch (error) {
        console.error("Error top products:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// ========================================
// PAYMENT METHODS SUMMARY
// ========================================
exports.getPaymentMethods = async (req, res) => {
    try {

        const data = await Dashboard.getSalesByPaymentMethod(req.user.company_id);

        res.status(200).json(data);

    } catch (error) {
        console.error("Error payment methods:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

