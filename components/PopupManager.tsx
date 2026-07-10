"use client";

import { useEffect, useState } from "react";
import {
  shouldShowPushNotificationBanner,
  markFirstVisit,
} from "@/lib/notification-eligibility";
import { DailyCoinsModal } from "@/components/DailyCoinsModal";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";

export function PopupManager() {
  const [coinsModalOpen, setCoinsModalOpen] = useState(false);
  const [pushBannerOpen, setPushBannerOpen] = useState(false);
  const [coinsData, setCoinsData] = useState<{
    coinsAmount: number;
    dayNumber: number;
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePopups = async () => {
      try {
        // Fetch reward data via API
        const response = await fetch("/api/rewards/progress");
        if (response.ok) {
          const data = await response.json();
          const {
            campaignActive,
            dayNumber,
            todaysReward,
            claimed,
          } = data;

          // Show coins modal if available and not claimed
          if (campaignActive && !claimed) {
            setCoinsData({
              coinsAmount: todaysReward,
              dayNumber,
            });
            setCoinsModalOpen(true);
          }
        }

        // Mark first visit
        markFirstVisit();
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing popups:", error);
        setIsInitialized(true);
      }
    };

    initializePopups();
  }, []);

  // Handle coins modal close → trigger push notification banner after delay
  const handleCoinsModalClose = () => {
    setCoinsModalOpen(false);

    // After coins modal closes, check if push notification should show
    setTimeout(() => {
      if (shouldShowPushNotificationBanner()) {
        setPushBannerOpen(true);
      }
    }, 500);
  };

  // If coins modal wasn't shown, still check for push notification on init
  useEffect(() => {
    if (isInitialized && !coinsModalOpen && !pushBannerOpen && coinsData === null) {
      if (shouldShowPushNotificationBanner()) {
        setPushBannerOpen(true);
      }
    }
  }, [isInitialized, coinsModalOpen, pushBannerOpen, coinsData]);

  return (
    <>
      {coinsData && (
        <DailyCoinsModal
          isOpen={coinsModalOpen}
          coinsAmount={coinsData.coinsAmount}
          dayNumber={coinsData.dayNumber}
          onClose={handleCoinsModalClose}
          onCollected={() => {
            // Optional: track that coins were collected
          }}
        />
      )}

      <PushNotificationBanner
        isOpen={pushBannerOpen}
        onClose={() => setPushBannerOpen(false)}
      />
    </>
  );
}
