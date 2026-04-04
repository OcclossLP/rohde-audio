import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getInvoicesForUser } from "@/lib/invoice-ninja";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = getInvoicesForUser(user.id);

    // Formatiere die Rechnungen für die Frontend-Darstellung
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount,
      balance: invoice.balance,
      status: invoice.status,
      date: invoice.date,
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      // URL zum PDF-Download würde hier hinzugefügt werden
      downloadUrl: `/api/account/invoices/${invoice.id}/download`,
      // URL zur Online-Ansicht
      viewUrl: `/api/account/invoices/${invoice.id}/view`,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      total: formattedInvoices.length,
    });
  } catch (error) {
    console.error("Account invoices error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}