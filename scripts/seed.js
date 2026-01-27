require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const dbPath = process.env.DATABASE_PATH || "./data/app.db";
const resolvedPath = path.resolve(dbPath);
const dir = path.dirname(resolvedPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    name TEXT,
    notes TEXT,
    first_name TEXT,
    last_name TEXT,
    street TEXT,
    house_number TEXT,
    address_extra TEXT,
    postal_code TEXT,
    city TEXT,
    email_verified_at TEXT,
    verification_code TEXT,
    verification_expires_at TEXT,
    verification_sent_at TEXT,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT NOT NULL,
    sale_price TEXT,
    highlight INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pageviews (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    event_type TEXT,
    participants TEXT,
    event_date TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || "Admin";

if (!adminEmail || !adminPassword) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set for seeding.");
}

const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = "sha512";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return { hash, salt };
}

const now = new Date().toISOString();
const adminExists = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get(adminEmail);

if (!adminExists) {
  const { hash, salt } = hashPassword(adminPassword);
  db.prepare(
    `
      INSERT INTO users (id, email, name, role, password_hash, password_salt, email_verified_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(crypto.randomUUID(), adminEmail, adminName, "ADMIN", hash, salt, now, now, now);
}

const packageCount = db.prepare("SELECT COUNT(*) as count FROM packages").get();
if (packageCount.count === 0) {
  const insert = db.prepare(
    `
      INSERT INTO packages (id, title, description, price, sale_price, highlight, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  );
  const packages = [
    {
      title: "Small Party",
      description: "Ideal für Geburtstage & kleine Feiern.",
      price: "ab 49 €",
      highlight: 0,
      sortOrder: 1,
    },
    {
      title: "Birthday Special",
      description: "Mehr Leistung & Bass für größere Partys.",
      price: "ab 89 €",
      highlight: 1,
      sortOrder: 2,
    },
    {
      title: "Event Pro",
      description: "Maximaler Sound für große Events.",
      price: "ab 149 €",
      highlight: 0,
      sortOrder: 3,
    },
  ];

  packages.forEach((pkg) => {
    insert.run(
      crypto.randomUUID(),
      pkg.title,
      pkg.description,
      pkg.price,
      null,
      pkg.highlight,
      pkg.sortOrder,
      now,
      now
    );
  });
}

db.close();
