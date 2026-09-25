"use client";

import type { Player } from "@/lib/types";

interface Props {
  players: Player[];
  myId?: string;
}

export default function Leaderboard({
  players,
  myId,
}: Props) {
  const sortedPlayers = [...players].sort(
    (a, b) => {
      // Higher score first
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // If scores are equal, higher progress first
      const progA = a.progress ?? 0;
      const progB = b.progress ?? 0;
      if (progB !== progA) {
        return progB - progA;
      }

      // Stable fallback
      return a.name.localeCompare(b.name);
    }
  );

  if (sortedPlayers.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#191A2E] p-6 shadow-xl">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
          <span>🏆</span>
          Live Leaderboard
        </h2>

        <div className="rounded-xl border border-white/5 bg-[#0F1020] px-4 py-8 text-center">
          <p className="text-gray-500">
            No players yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#191A2E] p-6 shadow-xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span>🏆</span>
          Live Leaderboard
        </h2>

        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">
          {sortedPlayers.length}{" "}
          {sortedPlayers.length === 1
            ? "Player"
            : "Players"}
        </span>
      </div>

      {/* Players */}
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myId;

          const position =
            player.position ?? index + 1;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                isMe
                  ? "border-purple-500/50 bg-purple-600/20 text-purple-200"
                  : "border-white/5 bg-[#0F1020] text-gray-200"
              }`}
            >
              {/* Left */}
              <div className="flex min-w-0 items-center gap-3">
                {/* Position */}
                <span
                  className={`w-7 shrink-0 text-center font-bold ${
                    position === 1
                      ? "text-lg text-yellow-400"
                      : position === 2
                      ? "text-gray-300"
                      : position === 3
                      ? "text-amber-600"
                      : "text-gray-500"
                  }`}
                >
                  {position}
                </span>

                {/* Player avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    isMe
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {player.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                {/* Player info */}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="max-w-[120px] truncate font-semibold md:max-w-[160px]">
                      {player.name}
                    </span>

                    {isMe && (
                      <span className="shrink-0 text-xs font-normal text-purple-400">
                        (You)
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center gap-2">
                    {/* Connection status */}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        player.connected
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />

                    <span
                      className={`text-xs ${
                        player.connected
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {player.connected
                        ? "Online"
                        : "Offline"}
                    </span>

                    {/* Progress */}
                    {(player.progress ?? 0) > 0 && (
                      <span className="text-xs text-gray-500">
                        • Round {player.progress}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="ml-3 flex shrink-0 items-baseline gap-1">
                <span className="text-lg font-black text-white">
                  {player.score}
                </span>

                <span className="text-xs text-gray-500">
                  pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* My position */}
      {myId && (
        (() => {
          const myIndex =
            sortedPlayers.findIndex(
              (player) => player.id === myId
            );

          if (myIndex === -1) {
            return null;
          }

          const myPlayer =
            sortedPlayers[myIndex];

          return (
            <div className="mt-5 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Your position
                </span>

                <span className="font-bold text-purple-400">
                  #{myIndex + 1} •{" "}
                  {myPlayer.score} pts
                </span>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}