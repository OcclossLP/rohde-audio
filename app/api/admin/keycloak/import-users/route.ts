import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bulkImportUsersToKeycloak } from "@/lib/keycloak";

export async function POST() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await bulkImportUsersToKeycloak();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error bulk importing users to Keycloak:", error);
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler beim Bulk-Import.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
