const pool = require("../config/database");

// =========================================
// USO DE EMPRESA ACTUAL
// =========================================
exports.getMyUsage = async (req, res) => {

    try {

        const company_id = req.user.company_id;

        const [rows] = await pool.query(`
            SELECT 
                resource_type,
                quantity,
                usage_period
            FROM usage_tracking
            WHERE company_id = ?
            ORDER BY usage_period DESC
        `, [company_id]);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Error getMyUsage:", error);
        res.status(500).json({
            message: "Error obteniendo uso"
        });
    }
};


// =========================================
// USO DE EMPRESA ESPECÍFICA (SUPER ADMIN)
// =========================================
exports.getCompanyUsage = async (req, res) => {

    try {

        const { companyId } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                resource_type,
                quantity,
                usage_period
            FROM usage_tracking
            WHERE company_id = ?
            ORDER BY usage_period DESC
        `, [companyId]);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Error getCompanyUsage:", error);
        res.status(500).json({
            message: "Error obteniendo uso"
        });
    }
};

exports.getUsageSummary = async (req, res) => {
    try {

        const company_id = req.user.company_id;

        // 🔹 Obtener suscripción actual
        const [subRows] = await pool.query(`
            SELECT 
                s.status,
                s.end_date,
                p.name AS plan_name,
                p.max_users,
                p.max_products,
                p.max_service_orders
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.company_id = ?
            ORDER BY s.id DESC
            LIMIT 1
        `, [company_id]);

        if (!subRows.length) {
            return res.status(404).json({
                message: "No hay suscripción activa"
            });
        }

        const subscription = subRows[0];

        // 🔹 Obtener uso actual
        const [usageRows] = await pool.query(`
            SELECT resource_type, SUM(quantity) as total
            FROM usage_tracking
            WHERE company_id = ?
            GROUP BY resource_type
        `, [company_id]);

        const usageMap = {
            users: 0,
            products: 0,
            service_orders: 0
        };

        usageRows.forEach(row => {
            usageMap[row.resource_type] = row.total;
        });

        // 🔹 Calcular porcentajes
        const percentage = {
            users: subscription.max_users
                ? Math.round((usageMap.users / subscription.max_users) * 100)
                : 0,
            products: subscription.max_products
                ? Math.round((usageMap.products / subscription.max_products) * 100)
                : 0,
            service_orders: subscription.max_service_orders
                ? Math.round((usageMap.service_orders / subscription.max_service_orders) * 100)
                : 0
        };

        // 🔹 Calcular días restantes
        const today = new Date();
        const endDate = new Date(subscription.end_date);
        const diffTime = endDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        res.status(200).json({
            plan: subscription.plan_name,
            status: subscription.status,
            days_remaining: daysRemaining,
            limits: {
                users: subscription.max_users,
                products: subscription.max_products,
                service_orders: subscription.max_service_orders
            },
            usage: usageMap,
            percentage
        });

    } catch (error) {
        console.error("Error getUsageSummary:", error);
        res.status(500).json({
            message: "Error obteniendo resumen de uso"
        });
    }
};