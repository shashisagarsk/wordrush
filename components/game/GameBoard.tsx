"use client";

import { useEffect, useState } from "react";
import type { RoomState } from "@/lib/types";
import RoundTimer from "./RoundTimer";
import Leaderboard from "./Leaderboard";

interface AnswerResult {
  success: boolean;
  correct?: boolean;
  points?: number;
  score?: number;
  message?: string;
}

interface Props {
  room: RoomState;
  playerId: string;
  socket: any;
}

export default function GameBoard({
  room,
  playerId,
  socket,
}: Props) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  /*
   * ==========================================
   * CURRENT PLAYER
   * ==========================================
   */

  const me = room.players.find(
    (player) => player.id === playerId
  );

  /*
   * ==========================================
   * TIMER
   *
   * We maintain a local timeLeft state so
   * React re-renders every 100ms.
   * ==========================================
   */

  useEffect(() => {
    if (
      !room.currentQuestion ||
      !room.roundEndsAt
    ) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (room.roundEndsAt! - Date.now()) / 1000
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
  }, [
    room.currentRound,
    room.currentQuestion,
    room.roundEndsAt,
  ]);

  /*
   * ==========================================
   * ROUND / QUESTION RESET
   * ==========================================
   */

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
    setMessage("");
  }, [
    room.currentRound,
    room.currentQuestion,
  ]);

  /*
   * ==========================================
   * ROUND ACTIVE STATE
   * ==========================================
   */

  const hasQuestion = Boolean(
    room.currentQuestion
  );

  const isTimeUp =
    hasQuestion &&
    room.roundEndsAt != null &&
    timeLeft <= 0;

  const canAnswer =
    hasQuestion &&
    !submitted &&
    !isTimeUp &&
    socket?.connected;

  /*
   * ==========================================
   * SUBMIT ANSWER
   * ==========================================
   */

  const submitAnswer = () => {
    if (!socket) {
      setMessage(
        "Socket is not connected."
      );
      return;
    }

    if (!socket.connected) {
      setMessage(
        "Connection lost. Please wait..."
      );
      return;
    }

    if (!hasQuestion) {
      setMessage(
        "Waiting for question..."
      );
      return;
    }

    if (submitted) {
      return;
    }

    if (isTimeUp) {
      setMessage("Time is up!");
      return;
    }

    const cleanAnswer = answer.trim();

    if (!cleanAnswer) {
      setMessage(
        "Please type an answer."
      );
      return;
    }

    console.log(
      "📤 SUBMITTING ANSWER:",
      cleanAnswer
    );

    socket.emit("submit_answer", {
      roomCode: room.code,
      answer: cleanAnswer,
    });
  };

  /*
   * ==========================================
   * ANSWER RESULT
   * ==========================================
   */

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleAnswerResult = (
      response: AnswerResult
    ) => {
      console.log(
        "📝 ANSWER RESULT:",
        response
      );

      if (!response.success) {
        setMessage(
          response.message ||
            "Something went wrong."
        );

        return;
      }

      if (response.correct) {
        setSubmitted(true);

        setMessage(
          response.message ||
            `Correct! +${
              response.points || 0
            } points`
        );

        return;
      }

      /*
       * Wrong answer:
       * Player can try again.
       */

      setSubmitted(false);

      setMessage(
        response.message ||
          "Wrong answer. Try again!"
      );
    };

    socket.on(
      "answer_result",
      handleAnswerResult
    );

    return () => {
      socket.off(
        "answer_result",
        handleAnswerResult
      );
    };
  }, [socket]);

  /*
   * ==========================================
   * GAME UI
   * ==========================================
   */

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* ======================================
          MAIN GAME
      ====================================== */}

      <div>
        {/* ROUND + TIMER */}

        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">
              ROUND
            </p>

            <h1 className="text-3xl font-black text-white">
              {room.currentRound} /{" "}
              {room.totalRounds}
            </h1>
          </div>

          <RoundTimer
            endsAt={room.roundEndsAt ?? undefined}
            hasQuestion={hasQuestion}
          />
        </div>

        {/* GAME CARD */}

        <div className="card p-8 text-center md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
            Complete the word
          </p>

          {/* QUESTION */}

          <div className="mt-10 flex min-h-[90px] items-center justify-center">
            {hasQuestion ? (
              <div className="break-words text-4xl font-black tracking-[0.15em] text-white md:text-6xl">
                {typeof room.currentQuestion === "string"
                  ? room.currentQuestion
                  : typeof room.currentQuestion === "object" && room.currentQuestion !== null
                  ? (room.currentQuestion as any).display
                  : String(room.currentQuestion || "")}
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-500">
                Waiting for question...
              </div>
            )}
          </div>

          {/* ANSWER */}

          <div className="mx-auto mt-10 max-w-xl">
            <input
              type="text"
              value={answer}
              disabled={!canAnswer}
              onChange={(event) => {
                setAnswer(event.target.value);

                if (message) {
                  setMessage("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  if (canAnswer) {
                    submitAnswer();
                  }
                }
              }}
              placeholder={
                !hasQuestion
                  ? "Waiting for question..."
                  : isTimeUp
                  ? "Time is up!"
                  : submitted
                  ? "Answer submitted"
                  : "Type your answer..."
              }
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-5 py-5 text-center text-xl uppercase text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
            />

            {/* SUBMIT */}

            <button
              type="button"
              onClick={submitAnswer}
              disabled={
                !canAnswer ||
                !answer.trim()
              }
              className="mt-4 w-full rounded-xl bg-purple-600 px-5 py-4 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {submitted
                ? "Answer Submitted"
                : isTimeUp
                ? "Time Up"
                : "Submit Answer"}
            </button>
          </div>

          {/* MESSAGE */}

          {message && (
            <div
              className={`mt-6 text-lg font-bold ${
                message
                  .toLowerCase()
                  .includes("correct")
                  ? "text-green-400"
                  : message
                      .toLowerCase()
                      .includes("wrong")
                  ? "text-red-400"
                  : "text-gray-300"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* YOUR SCORE */}

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
          <span className="text-gray-400">
            Your Score
          </span>

          <span className="text-2xl font-black text-purple-400">
            {me?.score ?? 0}
          </span>
        </div>
      </div>

      {/* ======================================
          LEADERBOARD
      ====================================== */}

      <Leaderboard
        players={room.players}
        myId={playerId}
      />
    </div>
  );
}