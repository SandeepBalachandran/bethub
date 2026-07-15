"use client";

import { useState, useEffect } from "react";
import { setNotificationDismissed } from "@/lib/notification-eligibility";
import { toast } from "sonner";

interface PushNotificationBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PushNotificationBanner({ isOpen, onClose }: PushNotificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("🔔 Notifications enabled!");
        setIsVisible(false);
        onClose();
      }
    } catch (error) {
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setNotificationDismissed();
    setIsVisible(false);
    onClose();
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      {/* Top banner notification */}
      <div className="w-full bg-gradient-to-r from-accent to-accent/80 shadow-lg">
        <div className="mx-auto max-w-4xl px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Content - stacks on mobile */}
            <div className="flex gap-2.5 flex-1 min-w-0">
              <div className="shrink-0 text-xl sm:text-2xl mt-0.5">🔔</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm sm:text-base text-white leading-snug">
                  Never Miss a Prediction
                </p>
                <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                  Get live alerts for matches and kickoff reminders
                </p>
              </div>
            </div>

            {/* Actions - full width on mobile, row on desktop */}
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleDismiss}
                disabled={loading}
                className="flex-1 sm:flex-none rounded-lg bg-white/20 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/30 transition-colors disabled:opacity-50 touch-none border border-white/20 hover:border-white/40 active:scale-95"
              >
                Later
              </button>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 sm:flex-none rounded-lg bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-accent hover:bg-gray-100 transition-colors disabled:opacity-50 touch-none active:scale-95"
              >
                {loading ? "Enabling..." : "Enable 🔔"}
              </button>
            </div>

            {/* Close X button */}
            <button
              onClick={handleDismiss}
              disabled={loading}
              className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-4 text-white/70 hover:text-white text-xl transition-colors disabled:opacity-50 touch-none active:scale-90"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
