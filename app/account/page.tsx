import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen pt-32 px-6 text-gray-200">
      <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-[var(--surface-2)] p-10 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-4">
          Kundenkonto
        </h1>
        <p className="text-gray-400">
          Der Kundenbereich ist gerade in Vorbereitung. Bald kannst du hier deine
          Termine und Buchungen verwalten.
        </p>
      </div>
    </main>
  );
}
