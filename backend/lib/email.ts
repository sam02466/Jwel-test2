// Real transactional email via Brevo (api.brevo.com/v3/smtp/email) —
// free tier covers plenty of testing volume (300 emails/day as of
// writing; check your Brevo dashboard for the current limit). A plain
// fetch call rather than the @getbrevo/brevo SDK: this app only ever
// sends one kind of request, so a whole generated API client is more
// than it needs.
//
// Requires two things in Brevo before this works:
//   1. BREVO_API_KEY — Account menu -> SMTP & API -> API Keys.
//   2. A verified sender — Senders, Domains & Dedicated IPs -> Senders
//      -> Add a sender, then verify it (a single mailbox address is
//      enough to start; you don't need a fully verified domain to send
//      test email). Put that address in BREVO_SENDER_EMAIL.
// Without both, sendEmail() below throws — see the try/catch at each
// call site, which logs and moves on rather than failing the request
// that triggered the email (e.g. signup should still succeed even if
// the welcome email doesn't go out).

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.log(`[EMAIL STUB — BREVO_API_KEY/BREVO_SENDER_EMAIL not set] Would send to ${to} | Subject: ${subject}\n${body}`);
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || "Sarika Beauty Hub" },
      to: [{ email: to }],
      subject,
      // Plain text is fine for now (textContent) — swap for htmlContent
      // with a real template once you've designed one in Brevo's
      // template editor (Templates -> New Template), then pass
      // templateId + params instead of textContent. See
      // https://developers.brevo.com/docs/send-a-transactional-email
      textContent: body,
    }),
  });

  if (!res.ok) {
    // Don't throw past this into the caller's request — a broken email
    // provider should never be the reason someone can't sign up or an
    // order confirmation fails. Log it loudly instead.
    const detail = await res.text().catch(() => "");
    console.error(`[EMAIL] Brevo send failed (${res.status}): ${detail}`);
  }
}

export function welcomeEmailBody(name: string): string {
  return `Hi ${name},\n\nWelcome to the Sarika Circle! Your account is ready — track orders, save your address, and get early access to new collections.\n\n— Sarika Beauty Hub`;
}

export function orderConfirmedEmailBody(orderId: string, totalAmountRupees: number): string {
  const rupees = totalAmountRupees.toLocaleString("en-IN");
  return `Hi,\n\nYour order #${orderId.slice(-6)} is confirmed — total ₹${rupees}. We'll email you again once it's out for delivery.\n\n— Sarika Beauty Hub`;
}
