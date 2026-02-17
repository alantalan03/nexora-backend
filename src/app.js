const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const communicationRoutes = require("./routes/communication.routes");
const notificationRoutes = require("./routes/notification.routes");


app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/sales', require('./routes/sale.routes'));
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
app.use("/api/communication", communicationRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;