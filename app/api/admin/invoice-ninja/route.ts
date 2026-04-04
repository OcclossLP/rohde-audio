import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveInvoiceNinjaSettings, getInvoiceNinjaSettings } from "@/lib/invoice-ninja";
import { InvoiceNinjaSync } from "@/lib/invoice-ninja-sync";

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = getInvoiceNinjaSettings();
    if (!settings) {
      return NextResponse.json({
        configured: false,
        message: "Invoice Ninja ist noch nicht konfiguriert"
      });
    }

    // Test connection
    const sync = InvoiceNinjaSync.fromSettings();
    const connectionTest = sync ? await sync.testConnection() : false;

    return NextResponse.json({
      configured: true,
      connection: connectionTest,
      settings: {
        api_url: settings.api_url,
        has_token: !!settings.api_token,
        company_key: settings.company_key,
        created_at: settings.created_at,
        updated_at: settings.updated_at,
      }
    });
  } catch (error) {
    console.error("Invoice Ninja settings error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiUrl, apiToken, companyKey } = body;

    if (!apiUrl || !apiToken) {
      return NextResponse.json({
        error: "API URL und API Token sind erforderlich"
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(apiUrl);
    } catch {
      return NextResponse.json({
        error: "Ungültige API URL"
      }, { status: 400 });
    }

    // Save settings
    saveInvoiceNinjaSettings({
      api_url: apiUrl,
      api_token: apiToken,
      company_key: companyKey || undefined,
    });

    // Test connection
    const sync = InvoiceNinjaSync.fromSettings();
    const connectionTest = sync ? await sync.testConnection() : false;

    return NextResponse.json({
      success: true,
      configured: true,
      connection: connectionTest,
      message: connectionTest
        ? "Invoice Ninja erfolgreich konfiguriert und verbunden"
        : "Invoice Ninja konfiguriert, aber Verbindung fehlgeschlagen"
    });
  } catch (error) {
    console.error("Invoice Ninja setup error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}