const jwt = require("jsonwebtoken");
const pool = require("../config/database");

exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Token no proporcionado" });
        }

        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({ message: "Formato de token inválido" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id || !decoded.company_id) {
            return res.status(401).json({ message: "Token inválido" });
        }

        const [rows] = await pool.query(`
            SELECT 
                u.status,
                c.status AS company_status,
                EXISTS(
                    SELECT 1 FROM subscriptions s 
                    WHERE s.company_id = c.id 
                    AND s.status IN ('active','trial')
                ) AS has_active_subscription
            FROM users u
            JOIN companies c ON u.company_id = c.id
            WHERE u.id = ?
              AND u.company_id = ?
            LIMIT 1
        `, [decoded.id, decoded.company_id]);

        if (!rows.length) {
            return res.status(401).json({ message: "Usuario no válido" });
        }

        const user = rows[0];

        if (user.status !== "active") {
            return res.status(403).json({ message: "Usuario desactivado" });
        }

        if (user.company_status !== "active") {
            return res.status(403).json({ message: "Empresa desactivada" });
        }

        if (!user.has_active_subscription) {
            return res.status(403).json({ message: "Suscripción vencida" });
        }

        req.user = decoded;

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expirado" });
        }

        return res.status(401).json({ message: "Token inválido" });
    }
};