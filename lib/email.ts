import { Resend } from "resend";
import { getSettings } from "./settings";

type InquiryEmailPayload = {
  name: string;
  email: string;
  phone?: string | null;
  eventType?: string | null;
  participants?: string | null;
  eventDate?: string | null;
  message: string;
  orderNumber?: string | null;
  customerNumber?: string | null;
};

const canSendMail = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);

const canSendInquiryMail = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL && process.env.FOUNDER_EMAIL);

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

const normalizeBool = (value: string | undefined) =>
  Boolean(value && ["1", "true", "yes", "on"].includes(value.toLowerCase()));

const applyTemplate = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");

const resolveFromAddress = (fromAddress: string, fromName: string) => {
  if (!fromAddress) return fromName;
  if (!fromName) return fromAddress;
  if (fromAddress.includes("<")) return fromAddress;
  return `${fromName} <${fromAddress}>`;
};

const getEmailConfig = () => {
  const settings = getSettings();
  const fromAddress = process.env.FROM_EMAIL ?? "";
  const fromName = (settings.email_from_name ?? "").trim();
  const from = resolveFromAddress(fromAddress, fromName);
  const replyTo =
    (settings.email_reply_to ?? "").trim()
    || process.env.FROM_EMAIL
    || process.env.FOUNDER_EMAIL
    || undefined;
  const bccEnabled = normalizeBool(settings.email_bcc_enabled);
  const bccAddress =
    (settings.email_bcc_address ?? "").trim() || process.env.FOUNDER_EMAIL || "";
  const brandName = (settings.brand_name ?? "").trim() || "Rohde Audio";
  const primary = (settings.brand_primary ?? "").trim() || "#7c3aed";
  const secondary = (settings.brand_secondary ?? "").trim() || "#2563eb";
  const gradient = `linear-gradient(135deg,${primary},${secondary})`;
  const logoUrl = (settings.brand_logo_url ?? "").trim();
  const footer = (settings.brand_email_footer ?? "").trim();
  const subjects = {
    inquiryOwner: settings.email_subject_inquiry_owner || "Neue Anfrage von {name}",
    inquiryCustomer: settings.email_subject_inquiry_customer || "Danke für deine Anfrage!",
    newAccount: settings.email_subject_new_account || "Neuer Account registriert",
    verification: settings.email_subject_verification || "Bestätigungscode für deinen Account",
    status: settings.email_subject_status || "Update zu deiner Anfrage",
    customDefault: settings.email_subject_custom_default || "Nachricht von Rohde Audio",
  };
  return {
    from,
    replyTo,
    bccEnabled,
    bccAddress,
    brandName,
    gradient,
    primary,
    secondary,
    logoUrl,
    footer,
    subjects,
  };
};

const getBcc = (bccEnabled: boolean, bccAddress: string, to: string | string[]) => {
  if (!bccEnabled || !bccAddress) return undefined;
  const list = Array.isArray(to) ? to : [to];
  if (list.includes(bccAddress)) return undefined;
  return [bccAddress];
};

export async function sendInquiryEmails(payload: InquiryEmailPayload) {
  if (!canSendInquiryMail()) return { sent: false };
  const resend = getResend();
  const config = getEmailConfig();
  const {
    name,
    email,
    phone,
    eventType,
    participants,
    eventDate,
    message,
    orderNumber,
    customerNumber,
  } = payload;
  const detailRows = [
    { label: "Auftragsnummer", value: orderNumber ?? "—" },
    { label: "Kundennummer", value: customerNumber ?? "—" },
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

  const inquiryOwnerSubject = applyTemplate(config.subjects.inquiryOwner, {
    name,
    orderNumber: orderNumber ?? "",
    customerNumber: customerNumber ?? "",
  });
  await resend.emails.send({
    from: config.from,
    to: process.env.FOUNDER_EMAIL!,
    subject: inquiryOwnerSubject,
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:${config.gradient};padding:20px 28px;color:#ffffff;">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.brandName}" style="height:28px;margin-bottom:12px;display:block;" />` : ""}
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
    bcc: getBcc(config.bccEnabled, config.bccAddress, process.env.FOUNDER_EMAIL!),
  });

  const inquiryCustomerSubject = applyTemplate(config.subjects.inquiryCustomer, {
    name,
    orderNumber: orderNumber ?? "",
    customerNumber: customerNumber ?? "",
  });
  await resend.emails.send({
    from: config.from,
    to: email,
    subject: inquiryCustomerSubject,
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:${config.gradient};padding:20px 28px;color:#ffffff;">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.brandName}" style="height:28px;margin-bottom:12px;display:block;" />` : ""}
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${config.brandName}</p>
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
            ${config.footer ? `<div style="margin-top:18px;color:#6b7280;font-size:12px;">${config.footer}</div>` : ""}
          </div>
        </div>
      </div>
    `,
    replyTo: config.replyTo,
    bcc: getBcc(config.bccEnabled, config.bccAddress, email),
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
  const config = getEmailConfig();
  await resend.emails.send({
    from: config.from,
    to: process.env.FOUNDER_EMAIL!,
    subject: config.subjects.newAccount,
    html: `
      <div style="background:#f8fafc;padding:24px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:${config.gradient};padding:18px 24px;color:#ffffff;">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.brandName}" style="height:24px;margin-bottom:10px;display:block;" />` : ""}
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${config.brandName}</p>
            <h1 style="margin:6px 0 0;font-size:22px;">Neuer Account</h1>
          </div>
          <div style="padding:20px 24px;">
            <p style="margin:0 0 8px;color:#111827;font-size:14px;"><strong>Name:</strong> ${name}</p>
            <p style="margin:0;color:#111827;font-size:14px;"><strong>E-Mail:</strong> ${email}</p>
            ${config.footer ? `<div style="margin-top:16px;color:#6b7280;font-size:12px;">${config.footer}</div>` : ""}
          </div>
        </div>
      </div>
    `,
    replyTo: config.replyTo,
    bcc: getBcc(config.bccEnabled, config.bccAddress, process.env.FOUNDER_EMAIL!),
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
  const config = getEmailConfig();
  await resend.emails.send({
    from: config.from,
    to: email,
    subject: config.subjects.verification,
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:${config.gradient};padding:18px 24px;color:#ffffff;">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.brandName}" style="height:24px;margin-bottom:10px;display:block;" />` : ""}
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${config.brandName}</p>
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
            ${config.footer ? `<div style="margin-top:16px;color:#6b7280;font-size:12px;">${config.footer}</div>` : ""}
          </div>
        </div>
      </div>
    `,
    replyTo: config.replyTo,
    bcc: getBcc(config.bccEnabled, config.bccAddress, email),
  });
  return { sent: true };
}

export async function sendInquiryStatusEmail({
  name,
  email,
  statusLabel,
  message,
  orderNumber,
  customerNumber,
}: {
  name: string;
  email: string;
  statusLabel: string;
  message?: string | null;
  orderNumber?: string | null;
  customerNumber?: string | null;
}) {
  if (!canSendMail()) return { sent: false };
  const resend = getResend();
  const config = getEmailConfig();
  const noteBlock = message
    ? `
      <div style="margin-top:16px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Nachricht vom Team</p>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:12px;color:#111827;font-size:14px;white-space:pre-wrap;">${message}</div>
      </div>
    `
    : "";

  const statusSubject = applyTemplate(config.subjects.status, {
    name,
    orderNumber: orderNumber ?? "",
    customerNumber: customerNumber ?? "",
    statusLabel,
  });
  await resend.emails.send({
    from: config.from,
    to: email,
    subject: statusSubject,
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:${config.gradient};padding:18px 24px;color:#ffffff;">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.brandName}" style="height:24px;margin-bottom:10px;display:block;" />` : ""}
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${config.brandName}</p>
            <h1 style="margin:6px 0 0;font-size:22px;">Status-Update</h1>
          </div>
          <div style="padding:22px 24px;">
            <p style="margin:0 0 8px;color:#111827;font-size:14px;">Hallo ${name},</p>
            <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
              Der Status deiner Anfrage wurde aktualisiert.
            </p>
            <div style="margin-bottom:12px;">
              <div style="color:#111827;font-size:13px;"><strong>Auftragsnummer:</strong> ${orderNumber ?? "—"}</div>
              <div style="color:#111827;font-size:13px;"><strong>Kundennummer:</strong> ${customerNumber ?? "—"}</div>
            </div>
            <div style="background:#eef2ff;border:1px solid #c7d2fe;padding:12px;border-radius:12px;color:#1e1b4b;font-size:14px;font-weight:600;">
              Neuer Status: ${statusLabel}
            </div>
            ${noteBlock}
            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
              Bei Fragen antworte einfach auf diese Mail.
            </p>
            ${config.footer ? `<div style="margin-top:16px;color:#6b7280;font-size:12px;">${config.footer}</div>` : ""}
          </div>
        </div>
      </div>
    `,
    replyTo: config.replyTo,
    bcc: getBcc(config.bccEnabled, config.bccAddress, email),
  });
  return { sent: true };
}

export async function sendCustomCustomerEmail({
  name,
  email,
  subject,
  message,
  orderNumber,
  customerNumber,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderNumber?: string | null;
  customerNumber?: string | null;
}) {
  if (!canSendMail()) return { sent: false };
  const resend = getResend();
  const config = getEmailConfig();
  const subjectLine = subject?.trim() || config.subjects.customDefault;
  const templatedSubject = applyTemplate(subjectLine, {
    name,
    orderNumber: orderNumber ?? "",
    customerNumber: customerNumber ?? "",
  });
  const templatedMessage = applyTemplate(message, {
    name,
    orderNumber: orderNumber ?? "",
    customerNumber: customerNumber ?? "",
  });
  await resend.emails.send({
    from: config.from,
    to: email,
    subject: templatedSubject,
    html: `
      <div style="background:#f8fafc;padding:28px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:${config.gradient};padding:18px 24px;color:#ffffff;">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.brandName}" style="height:24px;margin-bottom:10px;display:block;" />` : ""}
            <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${config.brandName}</p>
            <h1 style="margin:6px 0 0;font-size:22px;">${templatedSubject}</h1>
          </div>
          <div style="padding:22px 24px;">
            <p style="margin:0 0 8px;color:#111827;font-size:14px;">Hallo ${name},</p>
            <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:12px;color:#111827;font-size:14px;white-space:pre-wrap;">${templatedMessage}</div>
            ${config.footer ? `<div style="margin-top:16px;color:#6b7280;font-size:12px;">${config.footer}</div>` : ""}
          </div>
        </div>
      </div>
    `,
    replyTo: config.replyTo,
    bcc: getBcc(config.bccEnabled, config.bccAddress, email),
  });
  return { sent: true };
}
