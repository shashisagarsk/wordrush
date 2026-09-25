"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { RoomState } from "@/lib/types";
import { getSocket } from "@/lib/socket";

import Winner from "@/components/result/Winner";

export default function ResultPage() {
  const params = useParams();

  const roomCode = String(params.roomCode);

  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.emit("get_room", {
      roomCode,
    });

    const handler = (data: RoomState) => {
      setRoom(data);
    };

    socket.on("room_state", handler);

    return () => {
      socket.off("room_state", handler);
    };
  }, [roomCode]);

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">
          Loading results...
        </p>
      </main>
    );
  }

  return <Winner players={room.players} />;
}