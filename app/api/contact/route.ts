import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    // ✅ Guard (optional but recommended)
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const {
      name,
      email,
      phone,
      eventType,
      participants,
      date,
      message,
    } = body;

    // ✉️ E‑Mail an den Gründer
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: process.env.FOUNDER_EMAIL!,
      subject: `Neue Anfrage von ${name}`,
      html: `
        <h2>Neue Kontaktanfrage</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Event‑Typ:</strong> ${eventType}</p>
        <p><strong>Teilnehmer:</strong> ${participants}</p>
        <p><strong>Datum:</strong> ${date}</p>
        <p><strong>Nachricht:</strong> ${message}</p>
      `,
      replyTo: email,
    });

    // ✉️ Bestätigung an den Kunden
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: "Danke für deine Anfrage!",
      html: `
        <h2>Vielen Dank für deine Anfrage, ${name}!</h2>
        <p>Wir haben deine Nachricht erhalten und melden uns schnellstmöglich.</p>
        <p><strong>Details deiner Anfrage:</strong></p>
        <ul>
          <li><strong>Telefon:</strong> ${phone}</li>
          <li><strong>Event‑Typ:</strong> ${eventType}</li>
          <li><strong>Teilnehmer:</strong> ${participants}</li>
          <li><strong>Datum:</strong> ${date}</li>
        </ul>
        <p>📩 Wir freuen uns auf dein Event!</p>
      `,
      replyTo: process.env.FROM_EMAIL!,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("E‑Mail senden fehlgeschlagen:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
