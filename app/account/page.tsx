import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  if (!user.emailVerifiedAt) {
    redirect("/verify");
  }

  const profile = db
    .prepare(
      `
        SELECT first_name as firstName,
               last_name as lastName,
               email,
               phone,
               customer_number as customerNumber,
               street,
               house_number as houseNumber,
               address_extra as addressExtra,
               postal_code as postalCode,
               city
        FROM users
        WHERE id = ?
      `
    )
    .get(user.id) as {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    customerNumber: string | null;
    street: string | null;
    houseNumber: string | null;
    addressExtra: string | null;
    postalCode: string | null;
    city: string | null;
  } | undefined;

  if (!profile) {
    redirect("/admin/login");
  }

  return (
    <AccountClient profile={profile} />
  );
}
