const pool = require("../config/database");

// ========================================
// CREATE NOTIFICATION
// ========================================
exports.createNotification = async ({
    type,
    title,
    message,
    reference_id = null,
    user_id = null
}) => {

    await pool.query(`
        INSERT INTO notifications (
            type,
            title,
            message,
            reference_id,
            user_id
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        type,
        title,
        message,
        reference_id,
        user_id
    ]);
};

// ========================================
// GET USER NOTIFICATIONS
// ========================================
exports.getUserNotifications = async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT *
            FROM notifications
            WHERE user_id = ? OR user_id IS NULL
            ORDER BY created_at DESC
        `, [req.user.id]);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Error getUserNotifications:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// MARK AS READ
// ========================================
exports.markAsRead = async (req, res) => {
    try {

        const { id } = req.params;

        await pool.query(`
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = ?
        `, [id]);

        res.status(200).json({
            message: "Notificación marcada como leída"
        });

    } catch (error) {
        console.error("Error markAsRead:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};

// ========================================
// CHECK LOW STOCK AND NOTIFY
// ========================================
exports.checkLowStock = async () => {
    try {

        const [rows] = await pool.query(`
            SELECT id, name, stock, min_stock
            FROM products
            WHERE stock <= min_stock
              AND status = 'active'
        `);

        for (const product of rows) {

            await pool.query(`
                INSERT INTO notifications (
                    type,
                    title,
                    message,
                    reference_id
                )
                VALUES (
                    'stock',
                    'Stock bajo',
                    ?,
                    ?
                )
            `, [
                `El producto "${product.name}" tiene stock bajo (${product.stock})`,
                product.id
            ]);
        }

    } catch (error) {
        console.error("Error checkLowStock:", error);
    }
};