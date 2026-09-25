"use client";

import Link from "next/link";
import { Player } from "@/lib/types";

interface Props {
  players: Player[];
}

export default function Winner({ players }: Props) {
  const sorted = [...players].sort(
    (a, b) => b.score - a.score
  );

  const winner = sorted[0];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="text-7xl">🏆</div>

          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-purple-400">
            Game Finished
          </p>

          <h1 className="mt-3 text-5xl font-black">
            {winner?.name || "Winner"}
          </h1>

          <p className="mt-3 text-gray-400">
            {winner?.score || 0} points
          </p>
        </div>

        <div className="card mt-12 p-6">
          <h2 className="text-xl font-bold">
            Final Leaderboard
          </h2>

          <div className="mt-5 space-y-3">
            {sorted.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 text-center font-black text-gray-500">
                    #{index + 1}
                  </span>

                  <span className="font-semibold">
                    {player.name}
                  </span>
                </div>

                <span className="font-black text-purple-400">
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block rounded-xl bg-purple-600 px-6 py-4 font-bold hover:bg-purple-500"
          >
            Play Again
          </Link>
        </div>
      </div>
    </main>
  );
}