import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.office365.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "SMTP not configured. Set SMTP_USER and SMTP_PASS environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: true,
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const transport = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER!;

  await transport.sendMail({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function getFromEmail(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}
