"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

import { getSocket } from "@/lib/socket";

export function useSocket() {
  const [socket, setSocket] =
    useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = getSocket();

    setSocket(socketInstance);

    return () => {
      // We intentionally don't disconnect here.
      // The socket should remain available while
      // navigating between pages.
    };
  }, []);

  return socket;
}