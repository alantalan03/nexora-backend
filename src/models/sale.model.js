const pool = require("../config/database");

// ========================================
// CREATE SALE HEADER
// ========================================
const createSaleHeader = async (
    connection,
    { company_id, user_id, customer_id, tax, discount, payment_method }
) => {

    const [result] = await connection.query(`
        INSERT INTO sales (
            company_id,
            customer_id,
            user_id,
            subtotal,
            tax,
            discount,
            total_amount,
            payment_method
        )
        VALUES (?, ?, ?, 0, ?, ?, 0, ?)
    `, [
        company_id,
        customer_id,
        user_id,
        tax,
        discount,
        payment_method
    ]);

    return result.insertId;
};

const getCustomerById = async (
    connection,
    customerId,
    company_id
) => {

    const [rows] = await connection.query(
        `SELECT id 
         FROM customers 
         WHERE id = ?
         AND company_id = ?
         AND status = 'active'
         LIMIT 1`,
        [customerId, company_id]
    );

    return rows.length ? rows[0] : null;
};

// ========================================
// GET SALE HEADER BY ID
// ========================================
const getSaleHeaderById = async (saleId, company_id) => {

    const [rows] = await pool.query(`
        SELECT 
            s.id,
            s.company_id,
            s.user_id,
            u.name AS user_name,
            s.customer_id,
            c.name AS customer_name,
            s.subtotal,
            s.tax,
            s.discount,
            s.total_amount,
            s.payment_method,
            s.status,
            s.created_at
        FROM sales s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c 
            ON s.customer_id = c.id
            AND c.company_id = s.company_id
        WHERE s.id = ?
        AND s.company_id = ?
        LIMIT 1
    `, [saleId, company_id]);

    return rows.length ? rows[0] : null;
};

// ========================================
// GET SALE PRODUCTS BY SALE ID
// ========================================
const getSaleProductsBySaleId = async (saleId, company_id) => {

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
        JOIN sales s ON sp.sale_id = s.id
        WHERE sp.sale_id = ?
        AND s.company_id = ?
    `, [saleId, company_id]);

    return rows;
};

// ========================================
// GET ALL SALES
// ========================================
const getAllSales = async ({
    company_id,
    page,
    limit,
    start_date,
    end_date,
    payment_method,
    status
}) => {

    const offset = (page - 1) * limit;

    let whereClause = "WHERE s.company_id = ?";
    let values = [company_id];

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
            u.name AS user_name,
            c.name AS customer_name,
        FROM sales s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c ON s.customer_id = c.id
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
const getSaleForUpdate = async (connection, saleId, company_id) => {

    const [rows] = await connection.query(`
        SELECT *
        FROM sales
        WHERE id = ?
        AND company_id = ?
        FOR UPDATE
    `, [saleId, company_id]);

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
const getDailySummary = async (company_id) => {

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
        AND company_id = ?
    `, [company_id]);

    return rows[0];
};

// ========================================
// GET PRODUCT FOR UPDATE (LOCK STOCK)
// ========================================
const getProductForUpdate = async (
    connection,
    productId,
    company_id
) => {

    const [rows] = await connection.query(
        `SELECT * FROM products 
         WHERE id = ?
         AND company_id = ?
         FOR UPDATE`,
        [productId, company_id]
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

const getSalesByCustomer = async (
    company_id,
    customer_id
) => {

    const [sales] = await pool.query(`
        SELECT 
            id,
            subtotal,
            tax,
            discount,
            total_amount,
            payment_method,
            status,
            created_at
        FROM sales
        WHERE company_id = ?
        AND customer_id = ?
        AND status = 'completed'
        ORDER BY created_at DESC
    `, [company_id, customer_id]);

    return sales;
};

const getCustomerSalesSummary = async (
    company_id,
    customer_id
) => {

    const [rows] = await pool.query(`
        SELECT 
            COUNT(*) AS totalPurchases,
            SUM(total_amount) AS totalSpent,
            MAX(created_at) AS lastPurchase
        FROM sales
        WHERE company_id = ?
        AND customer_id = ?
        AND status = 'completed'
    `, [company_id, customer_id]);

    return rows[0];
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
    getDailySummary,
    getCustomerById,
    getSalesByCustomer,
    getCustomerSalesSummary
};