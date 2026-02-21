import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("followup.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    secondary_phone TEXT,
    bike TEXT,
    purchase_date TEXT,
    finance_cash TEXT,
    due_amount REAL DEFAULT 0,
    next_follow_up TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/follow-ups", (req, res) => {
    const followUps = db.prepare("SELECT * FROM follow_ups ORDER BY next_follow_up ASC").all();
    res.json(followUps);
  });

  app.post("/api/follow-ups", (req, res) => {
    const { customer_name, phone, secondary_phone, bike, purchase_date, finance_cash, due_amount, next_follow_up } = req.body;
    const info = db.prepare(`
      INSERT INTO follow_ups (customer_name, phone, secondary_phone, bike, purchase_date, finance_cash, due_amount, next_follow_up)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customer_name, phone, secondary_phone, bike, purchase_date, finance_cash, due_amount, next_follow_up);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/follow-ups/:id", (req, res) => {
    const { id } = req.params;
    const { customer_name, phone, secondary_phone, bike, purchase_date, finance_cash, due_amount, next_follow_up, status } = req.body;
    db.prepare(`
      UPDATE follow_ups 
      SET customer_name = ?, phone = ?, secondary_phone = ?, bike = ?, purchase_date = ?, finance_cash = ?, due_amount = ?, next_follow_up = ?, status = ?
      WHERE id = ?
    `).run(customer_name, phone, secondary_phone, bike, purchase_date, finance_cash, due_amount, next_follow_up, status, id);
    res.json({ success: true });
  });

  app.delete("/api/follow-ups/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM follow_ups WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/team", (req, res) => {
    const team = db.prepare("SELECT * FROM team_members").all();
    res.json(team);
  });

  app.post("/api/team", (req, res) => {
    const { name, role, phone } = req.body;
    const info = db.prepare("INSERT INTO team_members (name, role, phone) VALUES (?, ?, ?)").run(name, role, phone);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/team/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM team_members WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        SUM(due_amount) as total_due,
        COUNT(*) as total_follow_ups,
        COUNT(CASE WHEN next_follow_up = date('now') THEN 1 END) as due_today
      FROM follow_ups
    `).get();
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
