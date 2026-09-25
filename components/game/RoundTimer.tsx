"use client";

import { useEffect, useState } from "react";

interface Props {
  endsAt?: number;
  hasQuestion: boolean;
}

export default function RoundTimer({
  endsAt,
  hasQuestion,
}: Props) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!hasQuestion || !endsAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (endsAt - Date.now()) / 1000
        )
      );

      setTimeLeft(remaining);
    };

    updateTimer();

    const interval = setInterval(
      updateTimer,
      100
    );

    return () => {
      clearInterval(interval);
    };
  }, [endsAt, hasQuestion]);

  if (!hasQuestion) {
    return (
      <div className="min-w-[90px] rounded-xl bg-gray-700 px-4 py-3 text-center">
        <p className="text-xs uppercase text-gray-400">
          Time
        </p>

        <p className="text-2xl font-black text-gray-500">
          --
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-w-[90px] rounded-xl px-4 py-3 text-center ${
        timeLeft <= 5
          ? "bg-red-600"
          : "bg-purple-600"
      }`}
    >
      <p className="text-xs uppercase text-white/70">
        Time
      </p>

      <p className="text-2xl font-black text-white">
        {timeLeft}s
      </p>
    </div>
  );
}