import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getKeycloakUsers } from "@/lib/keycloak";

export async function GET() {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await getKeycloakUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching Keycloak users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
