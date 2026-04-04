import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { InvoiceNinjaSync } from "@/lib/invoice-ninja-sync";

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const sync = InvoiceNinjaSync.fromSettings();
    if (!sync) {
      return NextResponse.json({
        error: "Invoice Ninja ist nicht konfiguriert"
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'sync-customers':
        result = await sync.syncAllCustomers();
        break;

      case 'sync-invoices':
        // Für alle Kunden Rechnungen synchronisieren wäre zu viel,
        // besser einzeln pro Kunde machen
        return NextResponse.json({
          error: "Verwende /api/admin/invoice-ninja/sync-invoices/[userId] für einzelne Kunden"
        }, { status: 400 });

      default:
        return NextResponse.json({
          error: "Unbekannte Aktion. Verwende 'sync-customers'"
        }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Invoice Ninja sync error:", error);
    return NextResponse.json({
      success: false,
      message: "Synchronisation fehlgeschlagen",
      error: error instanceof Error ? error.message : "Unbekannter Fehler"
    }, { status: 500 });
  }
}