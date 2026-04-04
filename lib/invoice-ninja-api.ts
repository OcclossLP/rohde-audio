import { getInvoiceNinjaSettings } from "./invoice-ninja";

export interface InvoiceNinjaApiClientOptions {
  apiUrl: string;
  apiToken: string;
  companyKey?: string;
}

export interface InvoiceNinjaClientData {
  id?: string;
  name: string;
  contacts: Array<{
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
  }>;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_id?: string;
}

export interface InvoiceNinjaApiResponse<T = Record<string, unknown>> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface InvoiceNinjaInvoiceData {
  id?: string;
  client_id: string;
  amount: number;
  balance: number;
  status_id: number;
  number?: string;
  date?: string;
  due_date?: string;
  po_number?: string;
  public_notes?: string;
  private_notes?: string;
  terms?: string;
  footer?: string;
  tax_name1?: string;
  tax_rate1?: number;
  tax_name2?: string;
  tax_rate2?: number;
  tax_name3?: string;
  tax_rate3?: number;
  discount?: number;
  partial?: number;
  partial_due_date?: string;
  custom_value1?: string;
  custom_value2?: string;
  custom_value3?: string;
  custom_value4?: string;
  is_recurring?: boolean;
  frequency_id?: number;
  start_date?: string;
  end_date?: string;
  send_date?: string;
  line_items?: Array<{
    product_key?: string;
    notes?: string;
    cost: number;
    qty: number;
    tax_name1?: string;
    tax_rate1?: number;
    tax_name2?: string;
    tax_rate2?: number;
    tax_name3?: string;
    tax_rate3?: number;
    discount?: number;
    type_id?: number;
    custom_value1?: string;
    custom_value2?: string;
    custom_value3?: string;
    custom_value4?: string;
  }>;
}

export class InvoiceNinjaApiClient {
  private apiUrl: string;
  private apiToken: string;
  private companyKey?: string;

  constructor(options: InvoiceNinjaApiClientOptions) {
    this.apiUrl = options.apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiToken = options.apiToken;
    this.companyKey = options.companyKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'X-API-Token': this.apiToken,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (this.companyKey) {
      headers['X-API-Company-Key'] = this.companyKey;
    }

    return headers;
  }

  private async makeRequest<T = Record<string, unknown>>(endpoint: string, options: RequestInit = {}): Promise<InvoiceNinjaApiResponse<T>> {
    const url = `${this.apiUrl}/api/v1${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Invoice Ninja API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Client operations
  async createClient(clientData: InvoiceNinjaClientData): Promise<InvoiceNinjaApiResponse<{ id: string; number?: string }>> {
    return this.makeRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(clientId: string, clientData: Partial<InvoiceNinjaClientData>): Promise<InvoiceNinjaApiResponse<{ id: string; number?: string }>> {
    return this.makeRequest(`/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async getClient(clientId: string): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    return this.makeRequest(`/clients/${clientId}`);
  }

  async getClients(page: number = 1, perPage: number = 50): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    return this.makeRequest(`/clients?page=${page}&per_page=${perPage}`);
  }

  // Invoice operations
  async createInvoice(invoiceData: InvoiceNinjaInvoiceData): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    return this.makeRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoice(invoiceId: string, invoiceData: Partial<InvoiceNinjaInvoiceData>): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    return this.makeRequest(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
  }

  async getInvoice(invoiceId: string): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    return this.makeRequest(`/invoices/${invoiceId}`);
  }

  async getInvoices(clientId?: string, page: number = 1, perPage: number = 50): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    let endpoint = `/invoices?page=${page}&per_page=${perPage}`;
    if (clientId) {
      endpoint += `&client_id=${clientId}`;
    }
    return this.makeRequest(endpoint);
  }

  async sendInvoice(invoiceId: string): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    return this.makeRequest(`/invoices/${invoiceId}/send`, {
      method: 'POST',
    });
  }

  async markInvoiceSent(invoiceId: string): Promise<InvoiceNinjaApiResponse<Record<string, unknown>>> {
    return this.makeRequest(`/invoices/${invoiceId}/mark_sent`, {
      method: 'POST',
    });
  }

  // Utility methods
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/clients?page=1&per_page=1');
      return true;
    } catch (error) {
      console.error('Invoice Ninja connection test failed:', error);
      return false;
    }
  }

  static fromSettings(): InvoiceNinjaApiClient | null {
    const settings = getInvoiceNinjaSettings();
    if (!settings) {
      return null;
    }

    return new InvoiceNinjaApiClient({
      apiUrl: settings.api_url,
      apiToken: settings.api_token,
      companyKey: settings.company_key,
    });
  }
}