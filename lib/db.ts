import fs from "fs";
import path from "path";
import crypto from "crypto";
import Database from "better-sqlite3";
import { hashPassword } from "./password";

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
    customer_number TEXT,
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
    deleted_at TEXT,
    is_guest INTEGER NOT NULL DEFAULT 0,
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
    order_number TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reserved_customer_numbers (
    customer_number TEXT PRIMARY KEY,
    reserved_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reserved_order_numbers (
    order_number TEXT PRIMARY KEY,
    reserved_at TEXT NOT NULL
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

const userColumns = db
  .prepare("PRAGMA table_info(users)")
  .all() as Array<{ name: string }>;
if (!userColumns.some((column) => column.name === "phone")) {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
}
if (!userColumns.some((column) => column.name === "customer_number")) {
  db.exec("ALTER TABLE users ADD COLUMN customer_number TEXT");
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
if (!userColumns.some((column) => column.name === "deleted_at")) {
  db.exec("ALTER TABLE users ADD COLUMN deleted_at TEXT");
}
if (!userColumns.some((column) => column.name === "is_guest")) {
  db.exec("ALTER TABLE users ADD COLUMN is_guest INTEGER NOT NULL DEFAULT 0");
}

const packageColumns = db
  .prepare("PRAGMA table_info(packages)")
  .all() as Array<{ name: string }>;
if (!packageColumns.some((column) => column.name === "sale_price")) {
  db.exec("ALTER TABLE packages ADD COLUMN sale_price TEXT");
}

db.exec("CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON pageviews(created_at)");
db.exec("CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)");
db.exec("CREATE INDEX IF NOT EXISTS idx_events_name ON events(name)");
db.exec("CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)");
db.exec("CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at)");
db.exec("CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id)");
db.exec("CREATE INDEX IF NOT EXISTS idx_users_customer_number ON users(customer_number)");
db.exec("CREATE INDEX IF NOT EXISTS idx_inquiries_order_number ON inquiries(order_number)");
db.exec("CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at)");
db.exec(
  "CREATE INDEX IF NOT EXISTS idx_reserved_customer_numbers ON reserved_customer_numbers(customer_number)"
);
db.exec(
  "CREATE INDEX IF NOT EXISTS idx_reserved_order_numbers ON reserved_order_numbers(order_number)"
);

const pad = (value: number, length: number) => String(value).padStart(length, "0");
const yearPrefix = String(new Date().getFullYear()).slice(-2);
const orderPrefix = `${yearPrefix}0`;

const now = new Date().toISOString();

const getNextSequence = (table: string, column: string, prefix: string, totalLength: number) => {
  const row = db
    .prepare(
      `
        SELECT MAX(CAST(${column} AS INTEGER)) as maxValue
        FROM ${table}
        WHERE ${column} LIKE ? AND length(${column}) = ?
      `
    )
    .get(`${prefix}%`, totalLength) as { maxValue: number | null } | undefined;
  const currentMax = row?.maxValue ?? 0;
  const nextValue = currentMax ? currentMax + 1 : Number(`${prefix}${pad(1, totalLength - prefix.length)}`);
  return String(nextValue);
};

const isValidCustomerNumber = (value: string) =>
  /^\d{5}$/.test(value) && Number(value) >= 10100;
const isValidOrderNumber = (value: string) => /^\d{2}0\d{3}$/.test(value);

const usersMissingNumbers = db
  .prepare(
    "SELECT id, customer_number as customerNumber FROM users"
  )
  .all() as Array<{ id: string; customerNumber: string | null }>;
usersMissingNumbers.forEach(({ id, customerNumber }) => {
  if (customerNumber && isValidCustomerNumber(customerNumber)) return;
  const row = db
    .prepare(
      `
        SELECT MAX(CAST(value AS INTEGER)) as maxValue
        FROM (
          SELECT customer_number as value
          FROM users
          WHERE length(customer_number) = 5
          UNION ALL
          SELECT customer_number as value
          FROM reserved_customer_numbers
          WHERE length(customer_number) = 5
        )
      `
    )
    .get() as { maxValue: number | null } | undefined;
  const currentMax = row?.maxValue ?? 0;
  const number = String(currentMax >= 10100 ? currentMax + 1 : 10100);
  db.prepare("UPDATE users SET customer_number = ? WHERE id = ?").run(number, id);
});

const inquiriesMissingNumbers = db
  .prepare(
    "SELECT id, order_number as orderNumber FROM inquiries"
  )
  .all() as Array<{ id: string; orderNumber: string | null }>;
inquiriesMissingNumbers.forEach(({ id, orderNumber }) => {
  if (orderNumber && isValidOrderNumber(orderNumber)) return;
  const number = getNextSequence("inquiries", "order_number", orderPrefix, 6);
  db.prepare("UPDATE inquiries SET order_number = ? WHERE id = ?").run(number, id);
});

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
if (!inquiryColumns.some((column) => column.name === "order_number")) {
  db.exec("ALTER TABLE inquiries ADD COLUMN order_number TEXT");
}

const guestUser = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get("gast@rohde-audio.local") as { id: string } | undefined;

if (guestUser) {
  const guestInquiries = db
    .prepare(
      `
        SELECT id, contact_email as email, contact_name as name, created_at as createdAt
        FROM inquiries
        WHERE user_id = ? AND contact_email IS NOT NULL
      `
    )
    .all(guestUser.id) as Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  }>;

  const getNextCustomerNumber = () => {
    const row = db
      .prepare(
        `
          SELECT MAX(CAST(value AS INTEGER)) as maxValue
          FROM (
            SELECT customer_number as value
            FROM users
            WHERE length(customer_number) = 5
            UNION ALL
            SELECT customer_number as value
            FROM reserved_customer_numbers
            WHERE length(customer_number) = 5
          )
        `
      )
      .get() as { maxValue: number | null } | undefined;
    const currentMax = row?.maxValue ?? 0;
    return String(currentMax >= 10100 ? currentMax + 1 : 10100);
  };

  guestInquiries.forEach((entry) => {
    const email = entry.email?.trim().toLowerCase();
    if (!email) return;
    let user = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email) as { id: string } | undefined;
    if (!user) {
      const name = entry.name?.trim() ?? "";
      const [firstName, ...rest] = name ? name.split(/\s+/) : [];
      const lastName = rest.join(" ");
      const { passwordHash, passwordSalt } = hashPassword(
        crypto.randomBytes(32).toString("hex")
      );
      const id = crypto.randomUUID();
      const customerNumber = getNextCustomerNumber();
      db.prepare(
        `
          INSERT INTO users (
            id,
            email,
            name,
            first_name,
            last_name,
            customer_number,
            role,
            password_hash,
            password_salt,
            created_at,
            updated_at,
            is_guest
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `
      ).run(
        id,
        email,
        name || null,
        firstName || null,
        lastName || null,
        customerNumber,
        "CUSTOMER",
        passwordHash,
        passwordSalt,
        entry.createdAt || now,
        now
      );
      user = { id };
    }
    db.prepare("UPDATE inquiries SET user_id = ? WHERE id = ?").run(user.id, entry.id);
  });

  const remaining = db
    .prepare("SELECT 1 FROM inquiries WHERE user_id = ? LIMIT 1")
    .get(guestUser.id);
  if (!remaining) {
    db.prepare("UPDATE users SET deleted_at = ?, is_guest = 1 WHERE id = ?").run(
      now,
      guestUser.id
    );
  }
}

const faqColumns = db
  .prepare("PRAGMA table_info(faqs)")
  .all() as Array<{ name: string }>;
if (!faqColumns.some((column) => column.name === "is_active")) {
  db.exec("ALTER TABLE faqs ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
}
