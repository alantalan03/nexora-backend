const pool = require("../config/database");

// ========================================
// GET SUPPLIER (VALIDATE COMPANY)
// ========================================
const getSupplier = async (connection, supplier_id, company_id) => {

    const [rows] = await connection.query(`
        SELECT id, name
        FROM suppliers
        WHERE id = ?
        AND company_id = ?
        AND status = 'active'
        LIMIT 1
    `, [supplier_id, company_id]);

    return rows.length ? rows[0] : null;
};

// ========================================
// CREATE PURCHASE HEADER
// ========================================
const createPurchaseHeader = async (connection, {
    company_id,
    supplier_id,
    user_id,
    invoice_number = null,
    tax = 0
}) => {

    const [result] = await connection.query(`
        INSERT INTO purchases (
            company_id,
            supplier_id,
            user_id,
            invoice_number,
            tax
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        company_id,
        supplier_id,
        user_id,
        invoice_number,
        tax
    ]);

    return result.insertId;
};

// ========================================
// GET PRODUCT FOR UPDATE (LOCK STOCK)
// ========================================
const getProductForUpdate = async (connection, product_id, company_id) => {

    const [rows] = await connection.query(`
        SELECT id, name, stock
        FROM products
        WHERE id = ?
        AND company_id = ?
        FOR UPDATE
    `, [product_id, company_id]);

    return rows.length ? rows[0] : null;
};

// ========================================
// INSERT PURCHASE PRODUCT DETAIL
// ========================================
const insertPurchaseProduct = async (connection, {
    purchase_id,
    product_id,
    quantity,
    unit_cost,
    subtotal
}) => {

    await connection.query(`
        INSERT INTO purchase_products (
            purchase_id,
            product_id,
            quantity,
            unit_cost,
            subtotal
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        purchase_id,
        product_id,
        quantity,
        unit_cost,
        subtotal
    ]);
};

// ========================================
// UPDATE PRODUCT STOCK
// ========================================
const updateProductStock = async (
    connection,
    product_id,
    company_id,
    newStock
) => {

    await connection.query(`
        UPDATE products
        SET stock = ?
        WHERE id = ?
        AND company_id = ?
    `, [newStock, product_id, company_id]);
};

// ========================================
// INSERT INVENTORY MOVEMENT (PURCHASE)
// ========================================
const insertInventoryMovement = async (
    connection,
    {
        company_id,
        product_id,
        quantity,
        previous_stock,
        new_stock,
        user_id
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
        VALUES (?, ?, 'purchase', ?, ?, ?, ?, 'Compra registrada')
    `, [
        company_id,
        product_id,
        quantity,
        previous_stock,
        new_stock,
        user_id
    ]);
};

// ========================================
// UPDATE PURCHASE TOTALS
// ========================================
const updateTotals = async (
    connection,
    purchase_id,
    subtotal,
    total_amount
) => {

    await connection.query(`
        UPDATE purchases
        SET subtotal = ?,
            total_amount = ?
        WHERE id = ?
    `, [
        subtotal,
        total_amount,
        purchase_id
    ]);
};

// ========================================
// GET PURCHASE BY ID (WITH DETAILS)
// ========================================
const getPurchaseById = async (purchase_id, company_id) => {

    const [header] = await pool.query(`
        SELECT 
            p.*,
            s.name AS supplier_name,
            u.name AS user_name
        FROM purchases p
        JOIN suppliers s ON s.id = p.supplier_id
        JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
        AND p.company_id = ?
        LIMIT 1
    `, [purchase_id, company_id]);

    if (!header.length) return null;

    const [details] = await pool.query(`
        SELECT 
            pp.product_id,
            pr.name AS product_name,
            pp.quantity,
            pp.unit_cost,
            pp.subtotal
        FROM purchase_products pp
        JOIN products pr ON pr.id = pp.product_id
        WHERE pp.purchase_id = ?
    `, [purchase_id]);

    return {
        purchase: header[0],
        products: details
    };
};

// ========================================
// GET ALL PURCHASES (PAGINATED)
// ========================================
const getAllPurchases = async ({
    company_id,
    page = 1,
    limit = 10
}) => {

    const offset = (page - 1) * limit;

    const [data] = await pool.query(`
        SELECT 
            p.id,
            p.invoice_number,
            p.total_amount,
            p.tax,
            p.status,
            p.created_at,
            s.name AS supplier_name,
            u.name AS user_name
        FROM purchases p
        JOIN suppliers s ON s.id = p.supplier_id
        JOIN users u ON u.id = p.user_id
        WHERE p.company_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `, [company_id, limit, offset]);

    const [count] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM purchases
        WHERE company_id = ?
    `, [company_id]);

    return {
        data,
        total: count[0].total
    };
};

module.exports = {
    getSupplier,
    createPurchaseHeader,
    getProductForUpdate,
    insertPurchaseProduct,
    updateProductStock,
    insertInventoryMovement,
    updateTotals,
    getPurchaseById,
    getAllPurchases
};