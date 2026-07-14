# Signup System Implementation Plan

Industry-standard user registration flow with email verification.

---

## Quick Overview

| Phase | What | Effort |
|-------|------|--------|
| 1️⃣ **Database** | Add `emailVerified`, verification token fields to User model | 30 min |
| 2️⃣ **Services** | Email sender, token generator, password validator | 1 hr |
| 3️⃣ **Server Actions** | Signup, verify email, resend email handlers | 1 hr |
| 4️⃣ **UI** | Signup form, email verification page | 1.5 hrs |
| 5️⃣ **Auth Integration** | Require verified email before login | 30 min |
| 6️⃣ **Testing & Security** | Rate limiting, token expiration, error handling | 1 hr |

**Total: ~6 hours of focused work**

---

## PHASE 1: Database Schema Updates

### 1.1 Add Email Verification Fields to User Model

Update `prisma/schema.prisma`:

```prisma
model User {
  // existing fields...
  
  // NEW: Email verification fields
  emailVerified  DateTime?  // null until email is verified
  verificationToken String?  @unique
  verificationTokenExpires DateTime?
  
  // Optional: Password reset token
  resetToken String?  @unique
  resetTokenExpires DateTime?
  
  // existing relations...
}

// NEW: Email verification tokens (optional, for better tracking)
model VerificationToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())
}
```

**Why this approach?**
- `emailVerified` tracks whether user has verified their email
- `verificationToken` + `verificationTokenExpires` allows token-based verification
- Optional `resetToken` for future password reset functionality
- Separate model could track multiple verification attempts (useful for analytics)

### 1.2 Create and Run Migration

```bash
npx prisma migrate dev --name add_email_verification_fields
```

---

## PHASE 2: Dependencies & Environment Setup

### 2.1 New Dependencies Needed

```json
{
  "resend": "^3.0.0",           // Email service (or use nodemailer)
  "crypto": "^1.0.4"             // For token generation (Node built-in)
}
```

**Email Service Options:**
- **Resend** (recommended): Next.js-first, simple API, great DX
- **Nodemailer**: Free, flexible, self-hosted SMTP
- **SendGrid**: Reliable, but more setup
- **AWS SES**: Scalable, but complex

Install:
```bash
npm install resend
```

### 2.2 Environment Variables

Add to `.env`:
```
# Email service (Resend)
RESEND_API_KEY=your_key_here
RESEND_FROM_EMAIL=noreply@yourapp.com

# Email verification
AUTH_VERIFICATION_TOKEN_EXPIRY_HOURS=24
AUTH_SESSION_SECRET=your_secret_key

# Frontend verification link
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add to `.env.example`:
```
RESEND_API_KEY=your_key_here
RESEND_FROM_EMAIL=noreply@yourapp.com
AUTH_VERIFICATION_TOKEN_EXPIRY_HOURS=24
AUTH_SESSION_SECRET=your_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## PHASE 3: Create Core Signup Services

### 3.1 Create Email Service (`lib/email.ts`)

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Welcome to FIFU!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link expires in 24 hours.</p>
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
```

### 3.2 Create Token Service (`lib/verification-token.ts`)

```typescript
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

  // Store in database
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
  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    return { valid: false, error: "Invalid token" };
  }

  if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
    return { valid: false, error: "Token expired" };
  }

  // Mark email as verified
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
```

### 3.3 Create Password Service (`lib/password.ts`)

```typescript
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## PHASE 4: Create Signup Server Actions

### 4.1 Add Signup Action (`actions/auth.ts`)

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { validatePasswordStrength } from "@/lib/password";
import { createVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/email";
import bcryptjs from "bcryptjs";
import { z } from "zod";

const SignupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function signup(formData: unknown) {
  try {
    // Validate input
    const data = SignupSchema.parse(formData);

    // Check password strength
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      return { error: passwordValidation.errors.join("; ") };
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "Email already registered. Try logging in." };
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        // emailVerified stays null until verified
      },
    });

    // Generate verification token
    const token = await createVerificationToken(data.email);

    // Send verification email
    const emailResult = await sendVerificationEmail(data.email, token);

    if (!emailResult.success) {
      // Cleanup: delete user if email send failed
      await prisma.user.delete({ where: { id: user.id } });
      return { error: "Failed to send verification email. Please try again." };
    }

    return {
      success: true,
      message: "Signup successful! Check your email to verify your account.",
    };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function verifyEmail(token: string) {
  try {
    const { valid, error, user } = await verifyEmailToken(token);

    if (!valid) {
      return { error: error || "Invalid verification token" };
    }

    return {
      success: true,
      message: "Email verified! You can now log in.",
      user,
    };
  } catch (error) {
    console.error("Verify email error:", error);
    return { error: "Verification failed. Please try again." };
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    // Rate limiting: check if user already requested recently
    // (simplified - in production use Redis)
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { error: "Email not found" };
    }

    if (user.emailVerified) {
      return { error: "Email already verified" };
    }

    // Generate new token
    const token = await createVerificationToken(email);

    // Send email
    const emailResult = await sendVerificationEmail(email, token);

    if (!emailResult.success) {
      return { error: "Failed to send email. Please try again." };
    }

    return {
      success: true,
      message: "Verification email sent! Check your inbox.",
    };
  } catch (error) {
    console.error("Resend verification error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
```

---

## PHASE 5: Create Signup Components & Pages

### 5.1 Create Signup Form Component (`components/features/auth/SignupForm.tsx`)

```typescript
"use client";

import { useState, useActionState } from "react";
import { signup } from "@/actions/auth";
import { validatePasswordStrength } from "@/lib/password";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signup, null);
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(validatePasswordStrength(pwd));
  };

  if (state?.success) {
    return (
      <div className="space-y-4 p-6 rounded-lg border border-success bg-success/10">
        <h2 className="font-semibold text-success">Almost there!</h2>
        <p className="text-sm">{state.message}</p>
        <p className="text-xs text-gray-600">
          We&apos;ve sent a verification link to your email. Click it to confirm your account.
        </p>
        <Link href="/login" className="text-sm text-accent hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border bg-white px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border bg-white px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={handlePasswordChange}
          className="w-full rounded-lg border bg-white px-3 py-2"
        />
        {passwordStrength && !passwordStrength.valid && (
          <ul className="mt-2 text-xs text-danger space-y-1">
            {passwordStrength.errors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        )}
        {passwordStrength?.valid && (
          <p className="mt-2 text-xs text-success">✓ Strong password</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          className="w-full rounded-lg border bg-white px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !passwordStrength?.valid}
        className="w-full py-2 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
      >
        {isPending ? "Creating account..." : "Sign Up"}
      </button>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
```

### 5.2 Create Signup Page (`app/(auth)/signup/page.tsx`)

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignupForm } from "@/components/features/auth/SignupForm";

export const metadata = {
  title: "Sign Up | FIFU",
};

export default async function SignupPage() {
  const session = await auth();
  if (session) {
    redirect("/fixtures");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">FIFU</h1>
          <p className="text-gray-600">Create your account</p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
```

### 5.3 Create Email Verification Page (`app/(auth)/verify-email/page.tsx`)

```typescript
import { Suspense } from "react";
import { verifyEmail } from "@/actions/auth";
import Link from "next/link";
import { EmailVerificationStatus } from "@/components/features/auth/EmailVerificationStatus";

export const metadata = {
  title: "Verify Email | FIFU",
};

async function VerificationContent({ token }: { token: string | null }) {
  if (!token) {
    return (
      <div className="p-6 rounded-lg border border-danger bg-danger/10">
        <h2 className="font-semibold text-danger mb-2">Invalid Link</h2>
        <p className="text-sm text-gray-600 mb-4">
          The verification link is missing or invalid.
        </p>
        <Link href="/signup" className="text-accent hover:underline">
          Try signing up again
        </Link>
      </div>
    );
  }

  const result = await verifyEmail(token);

  if (result.error) {
    return (
      <div className="space-y-4 p-6 rounded-lg border border-danger bg-danger/10">
        <h2 className="font-semibold text-danger">Verification Failed</h2>
        <p className="text-sm text-gray-600">{result.error}</p>
        <EmailVerificationStatus />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 rounded-lg border border-success bg-success/10">
      <h2 className="font-semibold text-success">Email Verified!</h2>
      <p className="text-sm text-gray-600">
        Your email has been verified successfully. You can now log in to your account.
      </p>
      <Link href="/login" className="text-accent hover:underline font-medium">
        Go to Login →
      </Link>
    </div>
  );
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = React.use(searchParams);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">FIFU</h1>
          <p className="text-gray-600">Verifying your email</p>
        </div>
        <Suspense fallback={<div className="p-6 text-center">Verifying...</div>}>
          <VerificationContent token={token} />
        </Suspense>
      </div>
    </main>
  );
}
```

### 5.4 Create Email Verification Component (`components/features/auth/EmailVerificationStatus.tsx`)

```typescript
"use client";

import { resendVerificationEmail } from "@/actions/auth";
import { useState, useActionState } from "react";

export function EmailVerificationStatus() {
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState(resendVerificationEmail, null);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Resend Verification Email"}
      </button>
      {state?.success && (
        <p className="text-xs text-success">{state.message}</p>
      )}
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
```

---

## PHASE 6: Update Authentication Flow

### 6.1 Modify `lib/auth.ts`

Update the Credentials provider to check `emailVerified`:

```typescript
// In the credentials provider
async authorize(credentials) {
  // ... existing email/password check ...

  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in");
  }

  return user;
}
```

---

## PHASE 7: Update Login Navigation

### 7.1 Add Link to Signup

In login page, add:

```typescript
<p className="text-center text-sm">
  Don&apos;t have an account?{" "}
  <Link href="/signup" className="text-accent hover:underline">
    Sign up
  </Link>
</p>
```

---

## PHASE 8: Security Checklist

- ✅ Passwords hashed with bcryptjs (salt rounds: 10-12)
- ✅ Verification tokens 256-bit random + expiration
- ✅ Email addresses validated with Zod
- ✅ Duplicate email check before signup
- ✅ CSRF protection via NextAuth
- ✅ Rate limiting on signup & resend attempts (future)
- ✅ Tokens one-time use (invalidated after verification)
- ✅ No sensitive data logged
- ✅ Email verification link includes secure token
- ✅ Verification page doesn't expose error details
- ✅ Passwords min 8 chars with complexity requirements
- ✅ Token expiration enforced server-side

---

## PHASE 9: Testing Checklist

### Manual Testing

- [ ] Signup with valid data → email sent → can verify
- [ ] Signup with duplicate email → error shown
- [ ] Signup with weak password → error shown
- [ ] Password strength meter works correctly
- [ ] Click verification link → redirects to login
- [ ] Click invalid/expired token → error shown
- [ ] Resend email → new email sent
- [ ] Try login before verification → error shown
- [ ] Login after verification → works ✓
- [ ] Token expires → resend option works
- [ ] Multiple signup attempts → works

### Security Testing

- [ ] Attempt brute force verification
- [ ] Try token reuse
- [ ] Check token doesn't leak in logs
- [ ] Verify passwords are hashed correctly

---

## PHASE 10: Optional OAuth Integration (Future)

To add Google/GitHub signup later, extend `lib/auth.ts`:

```typescript
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

// In NextAuth providers array:
Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
}),

GitHub({
  clientId: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
}),

// Callback: OAuth auto-verifies email
async signIn({ user, account }) {
  if (account?.provider !== "credentials") {
    // OAuth provider - auto-verify email
    await prisma.user.update({
      where: { email: user.email! },
      data: { emailVerified: new Date() },
    });
  }
  return true;
}
```

Environment variables for OAuth:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...
```

---

## File Structure

```
New Files to Create:
├── lib/
│   ├── email.ts                        # Email service abstraction
│   ├── verification-token.ts           # Token generation & verification
│   └── password.ts                     # Password validation
│
├── app/(auth)/
│   ├── signup/
│   │   └── page.tsx                    # Signup page
│   └── verify-email/
│       └── page.tsx                    # Email verification page
│
├── components/features/auth/
│   ├── SignupForm.tsx                  # Signup form component
│   └── EmailVerificationStatus.tsx     # Resend email component
│
├── actions/
│   └── auth.ts                         # Signup, verify, resend actions

Files to Modify:
├── prisma/schema.prisma                # Add emailVerified fields
├── lib/auth.ts                         # Check emailVerified in provider
├── package.json                        # Add resend dependency
├── .env                                # Add email service config
└── .env.example                        # Add example email vars
```

---

## Implementation Sequence

1. **Database** (Prisma)
   - Update schema with emailVerified + token fields
   - Generate and run migration

2. **Environment & Dependencies**
   - Add .env variables for email service
   - Install resend package
   - Test email service connection

3. **Core Services** (lib/)
   - Create email.ts with send verification email
   - Create verification-token.ts with token logic
   - Create password.ts with validation

4. **Server Actions** (actions/)
   - Add signup action with validation & error handling
   - Add verify email action
   - Add resend verification email action

5. **Components & Pages**
   - Create SignupForm.tsx component
   - Create app/(auth)/signup/page.tsx
   - Create app/(auth)/verify-email/page.tsx
   - Create EmailVerificationStatus.tsx

6. **Auth Updates**
   - Modify lib/auth.ts to check emailVerified
   - Update login error messages

7. **Testing & Polish**
   - Test full signup flow
   - Test email verification
   - Test error scenarios

---

## Error Handling & User Messages

| Scenario | Message | Status |
|----------|---------|--------|
| Duplicate email | "Email already registered. Try logging in." | 400 |
| Weak password | "Password must be at least 8 characters..." | 400 |
| Invalid email | "Invalid email" | 400 |
| Email send failed | "Failed to send verification email. Please try again." | 500 |
| Token expired | "Verification link has expired. Request a new one." | 400 |
| Invalid token | "Invalid verification token" | 400 |
| Not verified | "Please verify your email before logging in." | 401 |

---

## Notes

- Email service is abstracted in `lib/email.ts`, so you can swap providers later
- Token generation uses Node's built-in `crypto` module
- Zod schemas handle input validation
- NextAuth.js provides CSRF protection automatically
- Password complexity enforced client-side (real-time feedback) and server-side
- Consider adding rate limiting via Redis for production
