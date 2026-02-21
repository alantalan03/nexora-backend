const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/company.model");

// ========================================
// CREATE COMPANY (SUPER ADMIN)
// ========================================
exports.createCompany = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { name, email, phone, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Nombre y email son obligatorios"
            });
        }

        await connection.beginTransaction();

        const exists = await Company.findByEmail(connection, email);

        if (exists) {
            await connection.rollback();
            return res.status(400).json({
                message: "Ya existe una empresa con ese email"
            });
        }

        const companyId = await Company.createCompany(connection, {
            name,
            email,
            phone: phone || null,
            address: address || null
        });

        await connection.commit();

        return res.status(201).json({
            message: "Empresa creada correctamente",
            companyId
        });

    } catch (error) {

        await connection.rollback();
        console.error("Error createCompany:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });

    } finally {
        connection.release();
    }
};



// ========================================
// REGISTER COMPANY (FLUJO SAAS COMPLETO)
// ========================================
exports.registerCompany = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            company_name,
            company_email,
            phone,
            address,
            admin_name,
            admin_email,
            admin_password
        } = req.body;

        if (!company_name || !company_email || !admin_name || !admin_email || !admin_password) {
            return res.status(400).json({
                message: "Datos incompletos"
            });
        }

        await connection.beginTransaction();

        // 🔍 Validar empresa duplicada
        const companyExists = await Company.findByEmail(connection, company_email);

        if (companyExists) {
            await connection.rollback();
            return res.status(400).json({
                message: "Ya existe una empresa con ese email"
            });
        }

        // 1️⃣ Crear empresa
        const companyId = await Company.createCompany(connection, {
            name: company_name,
            email: company_email,
            phone: phone || null,
            address: address || null
        });

        // 2️⃣ Crear usuario admin
        const hashedPassword = await bcrypt.hash(admin_password, 10);

        const [userResult] = await connection.query(`
            INSERT INTO users (
                company_id,
                name,
                email,
                password,
                role_id,
                status,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, 1, 'active', NOW(), NOW())
        `, [
            companyId,
            admin_name,
            admin_email,
            hashedPassword
        ]);

        const userId = userResult.insertId;

        // 3️⃣ Crear suscripción trial (plan_id = 1)
        await connection.query(`
            INSERT INTO subscriptions (
                company_id,
                plan_id,
                status,
                start_date,
                end_date,
                created_at
            )
            VALUES (?, 1, 'trial', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())
        `, [companyId]);

        await connection.commit();

        // 4️⃣ Generar JWT
        const token = jwt.sign(
            {
                id: userId,
                name: admin_name,
                email: admin_email,
                role: "admin",
                company_id: companyId
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.status(201).json({
            message: "Empresa registrada correctamente",
            token
        });

    } catch (error) {

        await connection.rollback();
        console.error("Error registerCompany:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });

    } finally {
        connection.release();
    }
};



// ========================================
// GET ALL COMPANIES (SUPER ADMIN)
// ========================================
exports.getAllCompanies = async (req, res) => {
    try {

        const companies = await Company.getAllCompanies();

        return res.status(200).json(companies);

    } catch (error) {
        console.error("Error getAllCompanies:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};



// ========================================
// GET COMPANY BY ID
// ========================================
exports.getCompanyById = async (req, res) => {
    try {

        const { id } = req.params;

        const company = await Company.getCompanyById(id);

        if (!company) {
            return res.status(404).json({
                message: "Empresa no encontrada"
            });
        }

        return res.status(200).json(company);

    } catch (error) {
        console.error("Error getCompanyById:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};



// ========================================
// UPDATE COMPANY
// ========================================
exports.updateCompany = async (req, res) => {
    try {

        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Nombre y email son obligatorios"
            });
        }

        const affectedRows = await Company.updateCompany(id, {
            name,
            email,
            phone,
            address
        });

        if (!affectedRows) {
            return res.status(404).json({
                message: "Empresa no encontrada"
            });
        }

        return res.status(200).json({
            message: "Empresa actualizada correctamente"
        });

    } catch (error) {
        console.error("Error updateCompany:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};



// ========================================
// ACTIVATE / DEACTIVATE COMPANY
// ========================================
exports.toggleCompanyStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "Estado inválido"
            });
        }

        const affectedRows = await Company.updateCompanyStatus(id, status);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Empresa no encontrada"
            });
        }

        return res.status(200).json({
            message: "Estado actualizado correctamente"
        });

    } catch (error) {
        console.error("Error toggleCompanyStatus:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};



// ========================================
// COMPANY STATS (OPTIMIZADO)
// ========================================
exports.getCompanyStats = async (req, res) => {
    try {

        const { id } = req.params;

        const [stats] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE company_id = ?) as users,
                (SELECT COUNT(*) FROM products WHERE company_id = ?) as products,
                (SELECT COUNT(*) FROM service_orders WHERE company_id = ?) as service_orders
        `, [id, id, id]);

        return res.status(200).json(stats[0]);

    } catch (error) {
        console.error("Error getCompanyStats:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};



// ========================================
// CREATE USER INSIDE COMPANY (SUPER ADMIN)
// ========================================
exports.createCompanyUser = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const { companyId } = req.params;
        const { name, email, password, phone, role_id } = req.body;

        if (!name || !email || !password || !role_id) {
            return res.status(400).json({
                message: "Todos los campos obligatorios son requeridos"
            });
        }

        await connection.beginTransaction();

        const company = await Company.getCompanyById(companyId);

        if (!company) {
            await connection.rollback();
            return res.status(404).json({
                message: "Empresa no encontrada"
            });
        }

        if (company.status !== "active") {
            await connection.rollback();
            return res.status(400).json({
                message: "La empresa está inactiva"
            });
        }

        const [existing] = await connection.query(
            `SELECT id FROM users WHERE email = ? AND company_id = ?`,
            [email, companyId]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: "El correo ya está registrado en esta empresa"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await connection.query(`
            INSERT INTO users (
                company_id,
                name,
                email,
                password,
                phone,
                role_id,
                status,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
        `, [
            companyId,
            name,
            email,
            hashedPassword,
            phone || null,
            role_id
        ]);

        await connection.commit();

        return res.status(201).json({
            message: "Usuario creado correctamente en la empresa",
            userId: result.insertId
        });

    } catch (error) {

        await connection.rollback();
        console.error("Error createCompanyUser:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });

    } finally {
        connection.release();
    }
};