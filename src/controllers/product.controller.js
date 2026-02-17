const pool = require("../config/database");
const Product = require("../models/product.model");

// ========================================
// GET ALL PRODUCTS
// ========================================
exports.getAllProducts = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            search = "",
            category,
            low_stock,
            sort = "created_at",
            order = "DESC"
        } = req.query;

        const result = await Product.getAllProducts({
            page: Number(page),
            limit: Number(limit),
            search,
            category,
            low_stock,
            sort,
            order
        });

        res.status(200).json({
            data: result.data,
            pagination: {
                total: result.total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(result.total / limit)
            }
        });

    } catch (error) {
        console.error("Error getAllProducts:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// GET PRODUCT BY ID
// ========================================
exports.getProductById = async (req, res) => {
    try {

        const { id } = req.params;

        const product = await Product.getProductById(id);

        if (!product) {
            return res.status(404).json({
                message: "Producto no encontrado"
            });
        }

        res.status(200).json(product);

    } catch (error) {
        console.error("Error getProductById:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// CREATE PRODUCT
// ========================================
exports.createProduct = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            name,
            description,
            sku,
            category,
            purchase_price = 0,
            sale_price,
            stock = 0,
            min_stock = 0
        } = req.body;

        if (!name || !sale_price) {
            return res.status(400).json({
                message: "Nombre y precio de venta son obligatorios"
            });
        }

        if (sale_price <= 0) {
            return res.status(400).json({
                message: "El precio de venta debe ser mayor a 0"
            });
        }

        await connection.beginTransaction();

        // Validar SKU único
        if (sku) {
            const skuExists = await Product.findBySku(connection, sku);

            if (skuExists) {
                await connection.rollback();
                connection.release();

                return res.status(400).json({
                    message: "El SKU ya existe"
                });
            }
        }

        // Crear producto
        const productId = await Product.createProduct(connection, {
            name,
            description: description || null,
            sku: sku || null,
            category: category || null,
            purchase_price,
            sale_price,
            stock,
            min_stock,
            created_by: req.user.id
        });

        // Movimiento inicial
        if (stock > 0) {
            await Product.createInitialMovement(
                connection,
                productId,
                stock,
                req.user.id
            );
        }

        await connection.commit();
        connection.release();

        res.status(201).json({
            message: "Producto creado correctamente",
            productId
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error createProduct:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// UPDATE PRODUCT
// ========================================
exports.updateProduct = async (req, res) => {
    try {

        const { id } = req.params;
        const {
            name,
            description,
            sku,
            category,
            purchase_price = 0,
            sale_price,
            min_stock = 0
        } = req.body;

        if (!name || !sale_price) {
            return res.status(400).json({
                message: "Nombre y precio de venta son obligatorios"
            });
        }

        const affectedRows = await Product.updateProduct(id, {
            name,
            description: description || null,
            sku: sku || null,
            category: category || null,
            purchase_price,
            sale_price,
            min_stock
        });

        if (!affectedRows) {
            return res.status(404).json({
                message: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto actualizado correctamente"
        });

    } catch (error) {
        console.error("Error updateProduct:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// SOFT DELETE PRODUCT
// ========================================
exports.deleteProduct = async (req, res) => {
    try {

        const { id } = req.params;

        const affectedRows = await Product.softDeleteProduct(id);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto desactivado correctamente"
        });

    } catch (error) {
        console.error("Error deleteProduct:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};