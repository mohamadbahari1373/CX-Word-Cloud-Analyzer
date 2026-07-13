import express from "express";
import path from "path";
import fs from "fs";
import initSqlJs from "sql.js";
import { createServer as createViteServer } from "vite";

interface WhitelistWord {
  id: string;
  word: string;
  createdAt?: number;
}

interface WhitelistGroup {
  id: string;
  name: string;
  isActive: boolean;
  color: string;
  createdAt?: number;
  words: WhitelistWord[];
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  const PORT = 3000;

  // Initialize pure JS/WASM SQLite database
  const SQL = await initSqlJs();
  const dbPath = path.join(process.cwd(), "db.sqlite");
  let db: any;

  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error("Failed to load existing db.sqlite file, starting with a fresh database:", err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Database persistence helper
  function saveDatabase() {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (err) {
      console.error("Failed to write db.sqlite to disk:", err);
    }
  }

  // Helper wrappers for SQL.js
  function dbAll(query: string, params: any[] = []): any[] {
    try {
      const stmt = db.prepare(query);
      stmt.bind(params);
      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (err) {
      console.error(`Error in dbAll: ${query}`, err);
      throw err;
    }
  }

  // Helper for single row
  function dbGet(query: string, params: any[] = []): any {
    try {
      const stmt = db.prepare(query);
      stmt.bind(params);
      let row: any = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row;
    } catch (err) {
      console.error(`Error in dbGet: ${query}`, err);
      throw err;
    }
  }

  // Helper to run query with optional persistence
  function dbRun(query: string, params: any[] = []) {
    try {
      db.run(query, params);
      saveDatabase();
    } catch (err) {
      console.error(`Error in dbRun: ${query}`, err);
      throw err;
    }
  }

  // Create tables if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS whitelist_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      color TEXT NOT NULL,
      createdAt INTEGER
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS whitelist_words (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL,
      word TEXT NOT NULL,
      createdAt INTEGER,
      FOREIGN KEY(groupId) REFERENCES whitelist_groups(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stop_words (
      word TEXT PRIMARY KEY
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  saveDatabase();

  // Default stop words and whitelist groups to seed if empty
  const defaultGroups: WhitelistGroup[] = [
    {
      id: "g1",
      name: "مسائل عمومی و پشتیبانی",
      isActive: true,
      color: "indigo",
      createdAt: Date.now() - 300000,
      words: [
        { id: "w1_1", word: "پشتیبانی", createdAt: Date.now() - 800000 },
        { id: "w1_2", word: "کیفیت", createdAt: Date.now() - 700000 },
        { id: "w1_3", word: "تحویل", createdAt: Date.now() - 600000 },
        { id: "w1_4", word: "سرعت", createdAt: Date.now() - 500000 },
        { id: "w1_5", word: "مبلغ", createdAt: Date.now() - 400000 },
        { id: "w1_6", word: "تخفیف", createdAt: Date.now() - 300000 },
        { id: "w1_7", word: "مرجوعی", createdAt: Date.now() - 200000 },
        { id: "w1_8", word: "پیگیری", createdAt: Date.now() - 100000 },
      ]
    },
    {
      id: "g2",
      name: "لیست ارزها",
      isActive: true,
      color: "emerald",
      createdAt: Date.now() - 200000,
      words: [
        { id: "w2_1", word: "تتر", createdAt: Date.now() - 150000 },
        { id: "w2_2", word: "بیت کوین", createdAt: Date.now() - 140000 },
        { id: "w2_3", word: "تون", createdAt: Date.now() - 130000 },
        { id: "w2_4", word: "اتریوم", createdAt: Date.now() - 120000 },
      ]
    },
    {
      id: "g3",
      name: "لیست صرافی‌ها",
      isActive: true,
      color: "amber",
      createdAt: Date.now() - 100000,
      words: [
        { id: "w3_1", word: "کوکوین", createdAt: Date.now() - 90000 },
        { id: "w3_2", word: "بیت پین", createdAt: Date.now() - 80000 },
        { id: "w3_3", word: "نوبیتکس", createdAt: Date.now() - 70000 },
        { id: "w3_4", word: "والکس", createdAt: Date.now() - 60000 },
      ]
    }
  ];

  const defaultStopWords = [
    "و", "در", "به", "از", "که", "این", "با", "برای", "هم", "تا", "رو", "را", "یک", "است", "هست", 
    "شد", "بود", "کند", "دارد", "کرد", "میکند", "شده", "های", "ام", "ای", "کی", "چه", "آیا", "من", 
    "تو", "ما", "شما", "آنها", "او", "کار", "مورد", "روی", "بخش", "خود", "دیگر", "صفحه", "ممنون", 
    "سلام", "لطفا", "تیکت", "سلام،", "پشتیبانی", "مرسی", "تشکر", "میکنم", "کنند", "باشد", "باشه", 
    "کردن", "شدن", "دارم", "داری", "داریم", "دارید", "دارند", "بودم", "بودی", "بودیم", "بودید", 
    "بودند", "هستم", "هستی", "هستیم", "هستید", "هستند", "نیست", "نیستم", "نیستی", "نیستیم", "نیستید", 
    "نیستند", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده", "خیلی", "کمی", "بسیار", 
    "زیاد", "کم", "بیشتر", "کمتر", "خوب", "بد", "عالی", "افتضاح", "متوسط", "بابت", "توی", "روی", "زیر",
    "بین", "پیش", "پس", "بعد", "قبل", "درباره", "مبنی", "جهت", "انجام", "ارائه", "داشتن", "خواستن",
    "توانستن", "آمدن", "رفتن", "دادن", "گرفتن", "زدن", "دیدن", "گفتن", "شنیدن", "نوشتن", "خواندن",
    "چون", "چرا", "چگونه", "چطور", "چیزی", "چیز", "کس", "کسی", "همه", "هیچ", "هر", "هیچکس", "هرکس",
    "کجا", "کدام", "کدوم", "الان", "حالا", 'الآن', "دیروز", "امروز", "فردا", "شب", "روز", "ساعت",
    "یا", "اما", "ولی", "بلکه", "اگر", "اگه", "مگر", "مگه", "زیرا", "چراکه", "بنابراین", "لذا",
    "the", "and", "to", "of", "in", "is", "that", "it", "for", "on", "with", "as", "at", "by", "an", "be", "this", "are", "from",
    "یا", "با", "تا", "شما", "آن", "آنها", "وی", "او", "ما", "من", "تو", "ایشان", "جناب", "آقا", "خانم",
    "درباره", "نسبت", "طبق", "براساس", "بر", "علیه", "بدون", "مثل", "مانند", "همچون", "همانند",
    "چند", "خیلی", "بسیار", "کمی", "اندکی", "زیادی", "بیش", "کم", "بزرگ", "کوچک", "جدید", "قدیم",
    "سلام", "احترام", "پشتیبان", "خسته", "نباشید", "روزتون", "وقتتون", "بخیر", "سلام،", "ممنون،"
  ];

  // Seed default Groups and Words if empty
  const groupCount = dbGet("SELECT COUNT(*) as count FROM whitelist_groups");
  if (groupCount && groupCount.count === 0) {
    for (const group of defaultGroups) {
      dbRun(
        "INSERT INTO whitelist_groups (id, name, isActive, color, createdAt) VALUES (?, ?, ?, ?, ?)",
        [group.id, group.name, group.isActive ? 1 : 0, group.color, group.createdAt]
      );
      for (const word of group.words) {
        dbRun(
          "INSERT INTO whitelist_words (id, groupId, word, createdAt) VALUES (?, ?, ?, ?)",
          [word.id, group.id, word.word, word.createdAt]
        );
      }
    }
  }

  // Seed default Stop Words if empty
  const stopWordsCount = dbGet("SELECT COUNT(*) as count FROM stop_words");
  if (stopWordsCount && stopWordsCount.count === 0) {
    for (const word of defaultStopWords) {
      dbRun("INSERT OR IGNORE INTO stop_words (word) VALUES (?)", [word]);
    }
  }

  // Seed default theme if empty
  const themeSetting = dbGet("SELECT value FROM settings WHERE key = ?", ["theme"]);
  if (!themeSetting) {
    dbRun("INSERT INTO settings (key, value) VALUES (?, ?)", ["theme", "light"]);
  }

  // API Endpoints
  app.get("/api/data", (req, res) => {
    try {
      const groups = dbAll("SELECT * FROM whitelist_groups ORDER BY createdAt ASC");
      const words = dbAll("SELECT * FROM whitelist_words ORDER BY createdAt ASC");
      const stopWordsRows = dbAll("SELECT word FROM stop_words");
      const themeRow = dbGet("SELECT value FROM settings WHERE key = ?", ["theme"]);

      // Structure groups with their words
      const whitelistGroups = groups.map((g: any) => ({
        id: g.id,
        name: g.name,
        isActive: !!g.isActive,
        color: g.color,
        createdAt: g.createdAt,
        words: words
          .filter((w: any) => w.groupId === g.id)
          .map((w: any) => ({
            id: w.id,
            word: w.word,
            createdAt: w.createdAt
          }))
      }));

      const stopWords = stopWordsRows.map((r: any) => r.word);
      const theme = themeRow ? themeRow.value : "light";

      res.json({ whitelistGroups, stopWords, theme });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/save-all", (req, res) => {
    const { whitelistGroups, stopWords, theme } = req.body;
    try {
      // Execute in an SQLite Transaction for data integrity
      db.run("BEGIN TRANSACTION");

      // 1. Save theme setting
      if (theme) {
        db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ["theme", theme]);
      }

      // 2. Save whitelist groups and words
      if (Array.isArray(whitelistGroups)) {
        db.run("DELETE FROM whitelist_words");
        db.run("DELETE FROM whitelist_groups");

        for (const group of whitelistGroups) {
          db.run(
            "INSERT INTO whitelist_groups (id, name, isActive, color, createdAt) VALUES (?, ?, ?, ?, ?)",
            [group.id, group.name, group.isActive ? 1 : 0, group.color, group.createdAt || Date.now()]
          );
          if (Array.isArray(group.words)) {
            for (const word of group.words) {
              db.run(
                "INSERT INTO whitelist_words (id, groupId, word, createdAt) VALUES (?, ?, ?, ?)",
                [word.id, group.id, word.word, word.createdAt || Date.now()]
              );
            }
          }
        }
      }

      // 3. Save stop words
      if (Array.isArray(stopWords)) {
        db.run("DELETE FROM stop_words");
        for (const word of stopWords) {
          if (word && word.trim()) {
            db.run("INSERT OR IGNORE INTO stop_words (word) VALUES (?)", [word.trim()]);
          }
        }
      }

      db.run("COMMIT");
      saveDatabase();
      res.json({ success: true });
    } catch (err: any) {
      try {
        db.run("ROLLBACK");
      } catch (rollbackErr) {
        // ignore rollback error if any
      }
      console.error(err);
      res.status(500).json({ error: err.message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
