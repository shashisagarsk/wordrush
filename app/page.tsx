"use client";

import Link from "next/link";
import { useGameContext } from "@/context/GameContext";

export default function HomePage() {
  const { playerName } = useGameContext();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[90vh] max-w-6xl flex-col items-center justify-center">
        <div className="text-center">
          <div className="mb-5 inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
            Real-Time Multiplayer Word Game
          </div>

          <h1 className="text-6xl font-black tracking-tight md:text-8xl">
            <span className="gradient-text">WordRush</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 md:text-xl">
            Think Fast. Connect Words. Beat Everyone.
          </p>
        </div>

        <div className="mt-14 grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <Link
            href="/create"
            className="card group p-8 transition hover:-translate-y-1 hover:border-purple-400/40"
          >
            <div className="mb-5 text-4xl">⚡</div>

            <h2 className="text-2xl font-bold">
              Create Game
            </h2>

            <p className="mt-3 text-gray-400">
              Create a room and invite your friends using a room
              code.
            </p>

            <div className="mt-6 font-semibold text-purple-400">
              Create Room →
            </div>
          </Link>

          <Link
            href="/join"
            className="card group p-8 transition hover:-translate-y-1 hover:border-indigo-400/40"
          >
            <div className="mb-5 text-4xl">🎮</div>

            <h2 className="text-2xl font-bold">
              Join Game
            </h2>

            <p className="mt-3 text-gray-400">
              Enter a room code and compete with other players.
            </p>

            <div className="mt-6 font-semibold text-indigo-400">
              Join Room →
            </div>
          </Link>
        </div>

        {playerName && (
          <p className="mt-8 text-sm text-gray-500">
            Welcome back, {playerName}
          </p>
        )}
      </div>
    </main>
  );
}