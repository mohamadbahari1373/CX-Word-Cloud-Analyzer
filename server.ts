import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import initSqlJs from "sql.js";
import { createServer as createViteServer } from "vite";

// Base32 decoding helper for TOTP secrets
function base32ToBuf(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanBase32 = base32.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (let i = 0; i < cleanBase32.length; i++) {
    const val = alphabet.indexOf(cleanBase32[i]);
    if (val === -1) {
      throw new Error("Invalid base32 character: " + cleanBase32[i]);
    }
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// TOTP generation (RFC 6238)
function generateTOTP(secretBase32: string, timeOffsetSteps = 0): string {
  try {
    const key = base32ToBuf(secretBase32);
    const epoch = Math.floor(Date.now() / 1000);
    const time = Math.floor(epoch / 30) + timeOffsetSteps;
    
    const timeBuf = Buffer.alloc(8);
    let temp = time;
    for (let i = 7; i >= 0; i--) {
      timeBuf[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const hmac = crypto.createHmac("sha1", key);
    hmac.update(timeBuf);
    const hmacResult = hmac.digest();

    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const code =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);

    const otp = code % 1000000;
    return otp.toString().padStart(6, "0");
  } catch (err) {
    console.error("Error generating TOTP:", err);
    return "";
  }
}

// TOTP verification with window of 1 step (to tolerate minor clock drift)
function verifyTOTP(secretBase32: string, token: string): boolean {
  if (!token || token.length !== 6) return false;
  for (let i = -1; i <= 1; i++) {
    if (generateTOTP(secretBase32, i) === token) {
      return true;
    }
  }
  return false;
}

// Generate random Base32 secret for Google Authenticator (TOTP)
function generateBase32Secret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, alphabet.length);
    result += alphabet[randomIndex];
  }
  return result;
}

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

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT,
      totpSecret TEXT,
      totpVerified INTEGER DEFAULT 1,
      role TEXT DEFAULT 'user'
    );
  `);

  // Ensure older databases get the new fullName column
  try {
    db.run("ALTER TABLE users ADD COLUMN fullName TEXT");
  } catch (e) {
    // Column already exists or error
  }

  // Seed default admin and a test user if empty
  const adminCheck = dbGet("SELECT COUNT(*) as count FROM users WHERE email = ?", ["m.bahari@wallex.net"]);
  if (adminCheck && adminCheck.count === 0) {
    dbRun(
      "INSERT INTO users (id, email, password, fullName, totpSecret, totpVerified, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["admin_user", "m.bahari@wallex.net", "123456", "محمد بهاری", "", 1, "admin"]
    );
  } else {
    // Update existing admin to have a fullName if missing
    dbRun("UPDATE users SET fullName = ? WHERE email = ? AND (fullName IS NULL OR fullName = '')", ["محمد بهاری", "m.bahari@wallex.net"]);
  }

  const userCheck = dbGet("SELECT COUNT(*) as count FROM users WHERE email = ?", ["user@wallex.net"]);
  if (userCheck && userCheck.count === 0) {
    dbRun(
      "INSERT INTO users (id, email, password, fullName, totpSecret, totpVerified, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["test_user", "user@wallex.net", "123456", "کاربر تست", "", 1, "user"]
    );
  } else {
    // Update existing test user to have a fullName if missing
    dbRun("UPDATE users SET fullName = ? WHERE email = ? AND (fullName IS NULL OR fullName = '')", ["کاربر تست", "user@wallex.net"]);
  }

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

  // AUTHENTICATION ENDPOINTS

  // Login Endpoint
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        return res.status(400).json({ error: "ایمیل و رمز عبور الزامی هستند" });
      }

      // Check user
      const user = dbGet("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
      if (!user) {
        return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است" });
      }

      // Check password
      if (user.password !== password) {
        return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است" });
      }

      // Login success (No TOTP check)
      res.json({
        status: "success",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName || "",
          role: user.role,
          totpVerified: 1
        }
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // User Registration Endpoint (Sign Up)
  app.post("/api/auth/register", (req, res) => {
    const { fullName, email, password } = req.body;
    try {
      if (!fullName || !email || !password) {
        return res.status(400).json({ error: "وارد کردن تمامی فیلدها (نام و نام خانوادگی، ایمیل، رمز عبور) الزامی است" });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanFullName = fullName.trim();

      if (password.length < 4) {
        return res.status(400).json({ error: "رمز عبور باید حداقل ۴ کاراکتر باشد" });
      }

      // Check if user already exists
      const existing = dbGet("SELECT id FROM users WHERE email = ?", [cleanEmail]);
      if (existing) {
        return res.status(400).json({ error: "کاربری با این ایمیل از قبل ثبت نام کرده است" });
      }

      const userId = "u_" + Date.now();

      dbRun(
        "INSERT INTO users (id, email, password, fullName, totpSecret, totpVerified, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, cleanEmail, password, cleanFullName, "", 1, "user"]
      );

      res.json({
        success: true,
        message: "ثبت نام با موفقیت انجام شد",
        user: {
          id: userId,
          email: cleanEmail,
          fullName: cleanFullName,
          role: "user",
          totpVerified: 1
        }
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Change Password endpoint (inside application profile)
  app.post("/api/auth/change-password", (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    try {
      if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "تمامی اطلاعات الزامی هستند" });
      }

      const user = dbGet("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
      if (!user || user.password !== oldPassword) {
        return res.status(401).json({ error: "رمز عبور فعلی اشتباه است" });
      }

      dbRun("UPDATE users SET password = ? WHERE email = ?", [newPassword, email.trim().toLowerCase()]);

      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN USERS MANAGEMENT ENDPOINTS

  // Get all users (Admin only)
  app.get("/api/admin/users", (req, res) => {
    try {
      const users = dbAll("SELECT id, email, password, fullName, role FROM users");
      res.json({ users });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create a new user (Admin only)
  app.post("/api/admin/users/create", (req, res) => {
    const { email, fullName, role } = req.body;
    try {
      if (!email || !email.trim()) {
        return res.status(400).json({ error: "ایمیل الزامی است" });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanFullName = (fullName || "").trim();
      const userRole = role === "admin" ? "admin" : "user";

      // Check unique
      const existing = dbGet("SELECT id FROM users WHERE email = ?", [cleanEmail]);
      if (existing) {
        return res.status(400).json({ error: "کاربری با این ایمیل از قبل تعریف شده است" });
      }

      const userId = "u_" + Date.now();
      const defaultPassword = "123456";

      dbRun(
        "INSERT INTO users (id, email, password, fullName, totpSecret, totpVerified, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, cleanEmail, defaultPassword, cleanFullName, "", 1, userRole]
      );

      res.json({
        success: true,
        user: {
          id: userId,
          email: cleanEmail,
          password: defaultPassword,
          fullName: cleanFullName,
          role: userRole
        }
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Edit user's details (Admin only)
  app.post("/api/admin/users/update", (req, res) => {
    const { id, email, fullName, role } = req.body;
    try {
      if (!id || !email || !email.trim()) {
        return res.status(400).json({ error: "شناسه و ایمیل الزامی هستند" });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanFullName = (fullName || "").trim();
      const userRole = role === "admin" ? "admin" : "user";

      // Ensure the email is not taken by another user
      const existing = dbGet("SELECT id FROM users WHERE email = ? AND id != ?", [cleanEmail, id]);
      if (existing) {
        return res.status(400).json({ error: "این ایمیل توسط کاربر دیگری استفاده شده است" });
      }

      dbRun("UPDATE users SET email = ?, fullName = ?, role = ? WHERE id = ?", [cleanEmail, cleanFullName, userRole, id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Reset user's password to default '123456' (Admin only)
  app.post("/api/admin/users/reset-password", (req, res) => {
    const { id } = req.body;
    try {
      if (!id) {
        return res.status(400).json({ error: "شناسه کاربر الزامی است" });
      }

      dbRun("UPDATE users SET password = ? WHERE id = ?", ["123456", id]);
      res.json({ success: true, defaultPassword: "123456" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete user (Admin only)
  app.post("/api/admin/users/delete", (req, res) => {
    const { id } = req.body;
    try {
      if (!id) {
        return res.status(400).json({ error: "شناسه کاربر الزامی است" });
      }

      // Prevent deleting the main admin
      const user = dbGet("SELECT role, email FROM users WHERE id = ?", [id]);
      if (user && (user.role === "admin" || user.email === "m.bahari@wallex.net")) {
        return res.status(400).json({ error: "حذف مدیر سیستم امکان‌پذیر نیست" });
      }

      dbRun("DELETE FROM users WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (err: any) {
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
