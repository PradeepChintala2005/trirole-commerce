const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function setupDatabase() {
    const dbPath = path.join(__dirname, '..', 'ecommerce_v3.db'); // Create new DB

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Enforce Foreign Keys
    await db.exec('PRAGMA foreign_keys = ON;');

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK (role IN ('admin', 'staff', 'customer')) NOT NULL DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            category_id INTEGER,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            status TEXT CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS stock_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            change_amount INTEGER NOT NULL,
            action_type TEXT CHECK (action_type IN ('add', 'remove', 'update')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            status TEXT CHECK (status IN ('pending', 'shipped', 'delivered')) NOT NULL DEFAULT 'pending',
            total REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price_at_time REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    `);

    // Seed default categories
    const catCount = await db.get("SELECT COUNT(*) as count FROM categories");
    if (catCount.count === 0) {
        await db.run("INSERT INTO categories (name) VALUES ('Herbs'), ('Oils'), ('Skincare'), ('Immunity Boosters'), ('Hair Care'), ('Digestive Health'), ('Wellness Supplements'), ('Natural Remedies')");
        console.log('Categories seeded.');
    }

    // Default Admin User
    const adminCount = await db.get("SELECT COUNT(*) as count FROM users WHERE username = 'admin'");
    if (adminCount.count === 0) {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('password', 10);
        await db.run("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')", ['admin', hash]);
        console.log('Created default admin user (admin / password).');
    }

    return db;
}

module.exports = setupDatabase;
