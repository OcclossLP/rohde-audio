import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { InvoiceNinjaSync } from "@/lib/invoice-ninja-sync";

export async function POST() {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sync = InvoiceNinjaSync.fromSettings();
    if (!sync) {
      return NextResponse.json({
        error: "Invoice Ninja ist nicht konfiguriert"
      }, { status: 500 });
    }

    const result = await sync.syncAllCustomers();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      syncedClients: result.syncedClients,
      errors: result.errors,
    });

  } catch (error) {
    console.error("Kunden-Sync fehlgeschlagen:", error);
    return NextResponse.json({
      error: "Kunden-Synchronisation fehlgeschlagen"
    }, { status: 500 });
  }
}