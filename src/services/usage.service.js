const pool = require("../config/database");

exports.trackUsage = async ({
    company_id,
    resource_type,
    quantity = 1
}) => {

    try {

        // 🔥 Primer día del mes
        const usagePeriod = new Date();
        usagePeriod.setDate(1);
        usagePeriod.setHours(0, 0, 0, 0);

        await pool.query(`
            INSERT INTO usage_tracking (
                company_id,
                resource_type,
                quantity,
                usage_period,
                created_at
            )
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                quantity = quantity + VALUES(quantity)
        `, [
            company_id,
            resource_type,
            quantity,
            usagePeriod
        ]);

    } catch (error) {
        console.error("Error trackUsage:", error);
    }
};