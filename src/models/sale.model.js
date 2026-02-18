const pool = require("../config/database");

// ========================================
// CREATE SALE HEADER
// ========================================
const createSaleHeader = async (
    connection,
    { user_id, tax, discount, payment_method }
) => {

    const [result] = await connection.query(`
        INSERT INTO sales (
            user_id,
            subtotal,
            tax,
            discount,
            total_amount,
            payment_method
        )
        VALUES (?, 0, ?, ?, 0, ?)
    `, [
        user_id,
        tax,
        discount,
        payment_method
    ]);

    return result.insertId;
};

// ========================================
// GET SALE HEADER BY ID
// ========================================
const getSaleHeaderById = async (saleId) => {

    const [rows] = await pool.query(`
        SELECT 
            s.id,
            s.user_id,
            u.name AS user_name,
            s.subtotal,
            s.tax,
            s.discount,
            s.total_amount,
            s.payment_method,
            s.status,
            s.created_at
        FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
    `, [saleId]);

    return rows.length ? rows[0] : null;
};


// ========================================
// GET SALE PRODUCTS BY SALE ID
// ========================================
const getSaleProductsBySaleId = async (saleId) => {

    const [rows] = await pool.query(`
        SELECT 
            sp.product_id,
            p.name,
            sp.quantity,
            sp.unit_price,
            sp.purchase_price,
            sp.subtotal,
            sp.profit
        FROM sale_products sp
        JOIN products p ON sp.product_id = p.id
        WHERE sp.sale_id = ?
    `, [saleId]);

    return rows;
};

// ========================================
// GET ALL SALES
// ========================================
const getAllSales = async ({
    page,
    limit,
    start_date,
    end_date,
    payment_method,
    status
}) => {

    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    let values = [];

    if (start_date) {
        whereClause += " AND DATE(s.created_at) >= ?";
        values.push(start_date);
    }

    if (end_date) {
        whereClause += " AND DATE(s.created_at) <= ?";
        values.push(end_date);
    }

    if (payment_method) {
        whereClause += " AND s.payment_method = ?";
        values.push(payment_method);
    }

    if (status) {
        whereClause += " AND s.status = ?";
        values.push(status);
    }

    const [data] = await pool.query(`
        SELECT 
            s.id,
            s.subtotal,
            s.tax,
            s.discount,
            s.total_amount,
            s.payment_method,
            s.status,
            s.created_at,
            u.name AS user_name
        FROM sales s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
    `, [...values, limit, offset]);

    const [totalResult] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM sales s
        ${whereClause}
    `, values);

    return {
        data,
        total: totalResult[0].total
    };
};


// ========================================
// GET SALE FOR UPDATE
// ========================================
const getSaleForUpdate = async (connection, saleId) => {

    const [rows] = await connection.query(`
        SELECT *
        FROM sales
        WHERE id = ?
        FOR UPDATE
    `, [saleId]);

    return rows.length ? rows[0] : null;
};


// ========================================
// MARK SALE AS CANCELLED
// ========================================
const markSaleAsCancelled = async (connection, saleId) => {

    await connection.query(`
        UPDATE sales
        SET status = 'cancelled'
        WHERE id = ?
    `, [saleId]);
};



// ========================================
// DAILY SUMMARY
// ========================================
const getDailySummary = async () => {

    const [rows] = await pool.query(`
        SELECT 
            COUNT(*) AS totalSales,
            SUM(total_amount) AS totalRevenue,
            SUM(
                (SELECT SUM(profit)
                 FROM sale_products sp
                 WHERE sp.sale_id = s.id)
            ) AS totalProfit
        FROM sales s
        WHERE DATE(created_at) = CURDATE()
        AND status = 'completed'
    `);

    return rows[0];
};

// ========================================
// GET PRODUCT FOR UPDATE (LOCK STOCK)
// ========================================
const getProductForUpdate = async (connection, productId) => {

    const [rows] = await connection.query(
        `SELECT * FROM products WHERE id = ? FOR UPDATE`,
        [productId]
    );

    return rows.length ? rows[0] : null;
};


// ========================================
// INSERT SALE PRODUCT DETAIL
// ========================================
const insertSaleProduct = async (
    connection,
    {
        sale_id,
        product_id,
        quantity,
        unit_price,
        purchase_price,
        subtotal,
        profit
    }
) => {

    await connection.query(`
        INSERT INTO sale_products (
            sale_id,
            product_id,
            quantity,
            unit_price,
            purchase_price,
            subtotal,
            profit
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        sale_id,
        product_id,
        quantity,
        unit_price,
        purchase_price,
        subtotal,
        profit
    ]);
};


// ========================================
// UPDATE PRODUCT STOCK
// ========================================
const updateProductStock = async (
    connection,
    productId,
    newStock
) => {

    await connection.query(`
        UPDATE products
        SET stock = ?
        WHERE id = ?
    `, [newStock, productId]);
};


// ========================================
// INSERT INVENTORY MOVEMENT (SALE)
// ========================================
const insertInventoryMovement = async (
    connection,
    {
        product_id,
        quantity,
        previous_stock,
        new_stock,
        reference_id,
        user_id
    }
) => {

    await connection.query(`
        INSERT INTO inventory_movements (
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reference_id,
            user_id,
            notes
        )
        VALUES (?, 'sale', ?, ?, ?, ?, ?, 'Venta realizada')
    `, [
        product_id,
        quantity,
        previous_stock,
        new_stock,
        reference_id,
        user_id
    ]);
};


// ========================================
// UPDATE FINAL SALE TOTALS
// ========================================
const updateSaleTotals = async (
    connection,
    saleId,
    subtotal,
    totalAmount
) => {

    await connection.query(`
        UPDATE sales
        SET subtotal = ?,
            total_amount = ?
        WHERE id = ?
    `, [
        subtotal,
        totalAmount,
        saleId
    ]);
};


module.exports = {
    createSaleHeader,
    getProductForUpdate,
    insertSaleProduct,
    updateProductStock,
    insertInventoryMovement,
    updateSaleTotals,
    getSaleHeaderById,
    getSaleProductsBySaleId,
    getAllSales,
    getSaleForUpdate,
    markSaleAsCancelled,
    getDailySummary
};