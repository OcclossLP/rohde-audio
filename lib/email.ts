import { Resend } from "resend";

type InquiryEmailPayload = {
  name: string;
  email: string;
  phone?: string | null;
  eventType?: string | null;
  participants?: string | null;
  eventDate?: string | null;
  message: string;
};

const canSendMail = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);

const canSendInquiryMail = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL && process.env.FOUNDER_EMAIL);

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

export async function sendInquiryEmails(payload: InquiryEmailPayload) {
  if (!canSendInquiryMail()) return { sent: false };
  const resend = getResend();
  const { name, email, phone, eventType, participants, eventDate, message } = payload;
  const detailRows = [
    { label: "Telefon", value: phone ?? "—" },
    { label: "Event-Typ", value: eventType ?? "—" },
    { label: "Teilnehmer", value: participants ?? "—" },
    { label: "Datum", value: eventDate ?? "—" },
  ]
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">${row.label}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;">${row.value}</td>
        </tr>
      `
    )
    .join("");

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.FOUNDER_EMAIL!,
    subject: `Neue Anfrage von ${name}`,
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:20px 28px;color:#ffffff;">
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Neue Anfrage</p>
            <h1 style="margin:8px 0 0;font-size:24px;">${name}</h1>
          </div>
          <div style="padding:24px 28px;">
            <p style="margin:0 0 16px;color:#111827;font-size:15px;">Kontakt:</p>
            <div style="margin-bottom:16px;">
              <div style="color:#111827;font-size:14px;"><strong>E-Mail:</strong> ${email}</div>
              <div style="color:#111827;font-size:14px;"><strong>Telefon:</strong> ${phone ?? "—"}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
              ${detailRows}
            </table>
            <div style="margin-top:16px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Nachricht</p>
              <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:12px;color:#111827;font-size:14px;white-space:pre-wrap;">${message}</div>
            </div>
          </div>
        </div>
      </div>
    `,
    replyTo: email,
  });

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "Danke für deine Anfrage!",
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:20px 28px;color:#ffffff;">
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Rohde Audio</p>
            <h1 style="margin:8px 0 0;font-size:24px;">Danke fuer deine Anfrage!</h1>
          </div>
          <div style="padding:24px 28px;">
            <p style="margin:0 0 12px;color:#111827;font-size:15px;">Hallo ${name},</p>
            <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
              Wir haben deine Nachricht erhalten und melden uns schnellstmoeglich.
            </p>
            <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
              ${detailRows}
            </table>
            <div style="margin-top:18px;color:#111827;font-size:14px;">
              Wir freuen uns auf dein Event!
            </div>
          </div>
        </div>
      </div>
    `,
    replyTo: process.env.FROM_EMAIL!,
  });

  return { sent: true };
}

export async function sendNewAccountEmail({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  if (!canSendInquiryMail()) return { sent: false };
  const resend = getResend();
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.FOUNDER_EMAIL!,
    subject: "Neuer Account registriert",
    html: `
      <div style="background:#f8fafc;padding:24px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:18px 24px;color:#ffffff;">
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Rohde Audio</p>
            <h1 style="margin:6px 0 0;font-size:22px;">Neuer Account</h1>
          </div>
          <div style="padding:20px 24px;">
            <p style="margin:0 0 8px;color:#111827;font-size:14px;"><strong>Name:</strong> ${name}</p>
            <p style="margin:0;color:#111827;font-size:14px;"><strong>E-Mail:</strong> ${email}</p>
          </div>
        </div>
      </div>
    `,
  });
  return { sent: true };
}

export async function sendVerificationEmail({
  name,
  email,
  code,
}: {
  name: string;
  email: string;
  code: string;
}) {
  if (!canSendMail()) return { sent: false };
  const resend = getResend();
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "Bestätigungscode für deinen Account",
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:18px 24px;color:#ffffff;">
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Rohde Audio</p>
            <h1 style="margin:6px 0 0;font-size:22px;">Account bestaetigen</h1>
          </div>
          <div style="padding:22px 24px;">
            <p style="margin:0 0 8px;color:#111827;font-size:14px;">Hallo ${name},</p>
            <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
              Dein Bestaetigungscode lautet:
            </p>
            <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center;font-size:22px;font-weight:700;letter-spacing:6px;color:#111827;">
              ${code}
            </div>
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">Der Code ist 10 Minuten gueltig.</p>
          </div>
        </div>
      </div>
    `,
    replyTo: process.env.FROM_EMAIL!,
  });
  return { sent: true };
}

export async function sendInquiryStatusEmail({
  name,
  email,
  statusLabel,
  message,
}: {
  name: string;
  email: string;
  statusLabel: string;
  message?: string | null;
}) {
  if (!canSendMail()) return { sent: false };
  const resend = getResend();
  const noteBlock = message
    ? `
      <div style="margin-top:16px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Nachricht vom Team</p>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:12px;color:#111827;font-size:14px;white-space:pre-wrap;">${message}</div>
      </div>
    `
    : "";

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "Update zu deiner Anfrage",
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:18px 24px;color:#ffffff;">
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Rohde Audio</p>
            <h1 style="margin:6px 0 0;font-size:22px;">Status-Update</h1>
          </div>
          <div style="padding:22px 24px;">
            <p style="margin:0 0 8px;color:#111827;font-size:14px;">Hallo ${name},</p>
            <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
              Der Status deiner Anfrage wurde aktualisiert.
            </p>
            <div style="background:#eef2ff;border:1px solid #c7d2fe;padding:12px;border-radius:12px;color:#1e1b4b;font-size:14px;font-weight:600;">
              Neuer Status: ${statusLabel}
            </div>
            ${noteBlock}
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
              Bei Fragen antworte einfach auf diese Mail.
            </p>
          </div>
        </div>
      </div>
    `,
    replyTo: process.env.FROM_EMAIL!,
  });
  return { sent: true };
}

export async function sendCustomCustomerEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!canSendMail()) return { sent: false };
  const resend = getResend();
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject,
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:18px 24px;color:#ffffff;">
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Rohde Audio</p>
            <h1 style="margin:6px 0 0;font-size:22px;">${subject}</h1>
          </div>
          <div style="padding:22px 24px;">
            <p style="margin:0 0 8px;color:#111827;font-size:14px;">Hallo ${name},</p>
            <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:12px;color:#111827;font-size:14px;white-space:pre-wrap;">${message}</div>
          </div>
        </div>
      </div>
    `,
    replyTo: process.env.FROM_EMAIL!,
  });
  return { sent: true };
}
