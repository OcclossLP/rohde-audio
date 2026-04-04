import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  if (user.emailVerifiedAt) {
    redirect("/account");
  }

  const record = db
    .prepare(
      `
        SELECT email,
               CASE
                 WHEN verification_sent_at IS NULL THEN 0
                 ELSE MAX(
                   0,
                   120 - CAST(strftime('%s', 'now') - strftime('%s', verification_sent_at) AS INTEGER)
                 )
               END as cooldownSeconds
        FROM users
        WHERE id = ?
      `
    )
    .get(user.id) as { email: string; cooldownSeconds: number | null } | undefined;

  if (!record) {
    redirect("/admin/login");
  }

  return <VerifyClient email={record.email} initialCooldown={record.cooldownSeconds ?? 0} />;
}
