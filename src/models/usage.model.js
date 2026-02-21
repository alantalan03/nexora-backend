const pool = require("../config/database");

const registerUsage = async (
    company_id,
    resource_type,
    resource_id
) => {

    await pool.query(`
        INSERT INTO usage_tracking (
            company_id,
            resource_type,
            resource_id,
            quantity,
            usage_period
        )
        VALUES (
            ?,
            ?,
            ?,
            1,
            DATE_FORMAT(NOW(), '%Y-%m-01')
        )
        ON DUPLICATE KEY UPDATE
            quantity = quantity + 1
    `, [company_id, resource_type, resource_id]);
};

const incrementUsage = async (company_id, resource_type) => {

    await pool.query(`
        INSERT INTO usage_tracking (
            company_id,
            resource_type,
            quantity,
            usage_period
        )
        VALUES (?, ?, 1, DATE_FORMAT(NOW(), '%Y-%m-01'))
        ON DUPLICATE KEY UPDATE
            quantity = quantity + 1
    `, [company_id, resource_type]);
};

const decrementUsage = async (company_id, resource_type) => {

    await pool.query(`
        UPDATE usage_tracking
        SET quantity = GREATEST(quantity - 1, 0)
        WHERE company_id = ?
        AND resource_type = ?
        AND usage_period = DATE_FORMAT(NOW(), '%Y-%m-01')
    `, [company_id, resource_type]);
};

module.exports = {
    registerUsage,
    incrementUsage,
    decrementUsage
};