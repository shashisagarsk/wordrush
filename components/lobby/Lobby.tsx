"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useGameContext } from "@/context/GameContext";
import { useGame } from "@/hooks/useGame";

import JoiningTimer from "./JoiningTimer";
import PlayerList from "./PlayerList";

interface Props {
  roomCode: string;
}

interface StartGameResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export default function Lobby({
  roomCode,
}: Props) {
  const router = useRouter();

  const { playerId } = useGameContext();

  const { socket, room } = useGame(roomCode);

  const [starting, setStarting] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * ==========================================
   * NORMALIZE ROOM CODE
   * ==========================================
   */

  const cleanRoomCode = roomCode
    .trim()
    .toUpperCase();

  /*
   * ==========================================
   * ROUND STARTED
   * ==========================================
   */

  useEffect(() => {
    if (!socket) return;

    const handleRoundStarted = () => {
      console.log(
        "🎯 Round started → opening game"
      );

      router.push(
        `/room/${cleanRoomCode}/game`
      );
    };

    socket.on(
      "round_started",
      handleRoundStarted
    );

    return () => {
      socket.off(
        "round_started",
        handleRoundStarted
      );
    };
  }, [
    socket,
    router,
    cleanRoomCode,
  ]);

  /*
   * ==========================================
   * ROOM LOADING
   * ==========================================
   */

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0F1020]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-purple-500" />

          <p className="text-gray-400">
            Loading room...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ==========================================
   * PLAYER / HOST
   * ==========================================
   */

  const isHost =
    room.hostId === playerId;

  const playerCount =
    room.players?.length || 0;

  const canStart =
    isHost &&
    playerCount >= 2 &&
    socket?.connected &&
    !starting;

  /*
   * ==========================================
   * START GAME
   * ==========================================
   */

  const startGame = () => {
    setError("");

    if (!socket) {
      setError(
        "Game server is not ready. Please wait."
      );

      return;
    }

    if (!socket.connected) {
      setError(
        "Game server is disconnected. Please wait for reconnection."
      );

      return;
    }

    if (!isHost) {
      setError(
        "Only the host can start the game."
      );

      return;
    }

    if (playerCount < 2) {
      setError(
        "At least 2 players are required."
      );

      return;
    }

    if (starting) {
      return;
    }

    setStarting(true);

    console.log(
      "================================"
    );
    console.log("🎮 START GAME");
    console.log(
      "🏠 Room:",
      cleanRoomCode
    );
    console.log(
      "👤 Host:",
      playerId
    );
    console.log(
      "👥 Players:",
      playerCount
    );
    console.log(
      "================================"
    );

    let completed = false;

    /*
     * Safety timeout
     */

    const timeout = window.setTimeout(() => {
      if (completed) {
        return;
      }

      completed = true;

      setStarting(false);

      setError(
        "Server did not respond. Please try again."
      );

      console.error(
        "❌ start_game timeout"
      );
    }, 10000);

    socket.emit(
      "start_game",
      {
        roomCode: cleanRoomCode,
      },
      (
        response?: StartGameResponse
      ) => {
        if (completed) {
          return;
        }

        completed = true;

        window.clearTimeout(timeout);

        console.log(
          "📥 START GAME RESPONSE:",
          response
        );

        if (!response) {
          setStarting(false);

          setError(
            "No response received from the server."
          );

          return;
        }

        if (!response.success) {
          setStarting(false);

          setError(
            response.error ||
              response.message ||
              "Unable to start the game."
          );

          return;
        }

        /*
         * Do NOT navigate here.
         *
         * Server will emit:
         *
         * round_started
         *
         * when the joining timer finishes.
         */

        console.log(
          "✅ Game start accepted by server."
        );

        /*
         * Keep starting=true.
         *
         * The lobby will redirect when
         * round_started is received.
         */
      }
    );
  };

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <main className="min-h-screen bg-[#0F1020] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* =====================================
            HEADER
        ====================================== */}

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-purple-400">
              WordRush Lobby
            </p>

            <h1 className="mt-2 text-4xl font-black text-white">
              Room {room.code}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {playerCount}{" "}
              {playerCount === 1
                ? "player"
                : "players"}{" "}
              in room
            </p>
          </div>

          {/* Room code */}

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center">
            <p className="text-xs text-gray-500">
              ROOM CODE
            </p>

            <p className="mt-1 text-2xl font-black tracking-[0.3em] text-white">
              {room.code}
            </p>
          </div>
        </div>

        {/* =====================================
            MAIN CONTENT
        ====================================== */}

        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Players */}

          <PlayerList
            players={room.players || []}
            hostId={room.hostId}
          />

          {/* Sidebar */}

          <div className="space-y-5">
            {/* Joining timer */}

            <JoiningTimer
              endsAt={room.joiningEndsAt}
            />

            {/* Game rules */}

            <div className="card p-6">
              <h3 className="font-bold text-white">
                Game Rules
              </h3>

              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li>
                  • Minimum 2 players
                </li>

                <li>
                  • 10 rounds
                </li>

                <li>
                  • Fast answers earn more
                  points
                </li>

                <li>
                  • Late players join next
                  round
                </li>
              </ul>
            </div>

            {/* =================================
                SOCKET STATUS
            ================================== */}

            {!socket?.connected && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center text-sm text-yellow-400">
                Connecting to game server...
              </div>
            )}

            {/* =================================
                ERROR
            ================================== */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* =================================
                HOST BUTTON
            ================================== */}

            {isHost && (
              <button
                type="button"
                onClick={startGame}
                disabled={!canStart}
                className="w-full rounded-xl bg-purple-600 px-5 py-4 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {starting
                  ? "Starting Game..."
                  : playerCount < 2
                  ? "Need 2 Players"
                  : !socket?.connected
                  ? "Connecting..."
                  : "Start Game"}
              </button>
            )}

            {/* =================================
                NON HOST
            ================================== */}

            {!isHost && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center text-sm text-gray-400">
                Waiting for the host to start
                the game...
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}