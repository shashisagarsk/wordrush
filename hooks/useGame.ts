"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { RoomState } from "@/lib/types";

export function useGame(roomCode: string) {
  const socket = useSocket();

  const [room, setRoom] =
    useState<RoomState | null>(null);

  useEffect(() => {
    if (!socket || !roomCode) {
      return;
    }

    console.log(
      "🎮 useGame started for:",
      roomCode
    );

    /*
     * =========================================
     * ROOM STATE
     * =========================================
     */

    const handleRoomState = (
      data: RoomState
    ) => {
      console.log(
        "🏠 ROOM STATE RECEIVED:",
        data
      );

      console.log(
        "❓ QUESTION:",
        data.currentQuestion
      );

      console.log(
        "⏱️ ROUND ENDS:",
        data.roundEndsAt
      );

      setRoom(data);
    };

    /*
     * =========================================
     * GAME STATE
     * =========================================
     */

    const handleGameState = (
      data: RoomState
    ) => {
      console.log(
        "🎮 GAME STATE RECEIVED:",
        data
      );

      console.log(
        "❓ QUESTION:",
        data.currentQuestion
      );

      console.log(
        "⏱️ ROUND ENDS:",
        data.roundEndsAt
      );

      setRoom(data);
    };

    /*
     * =========================================
     * ROUND STARTED
     * =========================================
     */

    const handleRoundStarted = (data: {
      round: number;
      totalRounds: number;
      question: string;
      roundEndsAt: number;
    }) => {
      console.log(
        "🎯 ROUND STARTED RECEIVED:",
        data
      );

      console.log(
        "❓ QUESTION:",
        data.question
      );

      console.log(
        "⏱️ TIMER:",
        data.roundEndsAt
      );

      setRoom((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          status: "PLAYING",

          currentRound:
            data.round,

          totalRounds:
            data.totalRounds,

          currentQuestion:
            data.question,

          roundEndsAt:
            data.roundEndsAt,
        };
      });
    };

    /*
     * =========================================
     * ROUND FINISHED
     * =========================================
     */

    const handleRoundFinished = (
      data: RoomState
    ) => {
      console.log(
        "🏁 ROUND FINISHED:",
        data
      );

      setRoom(data);
    };

    /*
     * =========================================
     * GAME FINISHED
     * =========================================
     */

    const handleGameFinished = (
      data: RoomState
    ) => {
      console.log(
        "🏆 GAME FINISHED:",
        data
      );

      setRoom(data);
    };

    /*
     * =========================================
     * REGISTER SOCKET LISTENERS
     * =========================================
     */

    socket.on(
      "room_state",
      handleRoomState
    );

    socket.on(
      "game_state",
      handleGameState
    );

    socket.on(
      "round_started",
      handleRoundStarted
    );

    socket.on(
      "round_finished",
      handleRoundFinished
    );

    socket.on(
      "game_finished",
      handleGameFinished
    );

    /*
     * =========================================
     * REQUEST CURRENT ROOM
     * =========================================
     */

    console.log(
      "📡 Requesting room:",
      roomCode
    );

    socket.emit(
      "get_room",
      {
        roomCode,
      }
    );

    /*
     * =========================================
     * CLEANUP
     * =========================================
     */

    return () => {
      socket.off(
        "room_state",
        handleRoomState
      );

      socket.off(
        "game_state",
        handleGameState
      );

      socket.off(
        "round_started",
        handleRoundStarted
      );

      socket.off(
        "round_finished",
        handleRoundFinished
      );

      socket.off(
        "game_finished",
        handleGameFinished
      );
    };
  }, [
    socket,
    roomCode,
  ]);

  return {
    socket,
    room,
  };
}