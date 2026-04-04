'use client';

import { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  date: string | null;
  dueDate: string | null;
  createdAt: string;
  downloadUrl: string;
  viewUrl: string;
}

export default function AccountInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/account/invoices');
      const data = await response.json();

      if (response.ok) {
        setInvoices(data.invoices);
      } else {
        setError(data.error || 'Fehler beim Laden der Rechnungen');
      }
    } catch (err) {
      setError('Netzwerkfehler beim Laden der Rechnungen');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400';
      case 'sent': return 'text-blue-400';
      case 'viewed': return 'text-green-400';
      case 'approved': return 'text-green-600';
      case 'partial': return 'text-yellow-400';
      case 'paid': return 'text-green-600';
      case 'cancelled': return 'text-red-400';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Entwurf',
      sent: 'Gesendet',
      viewed: 'Angesehen',
      approved: 'Genehmigt',
      partial: 'Teilweise bezahlt',
      paid: 'Bezahlt',
      cancelled: 'Storniert',
      overdue: 'Überfällig'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Lade Rechnungen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-400">
          Fehler: {error}
          <button
            onClick={loadInvoices}
            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Meine Rechnungen</h1>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Keine Rechnungen gefunden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Rechnung {invoice.number}</h3>
                  <p className="text-gray-400">
                    Erstellt: {new Date(invoice.createdAt).toLocaleDateString('de-DE')}
                  </p>
                  {invoice.dueDate && (
                    <p className="text-gray-400">
                      Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-2">
                    €{invoice.amount.toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={invoice.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Ansehen
                </a>
                <a
                  href={invoice.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Herunterladen
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}