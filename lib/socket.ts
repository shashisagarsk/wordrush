"use client";

import {
  io,
  type Socket,
} from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  const serverUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:4000";

  console.log(
    "🔌 WordRush Socket URL:",
    serverUrl
  );

  socket = io(serverUrl, {
    transports: ["polling", "websocket"],

    autoConnect: true,

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 10000,

    // Important for local development
    withCredentials: false,
  });

  socket.on("connect", () => {
    console.log(
      "🟢 WordRush Socket Connected:",
      socket?.id
    );
  });

  socket.on("connect_error", (error) => {
    console.error(
      "❌ WordRush Socket Connection Error:",
      error.message
    );

    console.error(
      "🔌 Socket URL:",
      serverUrl
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(
      "🔴 WordRush Socket Disconnected:",
      reason
    );
  });

  return socket;
}