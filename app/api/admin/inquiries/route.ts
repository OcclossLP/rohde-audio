import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type InquiryRow = {
  id: string;
  eventType: string | null;
  participants: string | null;
  eventDate: string | null;
  message: string;
  status: string;
  createdAt: string;
  userId: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
};

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiries = (db
    .prepare(
      `
        SELECT i.id,
               i.event_type as eventType,
               i.participants,
               i.event_date as eventDate,
               i.message,
               i.status,
               i.created_at as createdAt,
               u.id as userId,
               u.email,
               u.phone,
               u.first_name as firstName,
               u.last_name as lastName
        FROM inquiries i
        JOIN users u ON u.id = i.user_id
        ORDER BY i.created_at DESC
      `
    )
    .all() as InquiryRow[]);

  return NextResponse.json(inquiries);
}
