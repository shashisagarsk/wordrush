"use client";

import { useEffect, useState } from "react";

interface Props {
  endsAt: number | null;
}

export default function JoiningTimer({ endsAt }: Props) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }

    const update = () => {
      const value = Math.max(
        0,
        Math.ceil((endsAt - Date.now()) / 1000)
      );

      setRemaining(value);
    };

    update();

    const timer = setInterval(update, 250);

    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-6 text-center">
      <p className="text-sm uppercase tracking-widest text-gray-400">
        Joining Window
      </p>

      <div className="mt-2 text-5xl font-black text-purple-400">
        {remaining}
      </div>

      <p className="mt-2 text-sm text-gray-500">
        seconds remaining
      </p>
    </div>
  );
}