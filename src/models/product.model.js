const pool = require("../config/database");

// Columnas permitidas para ordenar (evita SQL injection)
const ALLOWED_SORT_FIELDS = [
    "created_at",
    "name",
    "sale_price",
    "stock",
    "category"
];

const ALLOWED_ORDER = ["ASC", "DESC"];


// ========================================
// BUILD WHERE CLAUSE (REUTILIZABLE)
// ========================================
const buildFilters = ({ search, category, low_stock }) => {

    let whereClause = "WHERE status = 'active'";
    let values = [];

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
        search,
        category,
        low_stock
    });

    // Sanitizar ordenamiento
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
const getProductById = async (id) => {

    const [rows] = await pool.query(`
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
        WHERE id = ?
    `, [id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// CHECK SKU EXISTS
// ========================================
const findBySku = async (connection, sku) => {

    const [rows] = await connection.query(
        `SELECT id FROM products WHERE sku = ?`,
        [sku]
    );

    return rows.length > 0;
};


// ========================================
// CREATE PRODUCT (TRANSACTION)
// ========================================
const createProduct = async (connection, productData) => {

    const {
        name,
        description,
        sku,
        category,
        purchase_price,
        sale_price,
        stock,
        min_stock,
        created_by
    } = productData;

    const [result] = await connection.query(`
        INSERT INTO products (
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
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
// CREATE INITIAL MOVEMENT
// ========================================
const createInitialMovement = async (
    connection,
    productId,
    stock,
    userId
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
        VALUES (?, 'purchase', ?, 0, ?, ?, 'Stock inicial al crear producto')
    `, [
        productId,
        stock,
        stock,
        userId
    ]);
};


// ========================================
// UPDATE PRODUCT
// ========================================
const updateProduct = async (id, data) => {

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
        WHERE id = ?
    `, [
        name,
        description,
        sku,
        category,
        purchase_price,
        sale_price,
        min_stock,
        id
    ]);

    return result.affectedRows;
};


// ========================================
// SOFT DELETE PRODUCT
// ========================================
const softDeleteProduct = async (id) => {

    const [result] = await pool.query(`
        UPDATE products
        SET status = 'inactive'
        WHERE id = ?
    `, [id]);

    return result.affectedRows;
};

// ========================================
// FIND SKU BY OTHER PRODUCT
// ========================================
const findSkuInOtherProduct = async (sku, productId) => {

    const [rows] = await pool.query(
        `SELECT id FROM products WHERE sku = ? AND id != ?`,
        [sku, productId]
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