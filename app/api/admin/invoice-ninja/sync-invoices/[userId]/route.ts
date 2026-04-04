import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { InvoiceNinjaSync } from "@/lib/invoice-ninja-sync";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({
        error: "User ID ist erforderlich"
      }, { status: 400 });
    }

    const sync = InvoiceNinjaSync.fromSettings();
    if (!sync) {
      return NextResponse.json({
        error: "Invoice Ninja ist nicht konfiguriert"
      }, { status: 400 });
    }

    const result = await sync.syncInvoicesForCustomer(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Invoice Ninja invoice sync error:", error);
    return NextResponse.json({
      success: false,
      message: "Rechnungssynchronisation fehlgeschlagen",
      error: error instanceof Error ? error.message : "Unbekannter Fehler"
    }, { status: 500 });
  }
}