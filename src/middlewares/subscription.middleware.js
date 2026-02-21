const pool = require("../config/database");


// =====================================================
// VALIDAR SUSCRIPCIÓN ACTIVA
// =====================================================
exports.validateSubscription = async (req, res, next) => {

    try {

        const company_id = req.user.company_id;

        const [rows] = await pool.query(`
            SELECT 
                s.status,
                s.end_date,
                p.id AS plan_id,
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

        if (rows.length === 0) {
            return res.status(403).json({
                message: "La empresa no tiene suscripción activa"
            });
        }

        const subscription = rows[0];

        const allowedStatuses = ["active", "trial"];

        if (!allowedStatuses.includes(subscription.status)) {
            return res.status(403).json({
                message: "Suscripción inactiva o cancelada"
            });
        }

        if (
            subscription.end_date &&
            new Date(subscription.end_date) < new Date()
        ) {
            return res.status(403).json({
                message: "La suscripción ha vencido"
            });
        }

        // 🔥 Guardamos plan en request
        req.subscription = subscription;

        next();

    } catch (error) {
        console.error("Error validateSubscription:", error);
        return res.status(500).json({
            message: "Error validando suscripción"
        });
    }
};


// =====================================================
// VALIDAR LÍMITES DEL PLAN
// =====================================================
exports.validatePlanLimit = (resourceType) => {

    return async (req, res, next) => {

        try {

            if (!req.subscription) {
                return res.status(500).json({
                    message: "Subscription middleware no ejecutado correctamente"
                });
            }

            const company_id = req.user.company_id;
            const plan = req.subscription;

            const limitMap = {
                users: plan.max_users,
                products: plan.max_products,
                service_orders: plan.max_service_orders
            };

            const tableMap = {
                users: "users",
                products: "products",
                service_orders: "service_orders"
            };

            const limit = limitMap[resourceType];

            if (!limit || limit === 0) {
                return next(); // ilimitado
            }

            const table = tableMap[resourceType];

            // 🔥 Solo contar activos
            const [countRows] = await pool.query(`
                SELECT COUNT(*) as total
                FROM ${table}
                WHERE company_id = ?
                AND status = 'active'
            `, [company_id]);

            if (countRows[0].total >= limit) {
                return res.status(403).json({
                    message: `Has alcanzado el límite máximo de ${resourceType}`,
                    plan: plan.plan_name,
                    limit,
                    current: countRows[0].total,
                    upgrade_required: true
                });
            }

            next();

        } catch (error) {
            console.error("Error validatePlanLimit:", error);
            return res.status(500).json({
                message: "Error validando límite del plan"
            });
        }
    };
};