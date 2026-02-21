const pool = require("../config/database");
const Purchase = require("../models/purchase.model");

// ========================================
// CREATE PURCHASE
// ========================================
exports.createPurchase = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const company_id = req.user.company_id;
        const user_id = req.user.id;

        const {
            supplier_id,
            products,
            tax = 0,
            invoice_number = null
        } = req.body;

        if (!supplier_id || !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: "Proveedor y productos requeridos"
            });
        }

        if (tax < 0) {
            return res.status(400).json({
                message: "Impuesto inválido"
            });
        }

        await connection.beginTransaction();

        // Validar proveedor
        const supplier = await Purchase.getSupplier(
            connection,
            supplier_id,
            company_id
        );

        if (!supplier) {
            throw new Error("Proveedor no encontrado o inactivo");
        }

        let subtotal = 0;

        // Crear cabecera
        const purchaseId = await Purchase.createPurchaseHeader(
            connection,
            {
                company_id,
                supplier_id,
                user_id,
                invoice_number,
                tax
            }
        );

        // Procesar productos
        for (const item of products) {

            if (!item.product_id || !item.quantity || !item.unit_cost) {
                throw new Error("Datos de producto inválidos");
            }

            if (item.quantity <= 0 || item.unit_cost <= 0) {
                throw new Error("Cantidad y costo deben ser mayores a 0");
            }

            const product = await Purchase.getProductForUpdate(
                connection,
                item.product_id,
                company_id
            );

            if (!product) {
                throw new Error("Producto no encontrado");
            }

            const previousStock = product.stock;
            const newStock = previousStock + item.quantity;

            const lineSubtotal = item.quantity * item.unit_cost;
            subtotal += lineSubtotal;

            await Purchase.insertPurchaseProduct(connection, {
                purchase_id: purchaseId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                subtotal: lineSubtotal
            });

            await Purchase.updateProductStock(
                connection,
                item.product_id,
                company_id,
                newStock
            );

            await Purchase.insertInventoryMovement(connection, {
                company_id,
                product_id: item.product_id,
                quantity: item.quantity,
                previous_stock: previousStock,
                new_stock: newStock,
                user_id
            });
        }

        const totalAmount = subtotal + tax;

        await Purchase.updateTotals(
            connection,
            purchaseId,
            subtotal,
            totalAmount
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            message: "Compra registrada correctamente",
            purchaseId,
            subtotal,
            tax,
            totalAmount
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error createPurchase:", error);

        res.status(500).json({
            message: error.message || "Error al registrar compra"
        });
    }
};

// ========================================
// GET PURCHASE BY ID
// ========================================
exports.getPurchaseById = async (req, res) => {

    try {

        const { id } = req.params;
        const company_id = req.user.company_id;

        const purchase = await Purchase.getPurchaseById(id, company_id);

        if (!purchase) {
            return res.status(404).json({
                message: "Compra no encontrada"
            });
        }

        res.status(200).json(purchase);

    } catch (error) {

        console.error("Error getPurchaseById:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// ========================================
// GET ALL PURCHASES
// ========================================
exports.getAllPurchases = async (req, res) => {

    try {

        const company_id = req.user.company_id;

        const {
            page = 1,
            limit = 10
        } = req.query;

        const result = await Purchase.getAllPurchases({
            company_id,
            page: Number(page),
            limit: Number(limit)
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

        console.error("Error getAllPurchases:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// ========================================
// CANCEL PURCHASE (REVERSE STOCK)
// ========================================
exports.cancelPurchase = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { id } = req.params;
        const company_id = req.user.company_id;

        await connection.beginTransaction();

        const purchase = await Purchase.getPurchaseById(id, company_id);

        if (!purchase) {
            throw new Error("Compra no encontrada");
        }

        if (purchase.purchase.status === "cancelled") {
            throw new Error("La compra ya está cancelada");
        }

        // Revertir stock
        for (const item of purchase.products) {

            const product = await Purchase.getProductForUpdate(
                connection,
                item.product_id,
                company_id
            );

            const previousStock = product.stock;
            const newStock = previousStock - item.quantity;

            if (newStock < 0) {
                throw new Error("No se puede cancelar, stock insuficiente");
            }

            await Purchase.updateProductStock(
                connection,
                item.product_id,
                company_id,
                newStock
            );

            await Purchase.insertInventoryMovement(connection, {
                company_id,
                product_id: item.product_id,
                quantity: -item.quantity,
                previous_stock: previousStock,
                new_stock: newStock,
                user_id: req.user.id
            });
        }

        await connection.query(`
            UPDATE purchases
            SET status = 'cancelled'
            WHERE id = ?
            AND company_id = ?
        `, [id, company_id]);

        await connection.commit();
        connection.release();

        res.status(200).json({
            message: "Compra cancelada correctamente"
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Error cancelPurchase:", error);

        res.status(400).json({
            message: error.message || "Error al cancelar compra"
        });
    }
};