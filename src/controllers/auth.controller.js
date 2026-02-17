const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// ========================================
// LOGIN
// ========================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1️⃣ Validación básica
        if (!email || !password) {
            return res.status(400).json({
                message: "Email y contraseña son requeridos"
            });
        }

        // 2️⃣ Verificar que exista JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET no está definido");
            return res.status(500).json({
                message: "Error de configuración del servidor"
            });
        }

        // 3️⃣ Buscar usuario + rol
        const [rows] = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.password,
                u.status,
                r.name AS role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?
            LIMIT 1
        `, [email]);

        // 🔒 Mensaje genérico (seguridad)
        if (rows.length === 0) {
            return res.status(401).json({
                message: "Credenciales inválidas"
            });
        }

        const user = rows[0];

        // 4️⃣ Validar estado
        if (user.status !== "active") {
            return res.status(403).json({
                message: "Usuario desactivado"
            });
        }

        // 5️⃣ Comparar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Credenciales inválidas"
            });
        }

        // 6️⃣ Actualizar last_login
        await pool.query(`
            UPDATE users 
            SET last_login = NOW() 
            WHERE id = ?
        `, [user.id]);

        // 7️⃣ Generar JWT
        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        // 8️⃣ Respuesta
        return res.status(200).json({
            message: "Login exitoso",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};