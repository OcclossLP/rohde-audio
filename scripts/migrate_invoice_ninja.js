import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_PATH || "./data/app.db";
const resolvedPath = path.resolve(dbPath);

const db = new Database(resolvedPath);

// Invoice Ninja Integration Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS invoice_ninja_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_url TEXT NOT NULL,
    api_token TEXT NOT NULL,
    company_key TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoice_ninja_clients (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    invoice_ninja_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address1 TEXT,
    address2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country_id TEXT,
    sync_status TEXT DEFAULT 'pending',
    last_sync_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    invoice_ninja_id TEXT UNIQUE,
    client_id TEXT,
    amount REAL NOT NULL,
    balance REAL DEFAULT 0,
    status TEXT NOT NULL,
    number TEXT,
    date TEXT,
    due_date TEXT,
    po_number TEXT,
    public_notes TEXT,
    private_notes TEXT,
    terms TEXT,
    footer TEXT,
    tax_name1 TEXT,
    tax_rate1 REAL DEFAULT 0,
    tax_name2 TEXT,
    tax_rate2 REAL DEFAULT 0,
    tax_name3 TEXT,
    tax_rate3 REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    partial REAL DEFAULT 0,
    partial_due_date TEXT,
    custom_value1 TEXT,
    custom_value2 TEXT,
    custom_value3 TEXT,
    custom_value4 TEXT,
    is_deleted INTEGER DEFAULT 0,
    is_recurring INTEGER DEFAULT 0,
    frequency_id INTEGER,
    start_date TEXT,
    end_date TEXT,
    last_sent_date TEXT,
    next_send_date TEXT,
    reminder1_sent TEXT,
    reminder2_sent TEXT,
    reminder3_sent TEXT,
    reminder_last_sent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES invoice_ninja_clients(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    product_key TEXT,
    notes TEXT,
    cost REAL NOT NULL,
    qty REAL NOT NULL DEFAULT 1,
    tax_name1 TEXT,
    tax_rate1 REAL DEFAULT 0,
    tax_name2 TEXT,
    tax_rate2 REAL DEFAULT 0,
    tax_name3 TEXT,
    tax_rate3 REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    product_cost_id TEXT,
    date TEXT,
    custom_value1 TEXT,
    custom_value2 TEXT,
    custom_value3 TEXT,
    custom_value4 TEXT,
    type_id INTEGER DEFAULT 1,
    sort_id INTEGER,
    line_total REAL,
    gross_line_total REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_invoice_ninja_clients_user_id ON invoice_ninja_clients(user_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_ninja_clients_invoice_ninja_id ON invoice_ninja_clients(invoice_ninja_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_invoice_ninja_id ON invoices(invoice_ninja_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
`);

console.log("Invoice Ninja database tables created successfully");
db.close();