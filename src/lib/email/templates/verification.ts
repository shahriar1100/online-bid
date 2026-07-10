export function verificationTemplate(
  name: string,
  verificationUrl: string
) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Welcome to iBids!</h2>

      <p>Hello <strong>${name}</strong>,</p>

      <p>
        Thank you for creating your account.
        Please verify your email address by clicking the button below.
      </p>

      <p style="margin:30px 0;">
        <a
          href="${verificationUrl}"
          style="
            background:#7c3aed;
            color:#ffffff;
            text-decoration:none;
            padding:14px 24px;
            border-radius:8px;
            display:inline-block;
          "
        >
          Verify Email
        </a>
      </p>

      <p>
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p>${verificationUrl}</p>

      <hr />

      <p style="color:#666;font-size:13px;">
        This email was sent by iBids.
      </p>
    </div>
  `;
}