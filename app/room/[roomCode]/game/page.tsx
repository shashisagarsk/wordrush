"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { useGame } from "@/hooks/useGame";

import {
  useGameContext,
} from "@/context/GameContext";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();

  const roomCode =
    String(params.roomCode);

  const {
    playerId,
  } = useGameContext();

  const {
    socket,
    room,
  } = useGame(roomCode);

  const question =
    typeof room?.currentQuestion === "string"
      ? room.currentQuestion
      : typeof room?.currentQuestion === "object" && room?.currentQuestion !== null
      ? (room.currentQuestion as any).display ?? ""
      : "";

  const roundEndsAt = room?.roundEndsAt ?? null;

  /*
   * ========================================
   * LOCAL GAME STATE
   * ========================================
   */

  const [answer, setAnswer] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [correct, setCorrect] =
    useState<boolean | null>(null);

  const [answered, setAnswered] =
    useState(false);

  /*
   * ========================================
   * DEBUG
   * ========================================
   */

  useEffect(() => {
    console.log(
      "🖥️ FRONTEND QUESTION:",
      question
    );

    console.log(
      "⏱️ FRONTEND ROUND ENDS:",
      roundEndsAt
    );
  }, [
    question,
    roundEndsAt,
  ]);

  /*
   * ========================================
   * TIMER
   *
   * IMPORTANT:
   * Timer starts ONLY when:
   *
   * question + roundEndsAt
   *
   * are received.
   * ========================================
   */

  useEffect(() => {
    /*
     * No question = timer should NOT run.
     */
    if (
      !question ||
      !roundEndsAt
    ) {
      setTimeLeft(0);

      return;
    }

    console.log(
      "🚀 TIMER STARTED BECAUSE QUESTION ARRIVED"
    );

    /*
     * Calculate current remaining time
     * using server timestamp.
     */
    const updateTimer = () => {
      const remaining =
        Math.max(
          0,
          Math.ceil(
            (roundEndsAt -
              Date.now()) /
              1000
          )
        );

      setTimeLeft(
        remaining
      );
    };

    /*
     * Run immediately.
     */
    updateTimer();

    /*
     * Update every 100ms.
     */
    const timer =
      setInterval(
        updateTimer,
        100
      );

    return () => {
      clearInterval(timer);
    };
  }, [
    question,
    roundEndsAt,
  ]);

  /*
   * ========================================
   * WHEN TIMER ENDS
   * ========================================
   */

  const timerFinished =
    question.length > 0 &&
    timeLeft <= 0;

  /*
   * ========================================
   * CURRENT PLAYER
   * ========================================
   */

  const myPlayer =
    room?.players.find(
      (player) =>
        player.id ===
        playerId
    );

  /*
   * ========================================
   * ROUND START RESET
   *
   * When a new question arrives,
   * clear old answer/message.
   * ========================================
   */

  useEffect(() => {
    if (!question) {
      return;
    }

    console.log(
      "🔄 NEW QUESTION:",
      question
    );

    setAnswer("");

    setMessage("");

    setCorrect(null);

    setAnswered(false);
  }, [question]);

  /*
   * ========================================
   * ANSWER RESULT
   * ========================================
   */

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleAnswerResult = (
      data: {
        success: boolean;
        correct?: boolean;
        points?: number;
        score?: number;
        message?: string;
      }
    ) => {
      console.log(
        "📝 ANSWER RESULT:",
        data
      );

      if (data.correct) {
        setCorrect(true);

        setAnswered(true);

        setMessage(
          data.message ||
            `Correct! +${
              data.points || 0
            }`
        );
      } else {
        setCorrect(false);

        /*
         * Wrong answer can be
         * submitted again.
         */
        setAnswered(false);

        setMessage(
          data.message ||
            "Wrong answer. Try again!"
        );
      }
    };

    const handleGameFinished =
      () => {
        console.log(
          "🏆 GAME FINISHED"
        );

        router.push(
          `/result/${roomCode}`
        );
      };

    socket.on(
      "answer_result",
      handleAnswerResult
    );

    socket.on(
      "game_finished",
      handleGameFinished
    );

    return () => {
      socket.off(
        "answer_result",
        handleAnswerResult
      );

      socket.off(
        "game_finished",
        handleGameFinished
      );
    };
  }, [
    socket,
    router,
    roomCode,
  ]);

  /*
   * ========================================
   * SUBMIT ANSWER
   * ========================================
   */

  const submitAnswer = () => {
    const cleanAnswer =
      answer.trim();

    if (!question) {
      setMessage(
        "Waiting for question..."
      );

      return;
    }

    if (timerFinished) {
      setMessage(
        "Time is up!"
      );

      return;
    }

    if (!cleanAnswer) {
      setMessage(
        "Please type an answer."
      );

      return;
    }

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

    if (answered) {
      return;
    }

    console.log(
      "📤 SUBMITTING:",
      cleanAnswer
    );

    socket.emit(
      "submit_answer",
      {
        roomCode,
        answer:
          cleanAnswer,
      }
    );
  };

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0F1020] text-white">
        <div className="text-center">

          <div className="mb-3 text-2xl font-bold">
            Loading game...
          </div>

          <p className="text-gray-400">
            Connecting to room{" "}
            {roomCode}
          </p>

        </div>
      </main>
    );
  }

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <main className="min-h-screen bg-[#0F1020] px-4 py-6 text-white md:px-6 md:py-8">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex items-start justify-between">

          <div>
            <p className="text-sm text-gray-400">
              Room{" "}
              {roomCode}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              WordRush
            </h1>
          </div>

          {/* TIMER */}

          <div
            className={`min-w-[100px] rounded-2xl px-5 py-3 text-center ${
              !question
                ? "bg-gray-700"
                : timeLeft <= 5
                  ? "bg-red-600"
                  : "bg-purple-600"
            }`}
          >

            <p className="text-xs uppercase tracking-wide text-white/80">
              Time
            </p>

            <p className="text-3xl font-black">
              {!question
                ? "--"
                : `${timeLeft}s`}
            </p>

          </div>

        </div>

        {/* ROUND */}

        <div className="mb-6 text-center">

          <p className="text-lg text-gray-400">

            Round{" "}

            <span className="font-bold text-white">
              {room.currentRound}
            </span>

            {" "} / {" "}

            {room.totalRounds}

          </p>

        </div>

        {/* GAME CARD */}

        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#191A2E] p-6 shadow-2xl md:p-10">

          {/* TITLE */}

          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Complete the word
          </p>

          {/* QUESTION */}

          <div className="mb-8 flex min-h-[110px] items-center justify-center px-2 text-center">

            {question ? (

              <div className="break-words text-3xl font-black leading-relaxed tracking-[0.08em] text-white md:text-5xl">

                {question}

              </div>

            ) : (

              <div className="text-2xl font-bold text-gray-500 md:text-4xl">

                Waiting for question...

              </div>

            )}

          </div>

          {/* ANSWER */}

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="text"

              value={answer}

              onChange={(event) => {
                setAnswer(
                  event.target.value
                );

                if (
                  message
                ) {
                  setMessage("");
                }

                if (
                  correct !==
                  null
                ) {
                  setCorrect(null);
                }
              }}

              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  submitAnswer();
                }
              }}

              placeholder={
                question
                  ? "Type your answer here..."
                  : "Waiting for question..."
              }

              disabled={
                !question ||
                timerFinished ||
                answered
              }

              autoComplete="off"

              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0F1020] px-5 py-4 text-lg font-semibold text-white outline-none placeholder:text-gray-500 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"

              onClick={
                submitAnswer
              }

              disabled={
                !question ||
                timerFinished ||
                answered
              }

              className="rounded-xl bg-purple-600 px-8 py-4 font-bold text-white transition hover:bg-purple-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {answered
                ? "Answered"
                : "Submit"}
            </button>

          </div>

          {/* MESSAGE */}

          {message && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-center font-semibold ${
                correct
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* PLAYER INFO */}

          <div className="mt-7 flex justify-center gap-8 text-sm text-gray-400">

            <div>
              Score

              <span className="ml-2 font-bold text-white">
                {myPlayer?.score ||
                  0}
              </span>
            </div>

            <div>
              Status

              <span className="ml-2 font-bold text-white">
                {timerFinished
                  ? "Time Up"
                  : answered
                    ? "Answered"
                    : question
                      ? "Playing"
                      : "Waiting"}
              </span>
            </div>

          </div>

        </div>

        {/* LEADERBOARD */}

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-[#191A2E] p-6">

          <h2 className="mb-5 text-xl font-bold">
            Live Leaderboard
          </h2>

          <div className="space-y-3">

            {[
              ...(room.players || []),
            ]
              .sort(
                (a, b) =>
                  b.score -
                  a.score
              )
              .map(
                (
                  player,
                  index
                ) => (
                  <div
                    key={
                      player.id
                    }

                    className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                      player.id ===
                      playerId
                        ? "bg-purple-600/20"
                        : "bg-[#0F1020]"
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <span className="w-6 text-gray-500">
                        {index + 1}
                      </span>

                      <span className="font-semibold">
                        {player.name}
                      </span>

                      {!player.connected && (
                        <span className="text-xs text-red-400">
                          Offline
                        </span>
                      )}

                    </div>

                    <span className="font-bold">
                      {player.score}
                    </span>

                  </div>
                )
              )}

          </div>

        </div>

      </div>

    </main>
  );
}