import sgMail from "@sendgrid/mail";

let initialized = false;

function initSendGrid() {
  if (initialized) return;

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SendGrid not configured. Set SENDGRID_API_KEY environment variable."
    );
  }

  sgMail.setApiKey(apiKey);
  initialized = true;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  initSendGrid();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || "dt.office@adec.ae";

  await sgMail.send({
    to: options.to,
    from: fromEmail,
    subject: options.subject,
    html: options.html,
  });
}

export function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || "";
}
