import { resend } from "./resend";
import { verificationTemplate } from "./templates/verification";

interface SendVerificationEmailProps {
  email: string;
  name: string;
  verificationUrl: string;
}

export async function sendVerificationEmail({
  email,
  name,
  verificationUrl,
}: SendVerificationEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: env.FROM_EMAIL,
      to: email,
      subject: "Verify your iBids account",
      html: verificationTemplate(name, verificationUrl),
    });

    if (error) {
      console.error("Resend Error:", error);
      return {
        success: false,
        error,
      };
    }

    console.log("Verification email sent:", data);

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Email Send Error:", err);

    return {
      success: false,
      error: err,
    };
  }
}