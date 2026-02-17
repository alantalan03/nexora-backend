/**
 * Middleware para autorización por roles
 * Uso:
 * authorize("admin")
 * authorize("admin", "super_admin")
 * authorize("tecnico", "admin")
 */

exports.authorize = (...allowedRoles) => {
    return (req, res, next) => {

        try {
            // 1️⃣ Verificar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    message: "Usuario no autenticado"
                });
            }

            const userRole = req.user.role;

            // 2️⃣ Super admin siempre tiene acceso total
            if (userRole === "super_admin") {
                return next();
            }

            // 3️⃣ Verificar si el rol está permitido
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    message: "No tienes permisos para realizar esta acción"
                });
            }

            // 4️⃣ Todo correcto
            next();

        } catch (error) {
            console.error("Error en role middleware:", error);
            return res.status(500).json({
                message: "Error interno en validación de roles"
            });
        }
    };
};