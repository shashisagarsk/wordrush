"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";

import { useSocket } from "@/hooks/useSocket";
import { useGameContext } from "@/context/GameContext";

interface JoinRoomResponse {
  success: boolean;
  roomCode?: string;
  playerId?: string;
  message?: string;
}

export default function JoinRoomCard() {
  const socket = useSocket();
  const router = useRouter();

  const { setPlayer } = useGameContext();

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socketReady, setSocketReady] = useState(false);

  /*
   * ==========================================
   * SOCKET CONNECTION STATUS
   * ==========================================
   */

  useEffect(() => {
    if (!socket) {
      setSocketReady(false);
      return;
    }

    const updateConnection = () => {
      setSocketReady(socket.connected);
    };

    // Check current state immediately
    updateConnection();

    socket.on("connect", updateConnection);
    socket.on("disconnect", updateConnection);

    return () => {
      socket.off("connect", updateConnection);
      socket.off("disconnect", updateConnection);
    };
  }, [socket]);

  /*
   * ==========================================
   * JOIN ROOM
   * ==========================================
   */

  const handleJoinRoom = () => {
    setError("");

    const cleanName = name.trim();
    const cleanRoomCode = roomCode
      .trim()
      .toUpperCase();

    /*
     * Validate name
     */

    if (cleanName.length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (cleanName.length > 20) {
      setError(
        "Name must be 20 characters or less."
      );
      return;
    }

    /*
     * Validate room code
     */

    if (cleanRoomCode.length !== 6) {
      setError(
        "Room code must be exactly 6 characters."
      );
      return;
    }

    /*
     * Socket check
     */

    if (!socket) {
      setError(
        "Socket is not ready. Please wait a moment."
      );
      return;
    }

    /*
     * Connection check
     */

    if (!socket.connected) {
      setError(
        "Socket is not connected. Please wait for the connection and try again."
      );

      // Try reconnecting
      socket.connect();

      return;
    }

    setLoading(true);

    console.log(
      "================================"
    );
    console.log("📤 JOIN ROOM");
    console.log("👤 Player:", cleanName);
    console.log("🏠 Room:", cleanRoomCode);
    console.log("🔌 Socket:", socket.id);
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

      setLoading(false);

      setError(
        "Server did not respond. Please check that the WordRush Socket server is running."
      );

      console.error(
        "❌ join_room timeout"
      );
    }, 10000);

    /*
     * Send join request
     */

    socket.emit(
      "join_room",
      {
        playerName: cleanName,
        roomCode: cleanRoomCode,
      },
      (
        response?: JoinRoomResponse
      ) => {
        /*
         * Prevent duplicate callback handling
         */

        if (completed) {
          return;
        }

        completed = true;

        window.clearTimeout(timeout);

        setLoading(false);

        console.log(
          "📥 JOIN ROOM RESPONSE:",
          response
        );

        /*
         * No response
         */

        if (!response) {
          setError(
            "No response received from the server."
          );

          return;
        }

        /*
         * Server rejected request
         */

        if (!response.success) {
          setError(
            response.message ||
              "Unable to join the room."
          );

          return;
        }

        /*
         * Get room code
         */

        const finalRoomCode = (
          response.roomCode ||
          cleanRoomCode
        )
          .trim()
          .toUpperCase();

        if (finalRoomCode.length !== 6) {
          console.error(
            "❌ Invalid room code:",
            finalRoomCode
          );

          setError(
            "Server returned an invalid room code."
          );

          return;
        }

        /*
         * Get player ID
         */

        const playerId =
          response.playerId ||
          socket.id;

        if (!playerId) {
          console.error(
            "❌ Missing player ID"
          );

          setError(
            "Unable to identify your player."
          );

          return;
        }

        /*
         * Save player information
         */

        setPlayer(
          playerId,
          cleanName
        );

        console.log(
          "✅ SUCCESSFULLY JOINED:",
          finalRoomCode
        );

        console.log(
          "👤 PLAYER ID:",
          playerId
        );

        console.log(
          "➡️ REDIRECT:",
          `/room/${finalRoomCode}`
        );

        /*
         * Navigate to lobby
         */

        router.push(
          `/room/${finalRoomCode}`
        );
      }
    );
  };

  /*
   * ==========================================
   * ENTER KEY HANDLER
   * ==========================================
   */

  const handleNameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!loading) {
      handleJoinRoom();
    }
  };

  const handleRoomCodeKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!loading) {
      handleJoinRoom();
    }
  };

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div className="rounded-2xl border border-white/10 bg-[#191A2E] p-6 shadow-xl">
      {/* Header */}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Join Room
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Enter your name and the 6-character room
          code.
        </p>
      </div>

      <div className="space-y-4">
        {/* =====================================
            NAME
        ====================================== */}

        <div>
          <label
            htmlFor="join-room-name"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Your Name
          </label>

          <input
            id="join-room-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);

              if (error) {
                setError("");
              }
            }}
            onKeyDown={handleNameKeyDown}
            placeholder="Enter your name"
            maxLength={20}
            disabled={loading}
            autoComplete="name"
            className="w-full rounded-xl border border-white/10 bg-[#0F1020] px-4 py-3 text-white outline-none placeholder:text-gray-500 transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* =====================================
            ROOM CODE
        ====================================== */}

        <div>
          <label
            htmlFor="join-room-code"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Room Code
          </label>

          <input
            id="join-room-code"
            type="text"
            value={roomCode}
            onChange={(event) => {
              const value = event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 6);

              setRoomCode(value);

              if (error) {
                setError("");
              }
            }}
            onKeyDown={handleRoomCodeKeyDown}
            placeholder="ABC123"
            maxLength={6}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-white/10 bg-[#0F1020] px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-white uppercase outline-none placeholder:text-gray-600 transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <p className="mt-2 text-xs text-gray-500">
            {roomCode.length}/6 characters
          </p>
        </div>

        {/* =====================================
            SOCKET STATUS
        ====================================== */}

        {!socketReady && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
            Connecting to game server...
          </div>
        )}

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        {/* =====================================
            BUTTON
        ====================================== */}

        <button
          type="button"
          onClick={handleJoinRoom}
          disabled={
            loading ||
            !socketReady ||
            name.trim().length < 2 ||
            roomCode.length !== 6
          }
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Joining Room..."
            : !socketReady
            ? "Connecting..."
            : "Join Room"}
        </button>
      </div>
    </div>
  );
}