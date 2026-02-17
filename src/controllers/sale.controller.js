const pool = require("../config/database");
const Sale = require("../models/sale.model");
const notificationController = require("./notification.controller");

// ========================================
// CREATE SALE
// ========================================
exports.createSale = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            products,
            payment_method,
            discount = 0,
            tax = 0
        } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: "La venta debe incluir productos"
            });
        }

        if (!payment_method) {
            return res.status(400).json({
                message: "Método de pago requerido"
            });
        }

        if (discount < 0 || tax < 0) {
            return res.status(400).json({
                message: "Valores inválidos"
            });
        }

        await connection.beginTransaction();

        let subtotal = 0;
        let totalProfit = 0;

        // 1️⃣ Crear cabecera
        const saleId = await Sale.createSaleHeader(connection, {
            user_id: req.user.id,
            tax,
            discount,
            payment_method
        });

        // 2️⃣ Procesar productos
        for (const item of products) {

            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                throw new Error("Cantidad inválida en productos");
            }

            const product = await Sale.getProductForUpdate(
                connection,
                item.product_id
            );

            if (!product) {
                throw new Error("Producto no encontrado");
            }

            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}`);
            }

            const previousStock = product.stock;
            const newStock = previousStock - item.quantity;

            const lineSubtotal = product.sale_price * item.quantity;
            const lineProfit =
                (product.sale_price - product.purchase_price) *
                item.quantity;

            subtotal += lineSubtotal;
            totalProfit += lineProfit;

            await Sale.insertSaleProduct(connection, {
                sale_id: saleId,
                product_id: product.id,
                quantity: item.quantity,
                unit_price: product.sale_price,
                purchase_price: product.purchase_price,
                subtotal: lineSubtotal,
                profit: lineProfit
            });

            await Sale.updateProductStock(
                connection,
                product.id,
                newStock
            );

            await Sale.insertInventoryMovement(connection, {
                product_id: product.id,
                quantity: -item.quantity,
                previous_stock: previousStock,
                new_stock: newStock,
                reference_id: saleId,
                user_id: req.user.id
            });

            // 🔔 Notificación stock bajo
            if (newStock <= product.min_stock) {
                await notificationController.createNotification({
                    type: "stock",
                    title: "Stock bajo",
                    message: `El producto "${product.name}" tiene stock bajo (${newStock})`,
                    reference_id: product.id
                }, connection);
            }
        }

        const totalAmount = subtotal + tax - discount;

        if (totalAmount < 0) {
            throw new Error("El total no puede ser negativo");
        }

        await Sale.updateSaleTotals(
            connection,
            saleId,
            subtotal,
            totalAmount
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            message: "Venta creada correctamente",
            saleId,
            subtotal,
            tax,
            discount,
            totalAmount,
            totalProfit
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error createSale:", error);

        res.status(500).json({
            message: error.message || "Error al crear la venta"
        });
    }
};