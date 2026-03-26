const express = require('express');
const cors = require('cors');
const setupDatabase = require('./config/db');
const { sendError } = require('./utils/response');

const app = express();

const PORT = process.env.PORT || 5000;


// Global Middleware
app.use(cors({ origin: '*' })); 
app.use(express.json()); // Parses incoming JSON
app.use(express.urlencoded({ extended: true }));

// Ensure DB is attached to req for all routes
app.use(async (req, res, next) => {
    if (!app.locals.db) {
        return sendError(res, 500, 'Database not initialized yet');
    }
    req.db = app.locals.db;
    next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root Welcome Route
app.get('/', (req, res) => {
    res.json({ success: true, message: 'E-Commerce V2 Enterprise Backend is running!' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    sendError(res, err.status || 500, err.message || 'Something went critically wrong!');
});

// Initialize DB and Start Server
setupDatabase().then(db => {
    app.locals.db = db;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
