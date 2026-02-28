import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("movies.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    id TEXT PRIMARY KEY,
    title TEXT,
    poster TEXT,
    year TEXT,
    genre TEXT,
    rating TEXT
  );
  CREATE TABLE IF NOT EXISTS ratings (
    movie_id TEXT PRIMARY KEY,
    rating INTEGER
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/watchlist", (req, res) => {
    const items = db.prepare("SELECT * FROM watchlist").all();
    res.json(items);
  });

  app.post("/api/watchlist", (req, res) => {
    const { id, title, poster, year, genre, rating } = req.body;
    try {
      db.prepare("INSERT INTO watchlist (id, title, poster, year, genre, rating) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, title, poster, year, genre, rating);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Already in watchlist" });
    }
  });

  app.delete("/api/watchlist/:id", (req, res) => {
    db.prepare("DELETE FROM watchlist WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/ratings", (req, res) => {
    const items = db.prepare("SELECT * FROM ratings").all();
    res.json(items);
  });

  app.post("/api/ratings", (req, res) => {
    const { movie_id, rating } = req.body;
    db.prepare("INSERT OR REPLACE INTO ratings (movie_id, rating) VALUES (?, ?)")
      .run(movie_id, rating);
    res.json({ success: true });
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
