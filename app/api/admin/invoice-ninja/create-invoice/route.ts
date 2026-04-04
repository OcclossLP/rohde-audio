import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { InvoiceNinjaSync } from "@/lib/invoice-ninja-sync";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, packageId } = body;

    if (!userId || !packageId) {
      return NextResponse.json({
        error: "userId und packageId sind erforderlich"
      }, { status: 400 });
    }

    // Hole Paketdaten
    const packageData = db.prepare('SELECT * FROM packages WHERE id = ?').get(packageId) as {
      id: string;
      title: string;
      description: string;
      price: string;
    };
    if (!packageData) {
      return NextResponse.json({ error: "Paket nicht gefunden" }, { status: 404 });
    }

    // Erstelle Sync-Instanz
    const sync = InvoiceNinjaSync.fromSettings();
    if (!sync) {
      return NextResponse.json({
        error: "Invoice Ninja ist nicht konfiguriert"
      }, { status: 500 });
    }

    // Erstelle Rechnung
    const invoice = await sync.createInvoiceForPackage(userId, packageData);

    return NextResponse.json({
      success: true,
      message: "Rechnung erfolgreich erstellt",
      invoice: {
        id: invoice.id,
        number: invoice.number,
        amount: parseFloat(packageData.price), // Use package price as amount
        status: 'draft',
      }
    });

  } catch (error) {
    console.error("Rechnungserstellung fehlgeschlagen:", error);
    const errorMessage = error instanceof Error ? error.message : "Rechnungserstellung fehlgeschlagen";
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}