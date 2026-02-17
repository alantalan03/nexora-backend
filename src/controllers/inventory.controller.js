const pool = require("../config/database");
const Inventory = require("../models/inventory.model");
const notificationController = require("./notification.controller");

// ========================================
// MANUAL ADJUSTMENT
// ========================================
exports.adjustInventory = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { product_id, quantity, notes } = req.body;

        if (!product_id || quantity === undefined) {
            return res.status(400).json({
                message: "Producto y cantidad son requeridos"
            });
        }

        await connection.beginTransaction();

        const product = await Inventory.getProductForUpdate(connection, product_id);

        if (!product) {
            throw new Error("Producto no encontrado");
        }

        const previousStock = product.stock;
        const newStock = previousStock + quantity;

        if (newStock < 0) {
            throw new Error("El stock no puede quedar negativo");
        }

        await Inventory.updateProductStock(connection, product_id, newStock);

        await Inventory.createMovement(connection, {
            product_id,
            movement_type: "adjustment",
            quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            user_id: req.user.id,
            notes
        });

        // 🔔 Notificación stock bajo
        if (newStock <= product.min_stock) {
            await notificationController.createNotification({
                type: "stock",
                title: "Stock bajo",
                message: `El producto "${product.name}" tiene stock bajo (${newStock})`,
                reference_id: product_id
            });
        }

        await connection.commit();
        connection.release();

        res.status(200).json({
            message: "Inventario ajustado correctamente",
            previousStock,
            newStock
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error adjustInventory:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// ========================================
// REGISTER PURCHASE
// ========================================
exports.registerPurchase = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { product_id, quantity, notes } = req.body;

        if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({
                message: "Cantidad inválida"
            });
        }

        await connection.beginTransaction();

        const product = await Inventory.getProductForUpdate(connection, product_id);

        if (!product) {
            throw new Error("Producto no encontrado");
        }

        const previousStock = product.stock;
        const newStock = previousStock + quantity;

        await Inventory.updateProductStock(connection, product_id, newStock);

        await Inventory.createMovement(connection, {
            product_id,
            movement_type: "purchase",
            quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            user_id: req.user.id,
            notes
        });

        await connection.commit();
        connection.release();

        res.status(200).json({
            message: "Compra registrada correctamente",
            newStock
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error registerPurchase:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// ========================================
// GET MOVEMENTS BY PRODUCT
// ========================================
exports.getProductMovements = async (req, res) => {
    try {

        const { product_id } = req.params;

        const movements = await Inventory.getMovementsByProduct(product_id);

        res.status(200).json(movements);

    } catch (error) {
        console.error("Error getProductMovements:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};