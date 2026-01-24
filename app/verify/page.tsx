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
               verification_sent_at as verificationSentAt
        FROM users
        WHERE id = ?
      `
    )
    .get(user.id) as { email: string; verificationSentAt: string | null } | undefined;

  if (!record) {
    redirect("/admin/login");
  }

  const cooldownSeconds = record.verificationSentAt
    ? Math.max(
        0,
        120 - Math.floor((Date.now() - new Date(record.verificationSentAt).getTime()) / 1000)
      )
    : 0;

  return <VerifyClient email={record.email} initialCooldown={cooldownSeconds} />;
}
