import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.RESEND_FROM || `GetMaterials Admin <${process.env.SMTP_USER}>`;

const otpHtml = (otp: string) => `
  <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <h2 style="margin: 0 0 8px; color: #1a1a1a;">Admin Login OTP</h2>
    <p style="color: #64748b; margin: 0 0 24px;">Use this code to login to the GetMaterials admin panel.</p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #b100ff;">${otp}</span>
    </div>
    <p style="color: #94a3b8; font-size: 13px; margin: 0;">This code expires in 5 minutes. Do not share it with anyone.</p>
  </div>
`;

async function sendViaResend(email: string, otp: string) {
  const { error } = await resend!.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Admin Login OTP - GetMaterials",
    html: otpHtml(otp),
  });
  if (error) throw new Error(error.message);
}

async function sendViaNodemailer(email: string, otp: string) {
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: "Admin Login OTP - GetMaterials",
    html: otpHtml(otp),
  });
}

export async function sendOtpEmail(email: string, otp: string) {
  // Try Resend first, fall back to nodemailer
  if (resend) {
    try {
      await sendViaResend(email, otp);
      return;
    } catch (err) {
      console.warn("Resend failed, falling back to nodemailer:", err);
    }
  }
  await sendViaNodemailer(email, otp);
}
