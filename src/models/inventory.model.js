const pool = require("../config/database");

// ========================================
// GET PRODUCT FOR UPDATE (LOCK)
// ========================================
const getProductForUpdate = async (connection, productId) => {

    const [rows] = await connection.query(
        `SELECT id, name, stock, min_stock 
         FROM products 
         WHERE id = ? 
         FOR UPDATE`,
        [productId]
    );

    return rows.length ? rows[0] : null;
};


// ========================================
// UPDATE PRODUCT STOCK
// ========================================
const updateProductStock = async (connection, productId, newStock) => {

    await connection.query(
        `UPDATE products SET stock = ? WHERE id = ?`,
        [newStock, productId]
    );
};


// ========================================
// CREATE INVENTORY MOVEMENT
// ========================================
const createMovement = async (
    connection,
    {
        product_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        user_id,
        notes = null
    }
) => {

    await connection.query(`
        INSERT INTO inventory_movements (
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            user_id,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        product_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        user_id,
        notes
    ]);
};


// ========================================
// GET MOVEMENTS BY PRODUCT
// ========================================
const getMovementsByProduct = async (productId) => {

    const [rows] = await pool.query(`
        SELECT 
            im.*,
            u.name AS user_name
        FROM inventory_movements im
        JOIN users u ON im.user_id = u.id
        WHERE im.product_id = ?
        ORDER BY im.created_at DESC
    `, [productId]);

    return rows;
};


module.exports = {
    getProductForUpdate,
    updateProductStock,
    createMovement,
    getMovementsByProduct
};