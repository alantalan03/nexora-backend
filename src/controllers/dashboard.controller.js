const Dashboard = require("../models/dashboard.model");

exports.getDashboardData = async (req, res) => {
    try {

        const userRole = req.user.role;
        const userId = req.user.id;

        const [
            totalUsers,
            totalProducts,
            salesSummary,
            todaySalesSummary,
            lowStockProducts,
            openServiceOrders
        ] = await Promise.all([
            Dashboard.getTotalUsers(),
            Dashboard.getTotalActiveProducts(),
            Dashboard.getSalesSummary(),
            Dashboard.getTodaySalesSummary(),
            Dashboard.getLowStockProducts(),
            Dashboard.getOpenServiceOrders(userRole, userId)
        ]);

        res.status(200).json({
            users: totalUsers,
            products: totalProducts,
            totalSales: salesSummary.totalSales,
            totalRevenue: salesSummary.totalRevenue,
            salesToday: todaySalesSummary.salesToday,
            revenueToday: todaySalesSummary.revenueToday,
            lowStockProducts,
            openServiceOrders
        });

    } catch (error) {
        console.error("Error dashboard:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};