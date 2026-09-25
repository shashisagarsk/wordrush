"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSocket } from "@/hooks/useSocket";
import { useGameContext } from "@/context/GameContext";

interface CreateRoomResponse {
  success: boolean;
  roomCode?: string;
  playerId?: string;
  message?: string;
}

export default function CreateRoomCard() {
  const socket = useSocket();
  const router = useRouter();

  const { setPlayer } = useGameContext();

  const [name, setName] = useState("");
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
   * CREATE ROOM
   * ==========================================
   */

  const handleCreateRoom = () => {
    setError("");

    const cleanName = name.trim();

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
     * Check socket
     */
    if (!socket) {
      setError(
        "Socket is not ready. Please wait a moment."
      );
      return;
    }

    /*
     * Check connection
     */
    if (!socket.connected) {
      setError(
        "Socket is not connected. Please wait for the connection and try again."
      );

      /*
       * Try to reconnect
       */
      socket.connect();

      return;
    }

    setLoading(true);

    console.log("================================");
    console.log("📤 CREATE ROOM");
    console.log("👤 Player:", cleanName);
    console.log("🔌 Socket:", socket.id);
    console.log("================================");

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
        "Server did not respond. Please check that the WordRush Socket server is running on port 4000."
      );

      console.error(
        "❌ create_room timeout"
      );
    }, 10000);

    /*
     * Socket.IO create room
     */
    socket.emit(
      "create_room",
      {
        playerName: cleanName,
      },
      (response?: CreateRoomResponse) => {
        /*
         * Ignore duplicate callback
         */
        if (completed) {
          return;
        }

        completed = true;
        window.clearTimeout(timeout);

        console.log(
          "📥 CREATE ROOM RESPONSE:",
          response
        );

        setLoading(false);

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
         * Server returned error
         */
        if (!response.success) {
          setError(
            response.message ||
              "Unable to create room."
          );

          return;
        }

        /*
         * Room code missing
         */
        if (!response.roomCode) {
          console.error(
            "❌ Server response missing roomCode:",
            response
          );

          setError(
            "Room was created but no room code was returned."
          );

          return;
        }

        /*
         * Player ID
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

        const roomCode =
          response.roomCode
            .trim()
            .toUpperCase();

        console.log(
          "✅ ROOM CREATED:",
          roomCode
        );

        console.log(
          "👤 PLAYER ID:",
          playerId
        );

        console.log(
          "➡️ REDIRECT:",
          `/room/${roomCode}`
        );

        /*
         * Navigate to lobby
         */
        router.push(
          `/room/${roomCode}`
        );
      }
    );
  };

  /*
   * ==========================================
   * ENTER KEY
   * ==========================================
   */

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!loading) {
      handleCreateRoom();
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
          Create Room
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Create a room and invite your friends.
        </p>
      </div>

      {/* Form */}

      <div className="space-y-4">
        {/* Name */}

        <div>
          <label
            htmlFor="create-room-name"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Your Name
          </label>

          <input
            id="create-room-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);

              if (error) {
                setError("");
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
            maxLength={20}
            disabled={loading}
            autoComplete="name"
            className="w-full rounded-xl border border-white/10 bg-[#0F1020] px-4 py-3 text-white outline-none placeholder:text-gray-500 transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Socket status */}

        {!socketReady && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
            Connecting to game server...
          </div>
        )}

        {/* Error */}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        {/* Button */}

        <button
          type="button"
          onClick={handleCreateRoom}
          disabled={
            loading ||
            !socketReady ||
            name.trim().length < 2
          }
          className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating Room..."
            : !socketReady
            ? "Connecting..."
            : "Create Room"}
        </button>
      </div>
    </div>
  );
}