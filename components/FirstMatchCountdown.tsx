"use client";

import { useEffect, useState } from "react";
import { getCountdown } from "@/lib/countdown";

export function FirstMatchCountdown({ kickoffTime }: { readonly kickoffTime: string }) {
  const [label, setLabel] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const target = new Date(kickoffTime);

    const update = () => {
      const countdown = getCountdown(target);
      if (countdown.hasStarted) {
        setHasStarted(true);
        return;
      }
      setLabel(
        countdown.days > 0
          ? `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
          : `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [kickoffTime]);

  // Once the first Round of 16 match has kicked off, this is gone for good —
  // hasStarted is derived from the real kickoff timestamp, so it never flips back.
  if (hasStarted || !label) {
    return null;
  }

  return (
    <div className="card gradient-header border-0 p-4 text-center text-white shadow-xl">
      <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
        Round of 16 kicks off in
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{label}</p>
    </div>
  );
}
