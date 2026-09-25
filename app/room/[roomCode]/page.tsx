"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useGameContext } from "@/context/GameContext";
import { useGame } from "@/hooks/useGame";
import type { Player } from "@/lib/types";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();

  const roomCode = String(params.roomCode);

  const {
    playerId,
    playerName,
  } = useGameContext();

  const { socket, room } =
    useGame(roomCode);

  const [starting, setStarting] =
    useState(false);

  const [remainingTime, setRemainingTime] =
    useState<number | null>(null);

  useEffect(() => {
    if (!playerName) {
      router.push("/");
    }
  }, [playerName, router]);

  useEffect(() => {
    if (!room?.joiningEndsAt) {
      setRemainingTime(null);
      return;
    }

    const updateTimer = () => {
      const difference =
        room.joiningEndsAt! -
        Date.now();

      setRemainingTime(
        Math.max(
          0,
          Math.ceil(
            difference / 1000
          )
        )
      );
    };

    updateTimer();

    const interval =
      setInterval(
        updateTimer,
        250
      );

    return () => {
      clearInterval(interval);
    };
  }, [room?.joiningEndsAt]);

  useEffect(() => {
    if (
      room?.status === "PLAYING"
    ) {
      router.push(
        `/room/${roomCode}/game`
      );
    }

    if (
      room?.status === "FINISHED"
    ) {
      router.push(
        `/result/${roomCode}`
      );
    }
  }, [
    room?.status,
    roomCode,
    router,
  ]);

  const startGame = () => {
    if (!socket) {
      alert(
        "Connecting to game server..."
      );
      return;
    }

    setStarting(true);

    socket.emit(
      "start_game",
      {
        roomCode,
      },
      (response: {
        success: boolean;
        error?: string;
      }) => {
        setStarting(false);

        if (!response.success) {
          alert(
            response.error ||
              "Unable to start game"
          );
        }
      }
    );
  };

  if (!playerName) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400">
          Redirecting...
        </div>
      </main>
    );
  }

  const isHost =
    room?.hostId === playerId;

  const players =
    room?.players || [];

  const canStart =
    players.length >= 2 &&
    isHost &&
    room?.status === "WAITING";

  return (
    <main className="min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-400 transition hover:text-white"
          >
            ← Home
          </Link>

          <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
            WordRush
          </div>
        </div>

        {/* Room header */}

        <section className="mt-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
            Room Code
          </p>

          <div className="mt-3 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-5">
            <span className="text-4xl font-black tracking-[0.3em] text-white">
              {roomCode}
            </span>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  roomCode
                );

                alert(
                  "Room code copied!"
                );
              }}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/20"
            >
              Copy
            </button>
          </div>
        </section>

        {/* Joining state */}

        {room?.status === "JOINING" && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 text-center">
            <p className="text-sm uppercase tracking-widest text-purple-300">
              Joining Window
            </p>

            <div className="mt-2 text-5xl font-black">
              {remainingTime ?? 0}s
            </div>

            <p className="mt-2 text-gray-400">
              Players can join this round
              while the timer is active.
            </p>
          </div>
        )}

        {/* Waiting */}

        {room?.status === "WAITING" && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-4xl">
              👥
            </div>

            <h2 className="mt-3 text-2xl font-bold">
              Waiting for players
            </h2>

            <p className="mt-2 text-gray-400">
              At least 2 players are required
              to start the game.
            </p>
          </div>
        )}

        {/* Players */}

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Players
            </h2>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-gray-400">
              {players.length}{" "}
              {players.length === 1
                ? "player"
                : "players"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map(
              (
                player: Player
              ) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  currentPlayerId={
                    playerId
                  }
                  hostId={
                    room?.hostId || ""
                  }
                />
              )
            )}
          </div>
        </section>

        {/* Start game */}

        <div className="mx-auto mt-10 max-w-md">
          {isHost ? (
            <>
              <button
                onClick={startGame}
                disabled={
                  !canStart ||
                  starting
                }
                className="w-full rounded-2xl bg-purple-600 px-6 py-4 text-lg font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {starting
                  ? "Starting..."
                  : players.length < 2
                    ? "Need at least 2 players"
                    : "Start Game"}
              </button>

              {players.length < 2 && (
                <p className="mt-3 text-center text-sm text-gray-500">
                  Share the room code with
                  another player.
                </p>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-gray-300">
                Waiting for the host to
                start the game...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function PlayerCard({
  player,
  currentPlayerId,
  hostId,
}: {
  player: Player;
  currentPlayerId: string | null;
  hostId: string;
}) {
  const isMe =
    player.id === currentPlayerId;

  const isHost =
    player.id === hostId;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isMe
          ? "border-purple-500/50 bg-purple-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-lg font-black">
          {player.name
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold">
              {player.name}
            </p>

            {isMe && (
              <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                You
              </span>
            )}
          </div>

          <div className="mt-1 flex gap-2 text-xs text-gray-500">
            {isHost && (
              <span>👑 Host</span>
            )}

            {!player.connected && (
              <span className="text-red-400">
                Offline
              </span>
            )}
          </div>
        </div>

        <div
          className={`h-3 w-3 rounded-full ${
            player.connected
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        />
      </div>
    </div>
  );
}