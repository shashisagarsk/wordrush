"use client";

import { Player } from "@/lib/types";

interface Props {
  players: Player[];
  hostId: string;
}

export default function PlayerList({
  players,
  hostId,
}: Props) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Players
        </h2>

        <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-gray-400">
          {players.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/20 font-bold text-purple-300">
                {player.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="font-semibold">
                  {player.name}
                </div>

                <div className="text-xs text-gray-500">
                  {player.connected
                    ? "Connected"
                    : "Disconnected"}
                </div>
              </div>
            </div>

            {player.id === hostId && (
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                HOST
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}