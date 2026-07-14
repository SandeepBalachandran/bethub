import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createVerificationToken(email: string) {
  const token = generateVerificationToken();
  const expiresInHours = parseInt(
    process.env.AUTH_VERIFICATION_TOKEN_EXPIRY_HOURS || "24"
  );
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: {
      verificationToken: token,
      verificationTokenExpires: expiresAt,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string) {
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    return { valid: false, error: "Invalid token" };
  }

  if (
    user.verificationTokenExpires &&
    user.verificationTokenExpires < new Date()
  ) {
    return { valid: false, error: "Token expired" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return { valid: true, user };
}

export async function invalidateToken(email: string) {
  await prisma.user.update({
    where: { email },
    data: {
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });
}
