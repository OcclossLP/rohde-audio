import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncUserToKeycloak } from "@/lib/keycloak";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const result = await syncUserToKeycloak(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing user to Keycloak:", error);
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler beim Synchronisieren.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
