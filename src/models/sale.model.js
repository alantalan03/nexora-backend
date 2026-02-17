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
    updateSaleTotals
};