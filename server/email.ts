import { getUncachableSendGridClient } from "./sendgrid";

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const { client, fromEmail: integrationFromEmail } = await getUncachableSendGridClient();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || integrationFromEmail;

  await client.send({
    to: options.to,
    from: fromEmail,
    subject: options.subject,
    html: options.html,
  });
}

export function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || "";
}
