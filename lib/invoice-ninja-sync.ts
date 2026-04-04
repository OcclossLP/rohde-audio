import { db } from "./db";
import { InvoiceNinjaApiClient, InvoiceNinjaClientData } from "./invoice-ninja-api";
import { getInvoiceNinjaClient, saveInvoiceNinjaClient, saveInvoice } from "./invoice-ninja";

export interface SyncResult {
  success: boolean;
  message: string;
  syncedClients: number;
  syncedInvoices: number;
  errors: string[];
}

export class InvoiceNinjaSync {
  private apiClient: InvoiceNinjaApiClient;

  constructor(apiClient: InvoiceNinjaApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Synchronisiert alle Kundendaten von der Website zu Invoice Ninja
   */
  async syncAllCustomers(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      message: "",
      syncedClients: 0,
      syncedInvoices: 0,
      errors: [],
    };

    try {
      // Hole alle Kunden aus der lokalen Datenbank
      const customers = db.prepare(`
        SELECT id, email, first_name, last_name, phone, street, house_number,
               address_extra, postal_code, city
        FROM users
        WHERE role = 'CUSTOMER' AND deleted_at IS NULL
      `).all() as Array<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        phone?: string;
        street?: string;
        house_number?: string;
        address_extra?: string;
        postal_code?: string;
        city?: string;
      }>;

      for (const customer of customers) {
        try {
          await this.syncCustomer(customer);
          result.syncedClients++;
        } catch (error) {
          result.errors.push(`Fehler bei Kunde ${customer.email}: ${error}`);
        }
      }

      result.message = `${result.syncedClients} Kunden synchronisiert`;
      if (result.errors.length > 0) {
        result.message += `, ${result.errors.length} Fehler`;
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.message = `Synchronisation fehlgeschlagen: ${error}`;
    }

    return result;
  }

  /**
   * Synchronisiert einen einzelnen Kunden mit konsistenter Kundennummer
   */
  async syncCustomer(customer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    street?: string;
    house_number?: string;
    address_extra?: string;
    postal_code?: string;
    city?: string;
  }): Promise<{ invoice_ninja_id: string; customer_number?: string } | null> {
    // Prüfe, ob der Kunde bereits in Invoice Ninja existiert
    const invoiceNinjaClient = getInvoiceNinjaClient(customer.id);

    const clientData: InvoiceNinjaClientData = {
      name: `${customer.first_name} ${customer.last_name}`.trim(),
      contacts: [{
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone || undefined,
      }],
      address1: customer.street ? `${customer.street} ${customer.house_number || ''}`.trim() : undefined,
      address2: customer.address_extra || undefined,
      city: customer.city || undefined,
      postal_code: customer.postal_code || undefined,
      country_id: '276', // Deutschland
    };

    let invoiceNinjaResponse;

    if (invoiceNinjaClient?.invoice_ninja_id) {
      // Update existing client
      invoiceNinjaResponse = await this.apiClient.updateClient(
        invoiceNinjaClient.invoice_ninja_id,
        clientData
      );
    } else {
      // Create new client
      invoiceNinjaResponse = await this.apiClient.createClient(clientData);
    }

    // Speichere die Invoice Ninja ID lokal
    const clientRecord = {
      id: customer.id,
      user_id: customer.id,
      invoice_ninja_id: invoiceNinjaResponse.data.id,
      name: clientData.name,
      email: customer.email,
      phone: customer.phone,
      address1: clientData.address1,
      address2: clientData.address2,
      city: clientData.city,
      postal_code: clientData.postal_code,
      country_id: clientData.country_id,
      sync_status: 'synced',
    };

    saveInvoiceNinjaClient(clientRecord);

    // Invoice Ninja vergibt hier die Kundennummer (number), also in der Web-App übernehmen
    const customerNumber = invoiceNinjaResponse?.data?.number ?? null;
    if (customerNumber) {
      db.prepare("UPDATE users SET customer_number = ? WHERE id = ?").run(customerNumber, customer.id);
    }

    return {
      invoice_ninja_id: invoiceNinjaResponse.data.id,
      customer_number: customerNumber || undefined,
    };
  }

  /**
   * Synchronisiert Rechnungen für einen bestimmten Kunden
   */
  async syncInvoicesForCustomer(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      message: "",
      syncedClients: 0,
      syncedInvoices: 0,
      errors: [],
    };

    try {
      const invoiceNinjaClient = getInvoiceNinjaClient(userId);
      if (!invoiceNinjaClient?.invoice_ninja_id) {
        throw new Error('Kunde ist nicht mit Invoice Ninja synchronisiert');
      }

      // Hole alle Rechnungen für diesen Kunden aus Invoice Ninja
      const invoicesResponse = await this.apiClient.getInvoices(invoiceNinjaClient.invoice_ninja_id);

      // Invoice Ninja API returns { data: Invoice[] }
      const invoices = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [invoicesResponse.data];

      for (const invoiceData of invoices) {
        try {
          const invoiceRecord = {
            id: invoiceData.id,
            user_id: userId,
            invoice_ninja_id: invoiceData.id,
            client_id: invoiceNinjaClient.id,
            amount: parseFloat(invoiceData.amount) || 0,
            balance: parseFloat(invoiceData.balance) || 0,
            status: this.mapInvoiceStatus(invoiceData.status_id),
            number: invoiceData.number,
            date: invoiceData.date,
            due_date: invoiceData.due_date,
            po_number: invoiceData.po_number,
            public_notes: invoiceData.public_notes,
            private_notes: invoiceData.private_notes,
            terms: invoiceData.terms,
            footer: invoiceData.footer,
            tax_name1: invoiceData.tax_name1,
            tax_rate1: parseFloat(invoiceData.tax_rate1) || 0,
            tax_name2: invoiceData.tax_name2,
            tax_rate2: parseFloat(invoiceData.tax_rate2) || 0,
            tax_name3: invoiceData.tax_name3,
            tax_rate3: parseFloat(invoiceData.tax_rate3) || 0,
            discount: parseFloat(invoiceData.discount) || 0,
            partial: parseFloat(invoiceData.partial) || 0,
            partial_due_date: invoiceData.partial_due_date,
            custom_value1: invoiceData.custom_value1,
            custom_value2: invoiceData.custom_value2,
            custom_value3: invoiceData.custom_value3,
            custom_value4: invoiceData.custom_value4,
            is_deleted: invoiceData.is_deleted ? 1 : 0,
            is_recurring: invoiceData.is_recurring ? 1 : 0,
            frequency_id: invoiceData.frequency_id,
            start_date: invoiceData.start_date,
            end_date: invoiceData.end_date,
            last_sent_date: invoiceData.last_sent_date,
            next_send_date: invoiceData.next_send_date,
            reminder1_sent: invoiceData.reminder1_sent,
            reminder2_sent: invoiceData.reminder2_sent,
            reminder3_sent: invoiceData.reminder3_sent,
            reminder_last_sent: invoiceData.reminder_last_sent,
          };

          saveInvoice(invoiceRecord);
          result.syncedInvoices++;
        } catch (error) {
          result.errors.push(`Fehler bei Rechnung ${invoiceData.number}: ${error}`);
        }
      }

      result.message = `${result.syncedInvoices} Rechnungen synchronisiert`;
      if (result.errors.length > 0) {
        result.message += `, ${result.errors.length} Fehler`;
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.message = `Rechnungssynchronisation fehlgeschlagen: ${error}`;
    }

    return result;
  }

  /**
   * Mapped Invoice Ninja Status IDs zu lesbaren Status
   */
  private mapInvoiceStatus(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: 'draft',
      2: 'sent',
      3: 'viewed',
      4: 'approved',
      5: 'partial',
      6: 'paid',
      7: 'cancelled',
      8: 'overdue',
      9: 'unpaid',
    };
    return statusMap[statusId] || 'unknown';
  }

  /**
   * Testet die Verbindung zu Invoice Ninja
   */
  async testConnection(): Promise<boolean> {
    return this.apiClient.testConnection();
  }

  /**
   * Erstellt eine Rechnung mit konsistenter Auftragsnummer
   */
  async createInvoiceForPackage(userId: string, packageData: {
    title: string;
    description: string;
    price: string;
  }): Promise<{ id: string; number?: string }> {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    } | undefined;
    if (!user) throw new Error('User not found');

    const invoiceNinjaClient = getInvoiceNinjaClient(userId);
    if (!invoiceNinjaClient?.invoice_ninja_id) {
      throw new Error('User must be synced to Invoice Ninja first');
    }

    // Erstelle eine konsistente Auftragsnummer
    // Format: ROH-{YYYY}-{Sequential Number}
    const currentYear = new Date().getFullYear();
    const lastInvoice = db.prepare(`
      SELECT number FROM invoices
      WHERE number LIKE ?
      ORDER BY created_at DESC LIMIT 1
    `).get(`ROH-${currentYear}-%`) as { number: string } | undefined;

    let sequentialNumber = 1;
    if (lastInvoice?.number) {
      const match = lastInvoice.number.match(/ROH-\d{4}-(\d+)/);
      if (match) {
        sequentialNumber = parseInt(match[1]) + 1;
      }
    }

    const invoiceNumber = `ROH-${currentYear}-${sequentialNumber.toString().padStart(4, '0')}`;

    const invoiceData = {
      client_id: invoiceNinjaClient.invoice_ninja_id,
      number: invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 Tage
      amount: parseFloat(packageData.price),
      balance: parseFloat(packageData.price),
      status_id: 1, // Draft
      items: [{
        product_key: packageData.title,
        notes: packageData.description,
        cost: parseFloat(packageData.price),
        qty: 1,
      }],
    };

    const invoiceResponse = await this.apiClient.createInvoice(invoiceData) as {
      data: { id: string; number?: string };
    };

    // Speichere die Rechnung lokal
    saveInvoice({
      id: invoiceResponse.data.id,
      user_id: userId,
      invoice_ninja_id: invoiceResponse.data.id,
      client_id: invoiceNinjaClient.id,
      amount: parseFloat(packageData.price),
      balance: parseFloat(packageData.price),
      status: 'sent',
      number: invoiceNumber,
      date: invoiceData.date,
      due_date: invoiceData.due_date,
      tax_rate1: 0,
      tax_rate2: 0,
      tax_rate3: 0,
      discount: 0,
      partial: 0,
      partial_due_date: undefined,
      is_deleted: 0,
      is_recurring: 0,
    });

    return invoiceResponse.data;
  }

  /**
   * Factory method um Sync-Instanz aus Settings zu erstellen
   */
  static fromSettings(): InvoiceNinjaSync | null {
    const apiClient = InvoiceNinjaApiClient.fromSettings();
    if (!apiClient) {
      return null;
    }
    return new InvoiceNinjaSync(apiClient);
  }
}