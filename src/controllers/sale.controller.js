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


// ========================================
// GET SALE BY ID
// ========================================
exports.getSaleById = async (req, res) => {
    try {

        const { id } = req.params;

        const sale = await Sale.getSaleHeaderById(id);

        if (!sale) {
            return res.status(404).json({
                message: "Venta no encontrada"
            });
        }

        const products = await Sale.getSaleProductsBySaleId(id);

        res.status(200).json({
            sale,
            products
        });

    } catch (error) {
        console.error("Error getSaleById:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


// ========================================
// GET ALL SALES
// ========================================
exports.getAllSales = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            start_date,
            end_date,
            payment_method,
            status
        } = req.query;

        const result = await Sale.getAllSales({
            page: Number(page),
            limit: Number(limit),
            start_date,
            end_date,
            payment_method,
            status
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
        console.error("Error getAllSales:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};



// ========================================
// DAILY SUMMARY
// ========================================
exports.getDailySummary = async (req, res) => {
    try {

        const summary = await Sale.getDailySummary();

        res.status(200).json(summary);

    } catch (error) {
        console.error("Error getDailySummary:", error);
        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};



// ========================================
// CANCEL SALE
// ========================================
exports.cancelSale = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;

        await connection.beginTransaction();

        const sale = await Sale.getSaleForUpdate(connection, id);

        if (!sale) {
            throw new Error("Venta no encontrada");
        }

        if (sale.status === "cancelled") {
            throw new Error("La venta ya está cancelada");
        }

        const saleProducts = await Sale.getSaleProductsBySaleId(id);

        for (const item of saleProducts) {

            const product = await Sale.getProductForUpdate(
                connection,
                item.product_id
            );

            const previousStock = product.stock;
            const newStock = previousStock + item.quantity;

            await Sale.updateProductStock(
                connection,
                product.id,
                newStock
            );

            await Sale.insertInventoryMovement(connection, {
                product_id: product.id,
                quantity: item.quantity,
                previous_stock: previousStock,
                new_stock: newStock,
                reference_id: id,
                user_id: req.user.id
            });
        }

        await Sale.markSaleAsCancelled(connection, id);

        await connection.commit();
        connection.release();

        res.status(200).json({
            message: "Venta cancelada correctamente"
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error cancelSale:", error);

        res.status(400).json({
            message: error.message || "Error al cancelar venta"
        });
    }
};