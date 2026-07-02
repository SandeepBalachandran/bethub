"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function PerfectPredictionConfetti({ isPerfect }: { readonly isPerfect: boolean }) {
  useEffect(() => {
    if (!isPerfect) {
      return;
    }
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, [isPerfect]);

  return null;
}
