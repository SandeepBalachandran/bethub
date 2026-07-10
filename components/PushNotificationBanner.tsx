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
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-3 mb-4 sm:mx-6 sm:mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Content */}
          <div className="flex gap-3 flex-1">
            <div className="shrink-0 text-2xl sm:text-3xl">🔔</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                Never Miss a Prediction
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Get live alerts for matches and never forget to predict
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleDismiss}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 touch-none whitespace-nowrap"
            >
              Later
            </button>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="rounded-lg bg-accent px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 touch-none whitespace-nowrap"
            >
              {loading ? "Enabling..." : "Enable"}
            </button>
          </div>
        </div>

        {/* Close X - optional extra */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
