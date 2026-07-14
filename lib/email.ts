import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@fifu.app";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  try {
    // In development without API key, log the link instead
    if (!resend) {
      const verificationLink = `${appUrl}/verify-email?token=${token}`;
      console.log(
        `[DEV MODE] Verification link for ${email}:\n${verificationLink}`
      );
      return { success: true };
    }

    const verificationLink = `${appUrl}/verify-email?token=${token}`;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Verify your email — FIFU",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">🏆 Welcome to FIFU</h2>
          </div>
          <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">
              Thanks for signing up! Please verify your email to get started.
            </p>
            <div style="margin: 24px 0;">
              <a href="${verificationLink}" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Verify Email
              </a>
            </div>
            <p style="margin: 16px 0; color: #6b7280; font-size: 14px;">
              Or copy this link: <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${verificationLink}</code>
            </p>
            <p style="margin: 24px 0 0 0; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
              This link expires in 24 hours. If you didn't sign up for FIFU, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(`Email send failed: ${result.error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
}
