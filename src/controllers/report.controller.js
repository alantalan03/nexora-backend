const Report = require("../models/report.model");

// ========================================
// SALES SUMMARY BY DATE RANGE
// ========================================
exports.getSalesSummary = async (req, res) => {
    try {

        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                message: "start_date y end_date son requeridos"
            });
        }

        const summary = await Report.getSalesSummary(start_date, end_date);

        res.status(200).json(summary);

    } catch (error) {
        console.error("Error getSalesSummary:", error);
        res.status(500).json({ message: "Error interno" });
    }
};


// ========================================
// SALES BY DAY
// ========================================
exports.getSalesByDay = async (req, res) => {
    try {

        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                message: "start_date y end_date son requeridos"
            });
        }

        const data = await Report.getSalesByDay(start_date, end_date);

        res.status(200).json(data);

    } catch (error) {
        console.error("Error getSalesByDay:", error);
        res.status(500).json({ message: "Error interno" });
    }
};


// ========================================
// TOP SELLING PRODUCTS
// ========================================
exports.getTopProducts = async (req, res) => {
    try {

        const { limit = 5 } = req.query;

        const products = await Report.getTopProducts(limit);

        res.status(200).json(products);

    } catch (error) {
        console.error("Error getTopProducts:", error);
        res.status(500).json({ message: "Error interno" });
    }
};


// ========================================
// LOW STOCK REPORT
// ========================================
exports.getLowStockReport = async (req, res) => {
    try {

        const report = await Report.getLowStockReport();

        res.status(200).json(report);

    } catch (error) {
        console.error("Error getLowStockReport:", error);
        res.status(500).json({ message: "Error interno" });
    }
};


// ========================================
// TECHNICIAN PERFORMANCE
// ========================================
exports.getTechnicianPerformance = async (req, res) => {
    try {

        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                message: "start_date y end_date son requeridos"
            });
        }

        const performance = await Report.getTechnicianPerformance(
            start_date,
            end_date
        );

        res.status(200).json(performance);

    } catch (error) {
        console.error("Error getTechnicianPerformance:", error);
        res.status(500).json({ message: "Error interno" });
    }
};


// ========================================
// GENERAL REPORT
// ========================================
exports.getGeneralReport = async (req, res) => {
    try {

        const report = await Report.getGeneralReport();

        res.status(200).json(report);

    } catch (error) {
        console.error("Error getGeneralReport:", error);
        res.status(500).json({ message: "Error interno" });
    }
};