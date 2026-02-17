# 🚀 Nexora API

Backend oficial del sistema **Nexora**.

Nexora es una plataforma modular de gestión empresarial diseñada para empresas técnicas, de mantenimiento y venta con control de inventario y procesos operativos.

Este proyecto corresponde a la **API RESTful**, desarrollada en Node.js y MySQL.

---

# 🧱 Stack Tecnológico

- Node.js
- Express.js
- MySQL
- Sequelize (ORM)
- JWT (Autenticación)
- Bcrypt (Encriptación de contraseñas)
- dotenv (Variables de entorno)
- CORS
- PM2 (Producción)

---

# 🏗 Arquitectura del Proyecto


src/
│
├── config/
│ ├── database.js
│ └── environment.js
│
├── models/
│ ├── role.model.js
│ ├── user.model.js
│ ├── product.model.js
│ ├── sale.model.js
│ ├── saleProduct.model.js
│ └── inventoryMovement.model.js
│
├── controllers/
│ ├── auth.controller.js
│ ├── user.controller.js
│ ├── product.controller.js
│ ├── sale.controller.js
│ └── dashboard.controller.js
│
├── routes/
│ ├── auth.routes.js
│ ├── user.routes.js
│ ├── product.routes.js
│ ├── sale.routes.js
│ └── dashboard.routes.js
│
├── middlewares/
│ ├── auth.middleware.js
│ ├── role.middleware.js
│ └── error.middleware.js
│
├── services/
│ ├── inventory.service.js
│ └── sale.service.js
│
├── utils/
│ └── helpers.js
│
└── app.js

server.js


---

# 🔐 Autenticación

La API utiliza autenticación basada en:

- JWT (JSON Web Token)
- Middleware de validación de token
- Middleware de control de roles

Flujo:

1. Usuario inicia sesión
2. Se genera token firmado
3. El frontend envía token en cada request
4. Middleware valida acceso

---

# 📦 Funcionalidades Implementadas (MVP v1)

- 🔐 Login
- 👥 Gestión de usuarios
- 🎭 Roles y permisos
- 📦 Inventario (CRUD completo)
- 💰 Ventas rápidas
- 📊 Dashboard métricas básicas
- 🔄 Registro de movimientos de inventario

---

# 🗄 Base de Datos

Base de datos: `nexora_core`

Tablas principales:

- roles
- users
- products
- sales
- sale_products
- inventory_movements

Las relaciones están normalizadas y con claves foráneas activas.

---

# ⚙ Variables de Entorno

Crear archivo `.env` en la raíz:


PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASS=tu_password
DB_NAME=nexora_core

JWT_SECRET=super_secret_key
JWT_EXPIRES=8h


⚠ Nunca subir `.env` a GitHub.

---

# 🚀 Instalación

## 1️⃣ Clonar repositorio

```bash
git clone https://github.com/tuusuario/nexora-api.git
cd nexora-api
2️⃣ Instalar dependencias
npm install
3️⃣ Ejecutar servidor en desarrollo
npm run dev

Servidor disponible en:

http://localhost:3000
🔄 Scripts Disponibles

En package.json:

"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
🛡 Seguridad Implementada

Contraseñas encriptadas con bcrypt

Tokens firmados con JWT

Middleware de autorización por rol

Validación de datos

CORS configurado

Manejo centralizado de errores

📊 Flujo de Venta (Ejemplo)

Se crea registro en sales

Se insertan productos en sale_products

Se descuenta stock en products

Se registra movimiento en inventory_movements

Todo dentro de transacción segura.

📈 Roadmap Futuro

📋 Órdenes de servicio

🛠 Técnicos

📲 Portal cliente con token

📢 Marketing

📊 Reportes avanzados

🏢 Multi-sucursal

🌎 Multi-tenant

🧪 Testing (Futuro)

Pruebas unitarias con Jest

Pruebas de integración

Validaciones automáticas

🏢 Producción

Recomendado:

PM2 para mantener proceso activo

Nginx como reverse proxy

SSL con Let's Encrypt

Base de datos administrada

👨‍💻 Autor

Desarrollado por Nexora.

Plataforma modular de gestión empresarial.