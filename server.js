const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // Serves your frontend assets smoothly

const db = new sqlite3.Database('./boutique.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the Aesthetic Boutique database.');
});

// Create tables with a deeper structural architecture
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        description TEXT,
        image_url TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        quantity INTEGER,
        customer_name TEXT DEFAULT 'Guest Client',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Insert your unique, handmade catalog data
    db.get("SELECT COUNT(*) as count FROM products", [], (err, row) => {
        if (row.count === 0) {
            const stmt = db.prepare(`INSERT INTO products (name, category, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?)`);
            
            // 1. Handmade Brochures / Stationery
            stmt.run('Vintage Floral Journal Brochure', 'Stationery', 350.00, 12, 'Hand-pressed petals on recycled parchment paper.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=500');
            stmt.run('Aesthetic Pastel Lookbook', 'Stationery', 420.00, 8, 'Custom minimalist design layout for cataloging.', 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=500');
            
            // 2. Apparel / Tops
            stmt.run('Cozy Cream Ribbed Knit Top', 'Tops', 1250.00, 5, 'Soft, breathable cotton-blend premium knitwear.', 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=500');
            stmt.run('Lace-Trim Linen Blouse', 'Tops', 1490.00, 6, 'Vintage-inspired puff sleeves in soft off-white linen.', 'https://images.unsplash.com/photo-1548624149-f7b316026b73?q=80&w=500');
            
            // 3. Elegant Accessories
            stmt.run('Pearl Satin Hair Bow', 'Accessories', 290.00, 15, 'Elegant oversized bow with delicate faux-pearl accents.', 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?q=80&w=500');
            
            stmt.finalize();
        }
    });
});

// API Routes
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    const { product_id, quantity, customer_name } = req.body;
    db.get("SELECT stock FROM products WHERE id = ?", [product_id], (err, product) => {
        if (!product || product.stock < quantity) {
            return res.status(400).json({ error: "Item temporarily unavailable!" });
        }
        db.serialize(() => {
            db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, product_id]);
            db.run("INSERT INTO orders (product_id, quantity, customer_name) VALUES (?, ?, ?)", [product_id, quantity, customer_name], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Thank you for your order! Your exquisite choice has been reserved." });
            });
        });
    });
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.listen(3000, () => console.log('Boutique Server running smoothly on http://localhost:3000'));