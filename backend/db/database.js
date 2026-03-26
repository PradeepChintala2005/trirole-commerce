const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function setupDatabase() {
    const dbPath = path.join(__dirname, 'ecommerce.db');

    // Open connection
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Initialize Schema
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            status TEXT NOT NULL
        );
    `);

    // Seed mock products if empty
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    if (productCount.count === 0) {
        await db.run('INSERT INTO products (name, category, price, stock, status) VALUES (?, ?, ?, ?, ?)', ['MacBook Pro', 'Electronics', 2499.00, 45, 'In']);
        await db.run('INSERT INTO products (name, category, price, stock, status) VALUES (?, ?, ?, ?, ?)', ['Desk Chair', 'Furniture', 349.00, 0, 'Out']);
        await db.run('INSERT INTO products (name, category, price, stock, status) VALUES (?, ?, ?, ?, ?)', ['Wireless Mouse', 'Electronics', 29.99, 120, 'In']);
        await db.run('INSERT INTO products (name, category, price, stock, status) VALUES (?, ?, ?, ?, ?)', ['Coffee Mug', 'Office', 12.50, 200, 'In']);
        console.log('Database seeded with initial products.');
    }

    return db;
}

module.exports = setupDatabase;
