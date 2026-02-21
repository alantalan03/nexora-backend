const pool = require("../config/database");

// ========================================
// GET PRODUCT FOR UPDATE (LOCK)
// ========================================
const getProductForUpdate = async (connection, productId, company_id) => {

    const [rows] = await connection.query(
        `SELECT id, name, stock, min_stock 
         FROM products 
         WHERE id = ?
         AND company_id = ?
         FOR UPDATE`,
        [productId, company_id]
    );

    return rows.length ? rows[0] : null;
};


// ========================================
// UPDATE PRODUCT STOCK
// ========================================
const updateProductStock = async (connection, productId, company_id, newStock) => {

    await connection.query(
        `UPDATE products 
         SET stock = ? 
         WHERE id = ? 
         AND company_id = ?`,
        [newStock, productId, company_id]
    );
};


// ========================================
// CREATE INVENTORY MOVEMENT
// ========================================
const createMovement = async (
    connection,
    {
        company_id,
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
            company_id,
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            user_id,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        company_id,
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
const getMovementsByProduct = async (productId, company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            im.*,
            u.name AS user_name
        FROM inventory_movements im
        JOIN users u ON im.user_id = u.id
        WHERE im.product_id = ?
        AND im.company_id = ?
        ORDER BY im.created_at DESC
    `, [productId, company_id]);

    return rows;
};

// ========================================
// GET ALL MOVEMENTS (PAGINATED)
// ========================================
const getAllMovements = async ({ company_id, page = 1, limit = 10 }) => {

    const offset = (page - 1) * limit;

    const [data] = await pool.query(`
        SELECT 
            im.*,
            p.name AS product_name,
            u.name AS user_name
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        JOIN users u ON im.user_id = u.id
        WHERE im.company_id = ?
        ORDER BY im.created_at DESC
        LIMIT ? OFFSET ?
    `, [company_id, limit, offset]);

    const [count] = await pool.query(`
        SELECT COUNT(*) AS total 
        FROM inventory_movements
        WHERE company_id = ?
    `, [company_id]);

    return {
        data,
        total: count[0].total
    };
};

// ========================================
// LOW STOCK PRODUCTS
// ========================================
const getLowStockProducts = async (company_id) => {

    const [rows] = await pool.query(`
        SELECT id, name, stock, min_stock
        FROM products
        WHERE company_id = ?
        AND stock <= min_stock
        AND status = 'active'
        ORDER BY stock ASC
    `, [company_id]);

    return rows;
};


module.exports = {
    getProductForUpdate,
    updateProductStock,
    createMovement,
    getMovementsByProduct,
    getAllMovements,
    getLowStockProducts
};