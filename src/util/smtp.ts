import { Resend } from "resend";
import { ENV } from "../util/env";

const resend = new Resend(ENV.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  if (!ENV.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const { data, error } = await resend.emails.send({
    from: ENV.SMTP_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend Error:", error);
    throw new Error(error.message);
  }

  console.log("Email sent successfully:", data?.id);

  return data;
}