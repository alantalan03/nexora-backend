const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

exports.login = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { email, password } = req.body;

        // Validación básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email y contraseña son requeridos"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET no configurado");
        }

        // Buscar usuario (email ahora es único global)
        const [rows] = await connection.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.password,
                u.status,
                u.company_id,
                r.name AS role,
                c.name AS company_name,
                c.status AS company_status,
                EXISTS(
                    SELECT 1 FROM subscriptions s 
                    WHERE s.company_id = c.id 
                    AND s.status IN ('active','trial')
                ) AS has_active_subscription
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN companies c ON u.company_id = c.id
            WHERE u.email = ?
            LIMIT 1
        `, [email]);

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas"
            });
        }

        const user = rows[0];

        // Validaciones de estado
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Usuario desactivado"
            });
        }

        if (user.company_status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Empresa desactivada"
            });
        }

        if (!user.has_active_subscription) {
            return res.status(403).json({
                success: false,
                message: "Suscripción inactiva o vencida"
            });
        }

        // Validar contraseña
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas"
            });
        }

        // Actualizar último login
        await connection.query(
            "UPDATE users SET last_login = NOW() WHERE id = ?",
            [user.id]
        );

        // Generar token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                company_id: user.company_id
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                company: {
                    id: user.company_id,
                    name: user.company_name
                }
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });

    } finally {
        connection.release();
    }
};