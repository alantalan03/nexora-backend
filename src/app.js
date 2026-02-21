const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
}));

// JSON parser
app.use(express.json());

// Rate limit for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use('/api/v1/auth', authLimiter);

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/sales', require('./routes/sale.routes'));
app.use('/api/v1/customers', require('./routes/customer.routes'));
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
app.use('/api/v1/inventory', require('./routes/inventory.routes'));
app.use('/api/v1/suppliers', require('./routes/suppliers.routes'));
app.use('/api/v1/purchases', require('./routes/purchase.routes'));
app.use('/api/v1/service-orders', require('./routes/serviceOrder.routes'));


app.use('/api/v1/communication', require('./routes/communication.routes'));
app.use('/api/v1/companies', require('./routes/company.routes'));
app.use('/api/v1/usage', require('./routes/usage.routes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: "Ruta no encontrada"
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Error interno del servidor"
    });
});

module.exports = app;