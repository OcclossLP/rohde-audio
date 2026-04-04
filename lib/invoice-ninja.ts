import { db } from "./db";

export interface InvoiceNinjaSettings {
  id: number;
  api_url: string;
  api_token: string;
  company_key?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceNinjaClient {
  id: string;
  user_id: string;
  invoice_ninja_id?: string;
  name: string;
  email: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_id?: string;
  sync_status: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_ninja_id?: string;
  client_id?: string;
  amount: number;
  balance: number;
  status: string;
  number?: string;
  date?: string;
  due_date?: string;
  po_number?: string;
  public_notes?: string;
  private_notes?: string;
  terms?: string;
  footer?: string;
  tax_name1?: string;
  tax_rate1: number;
  tax_name2?: string;
  tax_rate2: number;
  tax_name3?: string;
  tax_rate3: number;
  discount: number;
  partial: number;
  partial_due_date?: string;
  custom_value1?: string;
  custom_value2?: string;
  custom_value3?: string;
  custom_value4?: string;
  is_deleted: number;
  is_recurring: number;
  frequency_id?: number;
  start_date?: string;
  end_date?: string;
  last_sent_date?: string;
  next_send_date?: string;
  reminder1_sent?: string;
  reminder2_sent?: string;
  reminder3_sent?: string;
  reminder_last_sent?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_key?: string;
  notes?: string;
  cost: number;
  qty: number;
  tax_name1?: string;
  tax_rate1: number;
  tax_name2?: string;
  tax_rate2: number;
  tax_name3?: string;
  tax_rate3: number;
  discount: number;
  product_cost_id?: string;
  date?: string;
  custom_value1?: string;
  custom_value2?: string;
  custom_value3?: string;
  custom_value4?: string;
  type_id: number;
  sort_id?: number;
  line_total?: number;
  gross_line_total?: number;
  created_at: string;
  updated_at: string;
}

// Database operations
export const getInvoiceNinjaSettings = (): InvoiceNinjaSettings | null => {
  const stmt = db.prepare("SELECT * FROM invoice_ninja_settings LIMIT 1");
  return stmt.get() as InvoiceNinjaSettings | undefined || null;
};

export const saveInvoiceNinjaSettings = (settings: Omit<InvoiceNinjaSettings, 'id' | 'created_at' | 'updated_at'>) => {
  const existing = getInvoiceNinjaSettings();
  if (existing) {
    const stmt = db.prepare(`
      UPDATE invoice_ninja_settings
      SET api_url = ?, api_token = ?, company_key = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(settings.api_url, settings.api_token, settings.company_key, existing.id);
    return existing.id;
  } else {
    const stmt = db.prepare(`
      INSERT INTO invoice_ninja_settings (api_url, api_token, company_key)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(settings.api_url, settings.api_token, settings.company_key) as { lastInsertRowid: number };
    return result.lastInsertRowid;
  }
};

export const getInvoiceNinjaClient = (userId: string): InvoiceNinjaClient | null => {
  const stmt = db.prepare("SELECT * FROM invoice_ninja_clients WHERE user_id = ?");
  return stmt.get(userId) as InvoiceNinjaClient | undefined || null;
};

export const saveInvoiceNinjaClient = (client: Omit<InvoiceNinjaClient, 'created_at' | 'updated_at'>) => {
  const existing = getInvoiceNinjaClient(client.user_id);
  if (existing) {
    const stmt = db.prepare(`
      UPDATE invoice_ninja_clients
      SET invoice_ninja_id = ?, name = ?, email = ?, phone = ?, address1 = ?, address2 = ?,
          city = ?, state = ?, postal_code = ?, country_id = ?, sync_status = ?,
          last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(
      client.invoice_ninja_id, client.name, client.email, client.phone,
      client.address1, client.address2, client.city, client.state,
      client.postal_code, client.country_id, client.sync_status, client.user_id
    );
    return existing.id;
  } else {
    const stmt = db.prepare(`
      INSERT INTO invoice_ninja_clients (
        id, user_id, invoice_ninja_id, name, email, phone, address1, address2,
        city, state, postal_code, country_id, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      client.id, client.user_id, client.invoice_ninja_id, client.name, client.email,
      client.phone, client.address1, client.address2, client.city, client.state,
      client.postal_code, client.country_id, client.sync_status
    );
    return client.id;
  }
};

export const getInvoicesForUser = (userId: string): Invoice[] => {
  const stmt = db.prepare("SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC");
  return stmt.all(userId) as Invoice[];
};

export const saveInvoice = (invoice: Omit<Invoice, 'created_at' | 'updated_at'>) => {
  const existing = db.prepare("SELECT id FROM invoices WHERE invoice_ninja_id = ?").get(invoice.invoice_ninja_id) as { id: string } | undefined;

  if (existing) {
    const stmt = db.prepare(`
      UPDATE invoices SET
        client_id = ?, amount = ?, balance = ?, status = ?, number = ?, date = ?,
        due_date = ?, po_number = ?, public_notes = ?, private_notes = ?, terms = ?,
        footer = ?, tax_name1 = ?, tax_rate1 = ?, tax_name2 = ?, tax_rate2 = ?,
        tax_name3 = ?, tax_rate3 = ?, discount = ?, partial = ?, partial_due_date = ?,
        custom_value1 = ?, custom_value2 = ?, custom_value3 = ?, custom_value4 = ?,
        is_deleted = ?, is_recurring = ?, frequency_id = ?, start_date = ?, end_date = ?,
        last_sent_date = ?, next_send_date = ?, reminder1_sent = ?, reminder2_sent = ?,
        reminder3_sent = ?, reminder_last_sent = ?, updated_at = CURRENT_TIMESTAMP
      WHERE invoice_ninja_id = ?
    `);
    stmt.run(
      invoice.client_id, invoice.amount, invoice.balance, invoice.status, invoice.number,
      invoice.date, invoice.due_date, invoice.po_number, invoice.public_notes,
      invoice.private_notes, invoice.terms, invoice.footer, invoice.tax_name1,
      invoice.tax_rate1, invoice.tax_name2, invoice.tax_rate2, invoice.tax_name3,
      invoice.tax_rate3, invoice.discount, invoice.partial, invoice.partial_due_date,
      invoice.custom_value1, invoice.custom_value2, invoice.custom_value3,
      invoice.custom_value4, invoice.is_deleted, invoice.is_recurring, invoice.frequency_id,
      invoice.start_date, invoice.end_date, invoice.last_sent_date, invoice.next_send_date,
      invoice.reminder1_sent, invoice.reminder2_sent, invoice.reminder3_sent,
      invoice.reminder_last_sent, invoice.invoice_ninja_id
    );
    return existing.id;
  } else {
    const stmt = db.prepare(`
      INSERT INTO invoices (
        id, user_id, invoice_ninja_id, client_id, amount, balance, status, number,
        date, due_date, po_number, public_notes, private_notes, terms, footer,
        tax_name1, tax_rate1, tax_name2, tax_rate2, tax_name3, tax_rate3, discount,
        partial, partial_due_date, custom_value1, custom_value2, custom_value3,
        custom_value4, is_deleted, is_recurring, frequency_id, start_date, end_date,
        last_sent_date, next_send_date, reminder1_sent, reminder2_sent, reminder3_sent,
        reminder_last_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      invoice.id, invoice.user_id, invoice.invoice_ninja_id, invoice.client_id,
      invoice.amount, invoice.balance, invoice.status, invoice.number, invoice.date,
      invoice.due_date, invoice.po_number, invoice.public_notes, invoice.private_notes,
      invoice.terms, invoice.footer, invoice.tax_name1, invoice.tax_rate1,
      invoice.tax_name2, invoice.tax_rate2, invoice.tax_name3, invoice.tax_rate3,
      invoice.discount, invoice.partial, invoice.partial_due_date, invoice.custom_value1,
      invoice.custom_value2, invoice.custom_value3, invoice.custom_value4,
      invoice.is_deleted, invoice.is_recurring, invoice.frequency_id, invoice.start_date,
      invoice.end_date, invoice.last_sent_date, invoice.next_send_date,
      invoice.reminder1_sent, invoice.reminder2_sent, invoice.reminder3_sent,
      invoice.reminder_last_sent
    );
    return invoice.id;
  }
};