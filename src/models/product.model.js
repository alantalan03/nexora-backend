const pool = require("../config/database");

const ALLOWED_SORT_FIELDS = [
    "created_at",
    "name",
    "sale_price",
    "stock",
    "category"
];

const ALLOWED_ORDER = ["ASC", "DESC"];


// ========================================
// BUILD FILTERS
// ========================================
const buildFilters = ({ company_id, search, category, low_stock }) => {

    let whereClause = "WHERE company_id = ? AND status = 'active'";
    let values = [company_id];

    if (search) {
        whereClause += " AND (name LIKE ? OR sku LIKE ?)";
        values.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        whereClause += " AND category = ?";
        values.push(category);
    }

    if (low_stock === "true") {
        whereClause += " AND stock <= min_stock";
    }

    return { whereClause, values };
};


// ========================================
// GET ALL PRODUCTS
// ========================================
const getAllProducts = async ({
    company_id,
    page,
    limit,
    search,
    category,
    low_stock,
    sort,
    order
}) => {

    const offset = (page - 1) * limit;

    const { whereClause, values } = buildFilters({
        company_id,
        search,
        category,
        low_stock
    });

    const safeSort = ALLOWED_SORT_FIELDS.includes(sort)
        ? sort
        : "created_at";

    const safeOrder = ALLOWED_ORDER.includes(order?.toUpperCase())
        ? order.toUpperCase()
        : "DESC";

    const [products] = await pool.query(`
        SELECT 
            id,
            name,
            description,
            sku,
            category,
            purchase_price,
            sale_price,
            stock,
            min_stock,
            status,
            created_at
        FROM products
        ${whereClause}
        ORDER BY ${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
    `, [...values, Number(limit), Number(offset)]);

    const [totalResult] = await pool.query(`
        SELECT COUNT(*) as total
        FROM products
        ${whereClause}
    `, values);

    return {
        data: products,
        total: totalResult[0].total
    };
};


// ========================================
// GET PRODUCT BY ID
// ========================================
const getProductById = async (id, company_id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM products
        WHERE id = ? AND company_id = ?
    `, [id, company_id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// CHECK SKU EXISTS (POR EMPRESA)
// ========================================
const findBySku = async (connection, sku, company_id) => {

    const [rows] = await connection.query(
        `SELECT id FROM products WHERE sku = ? AND company_id = ?`,
        [sku, company_id]
    );

    return rows.length > 0;
};


// ========================================
// CREATE PRODUCT
// ========================================
const createProduct = async (connection, data) => {

    const {
        company_id,
        name,
        description,
        sku,
        category,
        purchase_price,
        sale_price,
        stock,
        min_stock,
        created_by
    } = data;

    const [result] = await connection.query(`
        INSERT INTO products (
            company_id,
            name,
            description,
            sku,
            category,
            purchase_price,
            sale_price,
            stock,
            min_stock,
            created_by,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
        company_id,
        name,
        description,
        sku,
        category,
        purchase_price,
        sale_price,
        stock,
        min_stock,
        created_by
    ]);

    return result.insertId;
};


// ========================================
// INITIAL MOVEMENT
// ========================================
const createInitialMovement = async (
    connection,
    company_id,
    productId,
    stock,
    userId
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
        VALUES (?, ?, 'purchase', ?, 0, ?, ?, 'Stock inicial')
    `, [
        company_id,
        productId,
        stock,
        stock,
        userId
    ]);
};


// ========================================
// UPDATE PRODUCT
// ========================================
const updateProduct = async (id, company_id, data) => {

    const {
        name,
        description,
        sku,
        category,
        purchase_price,
        sale_price,
        min_stock
    } = data;

    const [result] = await pool.query(`
        UPDATE products
        SET name = ?,
            description = ?,
            sku = ?,
            category = ?,
            purchase_price = ?,
            sale_price = ?,
            min_stock = ?
        WHERE id = ? AND company_id = ?
    `, [
        name,
        description,
        sku,
        category,
        purchase_price,
        sale_price,
        min_stock,
        id,
        company_id
    ]);

    return result.affectedRows;
};


// ========================================
// DELETE PRODUCT
// ========================================
const softDeleteProduct = async (id, company_id) => {

    const [result] = await pool.query(`
        UPDATE products
        SET status = 'inactive'
        WHERE id = ? AND company_id = ?
    `, [id, company_id]);

    return result.affectedRows;
};


// ========================================
// FIND SKU IN OTHER PRODUCT
// ========================================
const findSkuInOtherProduct = async (sku, productId, company_id) => {

    const [rows] = await pool.query(
        `SELECT id FROM products 
         WHERE sku = ? AND id != ? AND company_id = ?`,
        [sku, productId, company_id]
    );

    return rows.length > 0;
};


module.exports = {
    getAllProducts,
    getProductById,
    findBySku,
    findSkuInOtherProduct,
    createProduct,
    createInitialMovement,
    updateProduct,
    softDeleteProduct
};