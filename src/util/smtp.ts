import nodemailer from "nodemailer";
import { ENV } from "../util/env";

export async function sendEmail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: Number(ENV.SMTP_PORT),
        secure: Number(ENV.SMTP_PORT) === 465, // true for port 465
        auth: {
            user: ENV.SMTP_USER,
            pass: ENV.SMTP_PASSWORD,
        },
    });

    if (!ENV.SMTP_USER || !ENV.SMTP_PASSWORD) {
        throw new Error("Missing SMTP_USER or SMTP_PASSWORD in environment variables");
    }

    const info = await transporter.sendMail({
        from: `"${ENV.SMTP_FROM_NAME}" <${ENV.SMTP_USER}>`,
        to,
        subject,
        html,
    });

    console.log("Email sent: %s", info.messageId);
}