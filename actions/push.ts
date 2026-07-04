"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/authz";
import { sendPushToAll } from "@/lib/push";

const subscriptionSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function subscribeToPush(input: z.infer<typeof subscriptionSchema>) {
  const user = await requireAuth();
  const data = subscriptionSchema.parse(input);

  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    update: { userId: user.id, p256dh: data.keys.p256dh, auth: data.keys.auth },
    create: {
      userId: user.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    },
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  await requireAuth();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

const adminNotificationSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(200),
});

export async function sendAdminNotification(input: z.infer<typeof adminNotificationSchema>) {
  await requireAdmin();
  const data = adminNotificationSchema.parse(input);

  const recipientCount = await sendPushToAll({ title: data.title, body: data.body });
  return { recipientCount };
}
