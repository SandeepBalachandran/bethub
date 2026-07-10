const PUSH_NOTIFICATION_DISMISSED_AT_KEY = "pushNotificationDismissedAt";
const PUSH_NOTIFICATION_FIRST_VISIT_KEY = "pushNotificationFirstVisit";

export function getLastPushNotificationDismissal(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(PUSH_NOTIFICATION_DISMISSED_AT_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export function isFirstVisit(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(PUSH_NOTIFICATION_FIRST_VISIT_KEY);
}

export function markFirstVisit(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUSH_NOTIFICATION_FIRST_VISIT_KEY, Date.now().toString());
}

export function shouldShowPushNotificationBanner(): boolean {
  if (typeof window === "undefined") return false;

  // Skip if notification permission already granted or denied
  if (Notification.permission !== "default") {
    return false;
  }

  // Show on first visit
  if (isFirstVisit()) {
    return true;
  }

  // Show if last dismissal was more than 2 days ago
  const lastDismissed = getLastPushNotificationDismissal();
  if (!lastDismissed) return false;

  const daysSinceDismissal = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
  return daysSinceDismissal > 2;
}

export function setNotificationDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUSH_NOTIFICATION_DISMISSED_AT_KEY, Date.now().toString());
}
