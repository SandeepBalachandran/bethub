"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { subscribeToPush } from "@/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationPrompt() {
  const [status, setStatus] = useState<"unsupported" | "checking" | "prompt" | "granted" | "denied">(
    "checking"
  );

  useEffect(() => {
    // Feature/permission detection only exists in the browser, so this can't
    // be determined during SSR — same hydration-safe pattern as ProfileMenu.
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission === "granted" ? "granted" : "prompt");
  }, []);

  async function enableNotifications() {
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error(
          "NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing from the client bundle — restart the dev server after adding it to .env."
        );
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.error(
          permission === "denied"
            ? "Notifications are blocked for this site in your browser — check the site settings (padlock icon next to the URL) to reset it, then try again."
            : "Notification permission was dismissed."
        );
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await subscribeToPush(subscription.toJSON() as never);
      setStatus("granted");
      toast.success("Notifications enabled!");
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      toast.error(error instanceof Error ? error.message : "Failed to enable notifications.");
    }
  }

  if (status === "unsupported" || status === "granted" || status === "checking") {
    return null;
  }

  return (
    <div className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
      <span>
        {status === "denied"
          ? "Notifications are blocked — enable them in your browser's site settings to get match alerts."
          : "Get notified when matches finish. Enable notifications?"}
      </span>
      {status === "prompt" && (
        <button type="button" onClick={enableNotifications} className="btn btn-primary">
          Enable
        </button>
      )}
    </div>
  );
}
