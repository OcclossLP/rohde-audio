import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const dbPath = process.env.DATABASE_PATH || "./data/app.db";
const resolvedPath = path.resolve(dbPath);

if (!fs.existsSync(path.dirname(resolvedPath))) {
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
}

const globalForDb = global as { db?: ReturnType<typeof Database> };

export const db =
  globalForDb.db ??
  new Database(resolvedPath);

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

db.pragma("journal_mode = WAL");

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
`);

const userColumns = db
  .prepare("PRAGMA table_info(users)")
  .all() as Array<{ name: string }>;
if (!userColumns.some((column) => column.name === "phone")) {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
}
if (!userColumns.some((column) => column.name === "notes")) {
  db.exec("ALTER TABLE users ADD COLUMN notes TEXT");
}
if (!userColumns.some((column) => column.name === "first_name")) {
  db.exec("ALTER TABLE users ADD COLUMN first_name TEXT");
}
if (!userColumns.some((column) => column.name === "last_name")) {
  db.exec("ALTER TABLE users ADD COLUMN last_name TEXT");
}
if (!userColumns.some((column) => column.name === "street")) {
  db.exec("ALTER TABLE users ADD COLUMN street TEXT");
}
if (!userColumns.some((column) => column.name === "house_number")) {
  db.exec("ALTER TABLE users ADD COLUMN house_number TEXT");
}
if (!userColumns.some((column) => column.name === "address_extra")) {
  db.exec("ALTER TABLE users ADD COLUMN address_extra TEXT");
}
if (!userColumns.some((column) => column.name === "postal_code")) {
  db.exec("ALTER TABLE users ADD COLUMN postal_code TEXT");
}
if (!userColumns.some((column) => column.name === "city")) {
  db.exec("ALTER TABLE users ADD COLUMN city TEXT");
}
if (!userColumns.some((column) => column.name === "email_verified_at")) {
  db.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
  const now = new Date().toISOString();
  db.prepare("UPDATE users SET email_verified_at = ? WHERE email_verified_at IS NULL").run(now);
}
if (!userColumns.some((column) => column.name === "verification_code")) {
  db.exec("ALTER TABLE users ADD COLUMN verification_code TEXT");
}
if (!userColumns.some((column) => column.name === "verification_expires_at")) {
  db.exec("ALTER TABLE users ADD COLUMN verification_expires_at TEXT");
}
if (!userColumns.some((column) => column.name === "verification_sent_at")) {
  db.exec("ALTER TABLE users ADD COLUMN verification_sent_at TEXT");
}

const packageColumns = db
  .prepare("PRAGMA table_info(packages)")
  .all() as Array<{ name: string }>;
if (!packageColumns.some((column) => column.name === "sale_price")) {
  db.exec("ALTER TABLE packages ADD COLUMN sale_price TEXT");
}

db.exec("CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON pageviews(created_at)");
db.exec("CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at)");
db.exec("CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id)");

const inquiryColumns = db
  .prepare("PRAGMA table_info(inquiries)")
  .all() as Array<{ name: string }>;
if (!inquiryColumns.some((column) => column.name === "status")) {
  db.exec("ALTER TABLE inquiries ADD COLUMN status TEXT NOT NULL DEFAULT 'open'");
}
if (!inquiryColumns.some((column) => column.name === "contact_name")) {
  db.exec("ALTER TABLE inquiries ADD COLUMN contact_name TEXT");
}
if (!inquiryColumns.some((column) => column.name === "contact_email")) {
  db.exec("ALTER TABLE inquiries ADD COLUMN contact_email TEXT");
}
if (!inquiryColumns.some((column) => column.name === "contact_phone")) {
  db.exec("ALTER TABLE inquiries ADD COLUMN contact_phone TEXT");
}
