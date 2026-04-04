import crypto from "crypto";
import { db } from "./db";
import { hashPassword } from "./password";
import { InvoiceNinjaSync } from "./invoice-ninja-sync";

const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER?.replace(/\/+$/, "") ?? "";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM ?? "rohde-audio";
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? "";
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET ?? "";
const KEYCLOAK_REDIRECT_URI =
  process.env.KEYCLOAK_REDIRECT_URI ??
  `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000"}/api/auth/keycloak/callback`;

function getRealmUrl() {
  return `${KEYCLOAK_ISSUER}/realms/${KEYCLOAK_REALM}`;
}

export function getKeycloakAuthUrl(state: string) {
  const authUrl = `${getRealmUrl()}/protocol/openid-connect/auth`;
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: KEYCLOAK_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "login",
  });
  return `${authUrl}?${params.toString()}`;
}

export async function exchangeKeycloakCode(code: string) {
  const tokenUrl = `${getRealmUrl()}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KEYCLOAK_CLIENT_ID,
    client_secret: KEYCLOAK_CLIENT_SECRET,
    code,
    redirect_uri: KEYCLOAK_REDIRECT_URI,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Keycloak token exchange failed: ${response.status}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
  };
}

export async function fetchKeycloakUserinfo(accessToken: string) {
  const userinfoUrl = `${getRealmUrl()}/protocol/openid-connect/userinfo`;
  const response = await fetch(userinfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Keycloak userinfo request failed: ${response.status}`);
  }

  return (await response.json()) as {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    phone_number?: string;
    email_verified?: boolean;
  };
}

export async function findOrCreateKeycloakUser(profile: {
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  phone_number?: string;
  email_verified?: boolean;
}) {
  const normalizedEmail = profile.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const randomPassword = crypto.randomBytes(24).toString("hex");
  const { passwordHash, passwordSalt } = hashPassword(randomPassword);
  const name = profile.name ?? `${profile.given_name ?? ""} ${profile.family_name ?? ""}`.trim();
  const firstName = profile.given_name ?? name.split(" ")[0] ?? "";
  const lastName = profile.family_name ?? name.split(" ").slice(1).join(" ") ?? "";
  const verifiedAt = profile.email_verified ? now : null;

  const existing = db.prepare(
    "SELECT id, role, deleted_at as deletedAt FROM users WHERE email = ?"
  ).get(normalizedEmail) as { id: string; role: string; deletedAt: string | null } | undefined;

  if (existing) {
    db.prepare(
      `
        UPDATE users
        SET name = ?,
            first_name = ?,
            last_name = ?,
            phone = ?,
            role = CASE WHEN role = 'ADMIN' THEN 'ADMIN' ELSE 'CUSTOMER' END,
            password_hash = ?,
            password_salt = ?,
            email_verified_at = COALESCE(email_verified_at, ?),
            updated_at = ?,
            deleted_at = NULL,
            is_guest = 0
        WHERE id = ?
      `
    ).run(
      name,
      firstName,
      lastName,
      profile.phone_number ?? null,
      passwordHash,
      passwordSalt,
      verifiedAt,
      now,
      existing.id
    );

    await syncCustomerToInvoiceNinja(existing.id, normalizedEmail, firstName, lastName, profile.phone_number);

    return { id: existing.id, role: existing.role, verified: Boolean(verifiedAt) };
  }

  const id = crypto.randomUUID();
  db.prepare(
    `
      INSERT INTO users (
        id,
        email,
        phone,
        customer_number,
        name,
        first_name,
        last_name,
        role,
        password_hash,
        password_salt,
        email_verified_at,
        created_at,
        updated_at,
        is_guest
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `
  ).run(
    id,
    normalizedEmail,
    profile.phone_number ?? null,
    null,
    name,
    firstName,
    lastName,
    "CUSTOMER",
    passwordHash,
    passwordSalt,
    verifiedAt,
    now,
    now
  );

  await syncCustomerToInvoiceNinja(id, normalizedEmail, firstName, lastName, profile.phone_number);
  return { id, role: "CUSTOMER", verified: Boolean(verifiedAt) };
}

async function syncCustomerToInvoiceNinja(
  id: string,
  email: string,
  first_name: string,
  last_name: string,
  phone?: string
) {
  try {
    const sync = InvoiceNinjaSync.fromSettings();
    if (!sync) return;
    await sync.syncCustomer({
      id,
      email,
      first_name,
      last_name,
      phone: phone || undefined,
    });
  } catch (error) {
    console.error("Invoice Ninja Sync fehlgeschlagen für Keycloak-User:", error);
  }
}

// Admin API Token für User-Management
export async function getKeycloakAdminToken() {
  if (!KEYCLOAK_ISSUER) {
    throw new Error("KEYCLOAK_ISSUER ist nicht gesetzt.");
  }

  const adminUser = process.env.KEYCLOAK_ADMIN_USER ?? "admin";
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD ?? "";
  if (!adminPassword) {
    throw new Error("KEYCLOAK_ADMIN_PASSWORD ist nicht gesetzt.");
  }

  const tokenUrl = `${KEYCLOAK_ISSUER}/realms/master/protocol/openid-connect/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: "admin-cli",
      username: adminUser,
      password: adminPassword,
    }).toString(),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        error?: string;
        error_description?: string;
      }
    | null;

  if (!response.ok) {
    const detail = data?.error_description || data?.error || "Unbekannter Fehler";
    throw new Error(`Keycloak Admin-Token fehlgeschlagen (${response.status}): ${detail}`);
  }

  if (!data?.access_token) {
    throw new Error("Keycloak hat kein access_token zurückgegeben.");
  }

  return data.access_token;
}

// User aus lokaler DB mit Keycloak-Status laden
export async function getKeycloakUsers() {
  const users = db.prepare(`
    SELECT
      u.id,
      u.email,
      u.name,
      u.first_name,
      u.last_name,
      u.customer_number,
      u.role,
      u.created_at,
      u.keycloak_id,
      u.keycloak_status,
      u.keycloak_last_sync
    FROM users u
    WHERE u.deleted_at IS NULL
    ORDER BY u.created_at DESC
  `).all() as any[];

  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.first_name,
    lastName: user.last_name,
    customerNumber: user.customer_number,
    role: user.role,
    createdAt: user.created_at,
    keycloakId: user.keycloak_id,
    keycloakStatus: user.keycloak_status || "none",
    lastKeycloakSync: user.keycloak_last_sync,
  }));
}

// Einzelnen User zu Keycloak synchronisieren
type SyncUserToKeycloakOptions = {
  password?: string;
  temporaryPassword?: boolean;
};

async function setKeycloakUserPassword(
  adminToken: string,
  keycloakUserId: string,
  password: string,
  temporary = false
) {
  const response = await fetch(
    `${KEYCLOAK_ISSUER}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/reset-password`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "password",
        value: password,
        temporary,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to set Keycloak password (${response.status}): ${errorText || "Unknown error"}`
    );
  }
}

export async function syncUserToKeycloak(
  userId: string,
  options: SyncUserToKeycloakOptions = {}
) {
  try {
    const password = typeof options.password === "string" ? options.password : undefined;
    const temporaryPassword = Boolean(options.temporaryPassword);

    const user = db.prepare(`
      SELECT id, email, name, first_name, last_name, phone, role
      FROM users
      WHERE id = ? AND deleted_at IS NULL
    `).get(userId) as any;

    if (!user) {
      throw new Error("User not found");
    }

    const adminToken = await getKeycloakAdminToken();

    // Prüfen ob User bereits in Keycloak existiert
    const existingResponse = await fetch(
      `${KEYCLOAK_ISSUER}/admin/realms/${KEYCLOAK_REALM}/users?email=${encodeURIComponent(user.email)}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (!existingResponse.ok) {
      throw new Error("Failed to check existing user");
    }

    const existingUsers = await existingResponse.json();

    let keycloakUserId: string;
    let keycloakStatus: "synced" | "imported" = "synced";

    if (existingUsers.length > 0) {
      // User existiert bereits - aktualisieren
      keycloakUserId = existingUsers[0].id;

      const updateResponse = await fetch(
        `${KEYCLOAK_ISSUER}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            enabled: true,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text().catch(() => "");
        throw new Error(
          `Failed to update user (${updateResponse.status}): ${errorText || "Unknown error"}`
        );
      }

      if (password) {
        await setKeycloakUserPassword(
          adminToken,
          keycloakUserId,
          password,
          temporaryPassword
        );
      }
    } else {
      // Neuen User erstellen
      const generatedPassword = crypto.randomBytes(16).toString("hex");
      const createResponse = await fetch(
        `${KEYCLOAK_ISSUER}/admin/realms/${KEYCLOAK_REALM}/users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: user.email,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            enabled: true,
            emailVerified: true,
            credentials: [
              {
                type: "password",
                value: password || generatedPassword,
                temporary: password ? temporaryPassword : true,
              },
            ],
          }),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text().catch(() => "");
        throw new Error(
          `Failed to create user (${createResponse.status}): ${errorText || "Unknown error"}`
        );
      }

      // User-ID aus Location-Header extrahieren
      const location = createResponse.headers.get("Location");
      if (!location) {
        throw new Error("No location header");
      }
      keycloakUserId = location.split("/").pop()!;

      if (!password) {
        keycloakStatus = "imported";
      }
    }

    // Lokale DB aktualisieren
    db.prepare(`
      UPDATE users
      SET keycloak_id = ?, keycloak_status = ?, keycloak_last_sync = ?
      WHERE id = ?
    `).run(keycloakUserId, keycloakStatus, new Date().toISOString(), userId);

    return { success: true, keycloakId: keycloakUserId, keycloakStatus };
  } catch (error) {
    console.error("Error syncing user to Keycloak:", error);

    // Status auf Fehler setzen
    db.prepare(`
      UPDATE users
      SET keycloak_status = 'error', keycloak_last_sync = ?
      WHERE id = ?
    `).run(new Date().toISOString(), userId);

    throw error;
  }
}

// Alle User bulk-importieren
export async function bulkImportUsersToKeycloak() {
  const users = db.prepare(`
    SELECT id FROM users
    WHERE deleted_at IS NULL AND (keycloak_status IS NULL OR keycloak_status = 'none')
  `).all() as { id: string }[];

  const results: Array<{
    userId: string;
    success: boolean;
    keycloakId?: string;
    error?: string;
  }> = [];
  for (const user of users) {
    try {
      const result = await syncUserToKeycloak(user.id);
      results.push({ userId: user.id, success: true, keycloakId: result.keycloakId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({ userId: user.id, success: false, error: message });
    }
  }

  return {
    total: users.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}

// Admin API functions for creating users programmatically

export async function createKeycloakUser(userData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;
}) {
  const adminToken = await getKeycloakAdminToken();
  const userUrl = `${KEYCLOAK_ISSUER}/admin/realms/${KEYCLOAK_REALM}/users`;
  const existingResponse = await fetch(
    `${userUrl}?email=${encodeURIComponent(userData.email)}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  if (!existingResponse.ok) {
    const errorText = await existingResponse.text().catch(() => "");
    throw new Error(
      `Keycloak user lookup failed (${existingResponse.status}): ${errorText || "Unknown error"}`
    );
  }
  const existingUsers = (await existingResponse.json().catch(() => [])) as Array<{
    id: string;
  }>;

  const userPayload = {
    username: userData.email,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    attributes: {
      phone: userData.phone ? [userData.phone] : [],
    },
    emailVerified: true,
    enabled: true,
    credentials: userData.password
      ? [
          {
            type: "password",
            value: userData.password,
            temporary: false,
          },
        ]
      : [],
  };

  if (existingUsers.length > 0) {
    const existingUserId = existingUsers[0].id;
    const updateResponse = await fetch(`${userUrl}/${existingUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(userPayload),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text().catch(() => "");
      throw new Error(
        `Keycloak user update failed (${updateResponse.status}): ${errorText || "Unknown error"}`
      );
    }

    if (userData.password) {
      await setKeycloakUserPassword(
        adminToken,
        existingUserId,
        userData.password,
        false
      );
    }

    return existingUserId;
  }

  const response = await fetch(userUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(userPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Keycloak user creation failed: ${response.status} - ${errorText}`);
  }

  // User wurde erstellt, jetzt ID zurückgeben
  const location = response.headers.get("Location");
  if (location) {
    const userId = location.split("/").pop();
    return userId;
  }

  return null;
}
