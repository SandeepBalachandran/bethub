import webpush from "web-push";
import { prisma } from "./prisma";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

async function sendToSubscription(
  subscription: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<string | null> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return null;
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Subscription no longer valid (uninstalled, permission revoked, etc.) — clean it up.
      await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
      return `expired subscription (${statusCode}), removed`;
    }
    console.error("Push send failed:", error);
    return error instanceof Error ? error.message : String(error);
  }
}

export type PushSendResult = { sent: number; errors: string[] };

export async function sendPushToAll(payload: PushPayload): Promise<PushSendResult> {
  const subscriptions = await prisma.pushSubscription.findMany();
  const results = await Promise.all(subscriptions.map((sub) => sendToSubscription(sub, payload)));
  const errors = results.filter((r): r is string => r !== null);
  return { sent: subscriptions.length - errors.length, errors };
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushSendResult> {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.all(subscriptions.map((sub) => sendToSubscription(sub, payload)));
  const errors = results.filter((r): r is string => r !== null);
  return { sent: subscriptions.length - errors.length, errors };
}
