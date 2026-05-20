import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Initialize SQLite Database
const dbPath = path.join(process.cwd(), "minimart.db");
const db = new Database(dbPath);

// Ensure JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

// Setup schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    cost_price REAL NOT NULL,
    stock_qty INTEGER NOT NULL,
    expiry_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    items JSON NOT NULL,
    total_amount REAL NOT NULL,
    profit REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    permissions TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    staff_name TEXT DEFAULT "",
    details TEXT DEFAULT "",
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

try {
  db.prepare('ALTER TABLE activity_logs ADD COLUMN staff_name TEXT DEFAULT ""').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE activity_logs ADD COLUMN details TEXT DEFAULT ""').run();
} catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  const logActivity = (userId: number, action_type: string, description: string, staffName: string = '', details: string = '') => {
    try {
      const stmt = db.prepare('INSERT INTO activity_logs (user_id, action_type, description, staff_name, details) VALUES (?, ?, ?, ?, ?)');
      stmt.run(userId, action_type, description, staffName, details);
    } catch(e) {
      console.error("Activity logging failed", e);
    }
  };

  // --- API Routes ---
  
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, subscription_tier } = req.body;
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const existingUser = stmt.get(email);
      if (existingUser) return res.status(400).json({ error: "User already exists" });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const exp = new Date();
      exp.setDate(exp.getDate() + 30);
      const expiryStr = exp.toISOString();

      const insertStmt = db.prepare('INSERT INTO users (name, email, password_hash, subscription_tier, subscription_expiry) VALUES (?, ?, ?, ?, ?)');
      const info = insertStmt.run(name, email, hash, subscription_tier || 'Free', subscription_tier && subscription_tier !== 'Free' ? expiryStr : null);
      const user_id = info.lastInsertRowid;

      const token = jwt.sign({ id: user_id, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user_id, name, email, subscription_tier: subscription_tier || 'Free', subscription_expiry: subscription_tier && subscription_tier !== 'Free' ? expiryStr : null } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      if (email.includes('@')) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email) as any;
        if (!user) return res.status(400).json({ error: "User not found" });

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        logActivity(user.id, 'USER_LOGIN', `Store owner signed in`, 'Store Owner', `Logged in via email`);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, store_name: user.store_name, currency_symbol: user.currency_symbol } });
      } else {
        const stmt = db.prepare('SELECT * FROM staff WHERE login_id = ?');
        const staff = stmt.get(email) as any;
        if (!staff) return res.status(400).json({ error: "Staff not found" });

        const validPass = await bcrypt.compare(password, staff.password_hash);
        if (!validPass) return res.status(400).json({ error: "Invalid password" });

        const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = userStmt.get(staff.user_id) as any;

        const token = jwt.sign({ id: user.id, email: user.email, staff_id: staff.id }, JWT_SECRET, { expiresIn: '7d' });
        logActivity(user.id, 'USER_LOGIN', `Staff signed in`, staff.name, `Role: ${staff.role}`);
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            store_name: user.store_name,
            currency_symbol: user.currency_symbol,
            staff_id: staff.id,
            staff_name: staff.name,
            staff_role: staff.role,
            permissions: JSON.parse(staff.permissions || '[]')
          }
        });
      }
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const stmt = db.prepare('SELECT id, name, email, store_name, currency_symbol, subscription_tier, subscription_expiry FROM users WHERE id = ?');
    const user = stmt.get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.user.staff_id) {
      const staffStmt = db.prepare('SELECT * FROM staff WHERE id = ?');
      const staff = staffStmt.get(req.user.staff_id) as any;
      if (staff) {
        return res.json({ 
          user: { 
            ...user, 
            staff_id: staff.id, 
            staff_name: staff.name, 
            staff_role: staff.role, 
            permissions: JSON.parse(staff.permissions || '[]') 
          } 
        });
      }
    }
    
    res.json({ user });
  });

  app.put("/api/settings", authenticateToken, (req: any, res) => {
    const { store_name, currency_symbol } = req.body;
    const stmt = db.prepare('UPDATE users SET store_name = ?, currency_symbol = ? WHERE id = ?');
    stmt.run(store_name, currency_symbol, req.user.id);
    res.json({ success: true });
  });

  app.put("/api/auth/claim", authenticateToken, async (req: any, res) => {
    const { name, email, password } = req.body;
    try {
      const crypto = require('crypto');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const stmt = db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?');
      stmt.run(name, email, hash, req.user.id);
      
      const token = jwt.sign({ id: req.user.id, email }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ success: true, token, user: { name, email } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscription/upgrade", authenticateToken, (req: any, res) => {
    const { tier } = req.body;
    // Basic mock logic: Set to 30 days from now
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const expiryStr = expiry.toISOString();
    
    const stmt = db.prepare('UPDATE users SET subscription_tier = ?, subscription_expiry = ? WHERE id = ?');
    stmt.run(tier, expiryStr, req.user.id);
    
    // Invalidate staff sessions could be complex, simple enough to return success and ask user to reload.
    res.json({ success: true, user: { subscription_tier: tier, subscription_expiry: expiryStr } });
  });

  // Setup schema
  try {
    db.exec('ALTER TABLE products ADD COLUMN barcode TEXT;');
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec('ALTER TABLE users ADD COLUMN store_name TEXT;');
  } catch (e) {}

  try {
    db.exec("ALTER TABLE users ADD COLUMN currency_symbol TEXT DEFAULT '$';");
  } catch (e) {}

  try {
    db.exec('ALTER TABLE staff ADD COLUMN login_id TEXT;');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_login_id ON staff(login_id);');
  } catch (e) {}

  try {
    db.exec('ALTER TABLE staff ADD COLUMN password_hash TEXT;');
  } catch (e) {}

  try {
    db.exec("ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'Free';");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE users ADD COLUMN subscription_expiry DATETIME;");
  } catch (e) {}

  // Product Routes
  app.get("/api/products", authenticateToken, (req: any, res) => {
    const stmt = db.prepare('SELECT * FROM products WHERE user_id = ?');
    const products = stmt.all(req.user.id);
    res.json(products);
  });

  app.post("/api/products", authenticateToken, (req: any, res) => {
    const { name, price, cost_price, stock_qty, expiry_date, barcode } = req.body;
    const stmt = db.prepare('INSERT INTO products (user_id, name, price, cost_price, stock_qty, expiry_date, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.user.id, name, price, cost_price, stock_qty, expiry_date, barcode);
    logActivity(req.user.id, 'INVENTORY_ADDED', `Added new product: ${name}`, req.user.staff_name || 'Store Owner', `Stock qty: ${stock_qty}, Price: ${price}`);
    res.json({ id: info.lastInsertRowid, ...req.body });
  });

  app.put("/api/products/:id", authenticateToken, (req: any, res) => {
    const { name, price, cost_price, stock_qty, expiry_date, barcode } = req.body;
    const { id } = req.params;
    const stmt = db.prepare('UPDATE products SET name = ?, price = ?, cost_price = ?, stock_qty = ?, expiry_date = ?, barcode = ? WHERE id = ? AND user_id = ?');
    const info = stmt.run(name, price, cost_price, stock_qty, expiry_date, barcode, id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: "Product not found or unauthorized" });
    logActivity(req.user.id, 'INVENTORY_UPDATED', `Updated product: ${name}`, req.user.staff_name || 'Store Owner', `New Stock: ${stock_qty}, New Price: ${price}`);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    
    // Get product name before deleting
    const productStmt = db.prepare('SELECT name FROM products WHERE id = ? AND user_id = ?');
    const product = productStmt.get(id, req.user.id) as any;
    
    const stmt = db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: "Product not found or unauthorized" });
    
    if (product) {
        logActivity(req.user.id, 'INVENTORY_DELETED', `Deleted product: ${product.name}`, req.user.staff_name || 'Store Owner', `Deleted ID: ${id}`);
    }
    
    res.json({ success: true });
  });

  // Sales Routes
  app.post("/api/sales", authenticateToken, (req: any, res) => {
    const { items, total_amount, profit } = req.body;
    
    const insertSale = db.transaction(() => {
      // 1. Insert Sale
      const stmt = db.prepare('INSERT INTO sales (user_id, items, total_amount, profit) VALUES (?, ?, ?, ?)');
      const info = stmt.run(req.user.id, JSON.stringify(items), total_amount, profit);
      
      // 2. Adjust Stock
      const adjustStock = db.prepare('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND user_id = ?');
      for (const item of items) {
        adjustStock.run(item.quantity, item.id, req.user.id);
      }
      
      const itemsDetails = items.map((i: any) => `[${i.quantity}x] ${i.name}`).join(', ');
      logActivity(req.user.id, 'SALE_COMPLETED', `Completed sale of $${total_amount}`, req.user.staff_name || 'Store Owner', itemsDetails);
      return info.lastInsertRowid;
    });

    try {
      const saleId = insertSale();
      res.json({ success: true, saleId });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dashboard", authenticateToken, (req: any, res) => {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const salesStmt = db.prepare('SELECT SUM(total_amount) as totalSales, SUM(profit) as totalProfit, COUNT(id) as totalTransactions FROM sales WHERE user_id = ? AND datetime(created_at) >= datetime(?)');
    const salesStats = salesStmt.get(req.user.id, currentMonthStart) as any;

    const productsStmt = db.prepare('SELECT SUM(stock_qty * cost_price) as inventoryValue FROM products WHERE user_id = ?');
    const inventoryStats = productsStmt.get(req.user.id) as any;

    const lowStockStmt = db.prepare('SELECT COUNT(*) as lowStockCount FROM products WHERE user_id = ? AND stock_qty <= 5');
    const lowStock = lowStockStmt.get(req.user.id) as any;

    // Recent Sales
    const recentSalesStmt = db.prepare('SELECT id, total_amount, created_at FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT 5');
    const recentSales = recentSalesStmt.all(req.user.id);
    
    // Monthly chart data (mock for last 7 days)
    const chartStmt = db.prepare(`
      SELECT date(created_at) as date, SUM(total_amount) as amount 
      FROM sales 
      WHERE user_id = ? 
      GROUP BY date(created_at) 
      ORDER BY date(created_at) DESC LIMIT 7
    `);
    const chartData = chartStmt.all(req.user.id).reverse();

    res.json({
        totalSales: salesStats.totalSales || 0,
        totalProfit: salesStats.totalProfit || 0,
        totalTransactions: salesStats.totalTransactions || 0,
        inventoryValue: inventoryStats.inventoryValue || 0,
        lowStockCount: lowStock.lowStockCount || 0,
        recentSales,
        chartData
    });
  });

  app.get("/api/activity", authenticateToken, (req: any, res) => {
    const stmt = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50');
    const logs = stmt.all(req.user.id);
    res.json(logs);
  });

  // Staff Routes
  app.get("/api/staff", authenticateToken, (req: any, res) => {
    const stmt = db.prepare('SELECT id, user_id, name, role, permissions, login_id FROM staff WHERE user_id = ?');
    const staff = stmt.all(req.user.id);
    res.json(staff);
  });

  app.post("/api/staff", authenticateToken, async (req: any, res) => {
    try {
      const { name, role, permissions, login_id, password } = req.body;
      let password_hash = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        password_hash = await bcrypt.hash(password, salt);
      }
      
      // Check uniqueness
      if (login_id) {
         const exist = db.prepare('SELECT id FROM staff WHERE login_id = ?').get(login_id);
         if (exist) return res.status(400).json({ error: "Staff Login ID already exists" });
      }

      const stmt = db.prepare('INSERT INTO staff (user_id, name, role, permissions, login_id, password_hash) VALUES (?, ?, ?, ?, ?, ?)');
      const permsString = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || []);
      const info = stmt.run(req.user.id, name, role, permsString, login_id || null, password_hash);
      logActivity(req.user.id, 'STAFF_ADDED', `Added staff member: ${name}`, req.user.staff_name || 'Store Owner', `Role: ${role}`);
      res.json({ id: info.lastInsertRowid, name, role, permissions: permsString, login_id });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/staff/:id", authenticateToken, async (req: any, res) => {
    try {
      const { name, role, permissions, login_id, password } = req.body;
      const { id } = req.params;
      
      if (login_id) {
          const exist = db.prepare('SELECT id FROM staff WHERE login_id = ? AND id != ?').get(login_id, id);
          if (exist) return res.status(400).json({ error: "Staff Login ID already exists" });
      }

      let password_hash = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        password_hash = await bcrypt.hash(password, salt);
      }

      const permsString = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || []);
      
      let info;
      if (password) {
          const stmt = db.prepare('UPDATE staff SET name = ?, role = ?, permissions = ?, login_id = ?, password_hash = ? WHERE id = ? AND user_id = ?');
          info = stmt.run(name, role, permsString, login_id || null, password_hash, id, req.user.id);
      } else {
          const stmt = db.prepare('UPDATE staff SET name = ?, role = ?, permissions = ?, login_id = ? WHERE id = ? AND user_id = ?');
          info = stmt.run(name, role, permsString, login_id || null, id, req.user.id);
      }
      
      if (info.changes === 0) return res.status(404).json({ error: "Staff not found or unauthorized" });
      logActivity(req.user.id, 'STAFF_UPDATED', `Updated staff member: ${name}`, req.user.staff_name || 'Store Owner', `Role: ${role}`);
      res.json({ success: true, permissions: permsString, login_id });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/staff/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM staff WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: "Staff not found or unauthorized" });
    
    logActivity(req.user.id, 'STAFF_DELETED', `Deleted staff ID: ${id}`, req.user.staff_name || 'Store Owner', '');
    res.json({ success: true });
  });

  app.get("/api/currency", async (req: any, res) => {
    try {
      let clientIp = '';
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
      }
      
      const ipRes = await fetch(`https://ipwho.is/${clientIp}`);
      const ipData = await ipRes.json();
      const currencyCode = ipData?.currency?.code || 'USD';

      if (currencyCode !== 'USD') {
        const exchangeRes = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const exchangeData = await exchangeRes.json();
        const rate = exchangeData?.rates?.[currencyCode] || 1;
        res.json({ code: currencyCode, rate });
      } else {
        res.json({ code: 'USD', rate: 1 });
      }
    } catch (e: any) {
      console.error("Currency API Error:", e.message);
      res.json({ code: 'USD', rate: 1 });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer();
