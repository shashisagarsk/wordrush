import { createServer } from "http";
import { Server, Socket } from "socket.io";

import {
  createRoom,
  addPlayer,
  getPublicRoom,
  startGame,
  submitAnswer,
  setPlayerDisconnected,
  closeJoining,
  nextRound,
  getRoom,
} from "./game-manager";

const PORT = Number(
  process.env.SOCKET_PORT || 4000
);

/*
 * ==========================================
 * HTTP SERVER
 * ==========================================
 */

const httpServer = createServer(
  (req, res) => {
    /*
     * Health check
     */

    if (req.url === "/health") {
      res.writeHead(200, {
        "Content-Type":
          "application/json",
        "Access-Control-Allow-Origin":
          "http://localhost:3000",
      });

      res.end(
        JSON.stringify({
          status: "ok",
          service: "wordrush-socket",
          port: PORT,
        })
      );

      return;
    }

    res.writeHead(404, {
      "Content-Type": "text/plain",
    });

    res.end("Not Found");
  }
);

/*
 * ==========================================
 * SOCKET.IO
 * ==========================================
 */

const io = new Server(
  httpServer,
  {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      methods: [
        "GET",
        "POST",
      ],
      credentials: false,
    },

    transports: [
      "polling",
      "websocket",
    ],

    allowEIO3: false,
  }
);

/*
 * ==========================================
 * ACTIVE TIMERS
 * ==========================================
 */

const activeTimers =
  new Map<string, NodeJS.Timeout>();

function clearRoomTimer(
  roomCode: string
) {
  const timer =
    activeTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(roomCode);
  }
}

/*
 * ==========================================
 * ROOM LOOP
 * ==========================================
 */

function handleRoomLoop(
  roomCode: string
) {
  const room =
    getRoom(roomCode);

  if (!room) {
    console.log(
      "⚠️ Room not found:",
      roomCode
    );

    return;
  }

  clearRoomTimer(roomCode);

  /*
   * JOINING
   */

  if (
    room.status === "JOINING"
  ) {
    const remaining =
      (room.joiningEndsAt ||
        Date.now()) -
      Date.now();

    const delay =
      Math.max(100, remaining);

    console.log(
      `⏳ Joining timer ${room.code}: ${Math.ceil(
        delay / 1000
      )}s`
    );

    const timer =
      setTimeout(() => {
        const currentRoom =
          getRoom(roomCode);

        if (!currentRoom) {
          return;
        }

        closeJoining(
          currentRoom
        );

        const publicRoom =
          getPublicRoom(
            roomCode
          );

        if (!publicRoom) {
          return;
        }

        console.log(
          "🎯 JOINING FINISHED:",
          roomCode
        );

        io.to(roomCode).emit(
          "room_state",
          publicRoom
        );

        const question =
          currentRoom
            .currentQuestion;

        const questionDisplay =
          typeof question === "object" && question !== null
            ? question.display
            : String(
                question || ""
              );

        console.log(
          "❓ QUESTION:",
          questionDisplay
        );

        console.log(
          "⏱️ ROUND ENDS:",
          currentRoom.roundEndsAt
        );

        io.to(roomCode).emit(
          "round_started",
          {
            round:
              currentRoom.currentRound,

            totalRounds:
              currentRoom.totalRounds,

            question:
              questionDisplay,

            roundEndsAt:
              currentRoom.roundEndsAt,
          }
        );

        handleRoomLoop(
          roomCode
        );
      }, delay);

    activeTimers.set(
      roomCode,
      timer
    );

    return;
  }

  /*
   * PLAYING
   */

  if (
    room.status === "PLAYING"
  ) {
    const remaining =
      (room.roundEndsAt ||
        Date.now()) -
      Date.now();

    const delay =
      Math.max(100, remaining);

    console.log(
      `⏱️ Round timer ${room.code}: ${Math.ceil(
        delay / 1000
      )}s`
    );

    const timer =
      setTimeout(() => {
        advanceRound(
          roomCode
        );
      }, delay);

    activeTimers.set(
      roomCode,
      timer
    );
  }
}

/*
 * ==========================================
 * ADVANCE ROUND
 * ==========================================
 */

function advanceRound(
  roomCode: string
) {
  const room =
    getRoom(roomCode);

  if (!room) {
    return;
  }

  console.log(
    "➡️ ADVANCING ROUND:",
    roomCode
  );

  clearRoomTimer(roomCode);

  nextRound(room);

  const updatedRoom =
    getPublicRoom(
      roomCode
    );

  if (!updatedRoom) {
    return;
  }

  io.to(roomCode).emit(
    "room_state",
    updatedRoom
  );

  /*
   * GAME FINISHED
   */

  if (
    updatedRoom.status ===
    "FINISHED"
  ) {
    console.log(
      "🏆 GAME FINISHED:",
      roomCode
    );

    io.to(roomCode).emit(
      "game_finished",
      updatedRoom
    );

    return;
  }

  /*
   * NEXT ROUND
   */

  if (
    updatedRoom.status ===
    "JOINING"
  ) {
    console.log(
      "🔄 NEXT ROUND JOINING:",
      updatedRoom.currentRound
    );

    io.to(roomCode).emit(
      "round_finished",
      updatedRoom
    );

    handleRoomLoop(
      roomCode
    );
  }
}

/*
 * ==========================================
 * SOCKET CONNECTION
 * ==========================================
 */

io.on(
  "connection",
  (socket: Socket) => {
    console.log("");
    console.log(
      "🟢 SOCKET CONNECTED"
    );
    console.log(
      "   ID:",
      socket.id
    );
    console.log(
      "   IP:",
      socket.handshake.address
    );
    console.log("");

    /*
     * ======================================
     * CREATE ROOM
     * ======================================
     */

    socket.on(
      "create_room",
      (
        data: {
          playerName: string;
        },
        callback?: (
          response: any
        ) => void
      ) => {
        try {
          const playerName =
            String(
              data?.playerName ||
                ""
            ).trim();

          if (!playerName) {
            callback?.({
              success: false,
              message:
                "Player name is required.",
            });

            return;
          }

          const room =
            createRoom(
              socket.id,
              playerName
            );

          socket.join(
            room.code
          );

          console.log(
            "🏠 ROOM CREATED:",
            room.code
          );

          callback?.({
            success: true,
            roomCode:
              room.code,
            playerId:
              socket.id,
          });

          io.to(
            room.code
          ).emit(
            "room_state",
            getPublicRoom(
              room.code
            )
          );
        } catch (error: any) {
          console.error(
            "❌ CREATE ROOM ERROR:",
            error
          );

          callback?.({
            success: false,
            message:
              error?.message ||
              "Failed to create room",
          });
        }
      }
    );

    /*
     * ======================================
     * JOIN ROOM
     * ======================================
     */

    socket.on(
      "join_room",
      (
        data: {
          roomCode: string;
          playerName: string;
        },
        callback?: (
          response: any
        ) => void
      ) => {
        try {
          const roomCode =
            String(
              data?.roomCode ||
                ""
            )
              .trim()
              .toUpperCase();

          const playerName =
            String(
              data?.playerName ||
                ""
            ).trim();

          if (
            !roomCode ||
            !playerName
          ) {
            callback?.({
              success: false,
              message:
                "Room code and name are required.",
            });

            return;
          }

          const room =
            addPlayer(
              roomCode,
              socket.id,
              playerName
            );

          socket.join(
            room.code
          );

          console.log(
            `👤 PLAYER JOINED: ${playerName} → ${room.code}`
          );

          callback?.({
            success: true,
            roomCode:
              room.code,
            playerId:
              socket.id,
          });

          io.to(
            room.code
          ).emit(
            "room_state",
            getPublicRoom(
              room.code
            )
          );
        } catch (error: any) {
          console.error(
            "❌ JOIN ROOM ERROR:",
            error
          );

          callback?.({
            success: false,
            message:
              error?.message ||
              "Failed to join room",
          });
        }
      }
    );

    /*
     * ======================================
     * GET ROOM
     * ======================================
     */

    socket.on(
      "get_room",
      (
        data: {
          roomCode: string;
        }
      ) => {
        const roomCode =
          String(
            data?.roomCode ||
              ""
          )
            .trim()
            .toUpperCase();

        if (!roomCode) {
          return;
        }

        console.log(
          "📡 GET ROOM:",
          roomCode
        );

        const room =
          getPublicRoom(
            roomCode
          );

        if (!room) {
          socket.emit(
            "room_error",
            {
              message:
                "Room not found",
            }
          );

          return;
        }

        socket.join(
          roomCode
        );

        socket.emit(
          "room_state",
          room
        );
      }
    );

    /*
     * ======================================
     * START GAME
     * ======================================
     */

    socket.on(
      "start_game",
      (
        data: {
          roomCode: string;
        },
        callback?: (
          response: any
        ) => void
      ) => {
        try {
          const roomCode =
            String(
              data?.roomCode ||
                ""
            )
              .trim()
              .toUpperCase();

          if (!roomCode) {
            callback?.({
              success: false,
              error:
                "Room code is required",
            });

            return;
          }

          console.log(
            "🎮 START GAME:",
            roomCode
          );

          const updatedRoom =
            startGame(
              roomCode
            );

          callback?.({
            success: true,
          });

          io.to(
            roomCode
          ).emit(
            "room_state",
            updatedRoom
          );

          handleRoomLoop(
            roomCode
          );
        } catch (error: any) {
          console.error(
            "❌ START GAME ERROR:",
            error
          );

          callback?.({
            success: false,
            error:
              error?.message ||
              "Failed to start game",
          });
        }
      }
    );

    /*
     * ======================================
     * SUBMIT ANSWER
     * ======================================
     */

    socket.on(
      "submit_answer",
      (
        data: {
          roomCode: string;
          answer: string;
        }
      ) => {
        try {
          const roomCode =
            String(
              data?.roomCode ||
                ""
            )
              .trim()
              .toUpperCase();

          const answer =
            String(
              data?.answer ||
                ""
            ).trim();

          if (
            !roomCode ||
            !answer
          ) {
            socket.emit(
              "answer_result",
              {
                success: false,
                message:
                  "Invalid answer payload",
              }
            );

            return;
          }

          const result =
            submitAnswer(
              roomCode,
              socket.id,
              answer
            );

          socket.emit(
            "answer_result",
            {
              success: true,
              correct:
                result?.correct,
              points:
                result?.points || 0,
              score:
                result?.score || 0,
              message:
                result?.correct
                  ? `Correct! +${
                      result?.points ||
                      0
                    }`
                  : "Wrong answer. Try again!",
            }
          );

          const room =
            getRoom(
              roomCode
            );

          if (!room) {
            return;
          }

          io.to(
            roomCode
          ).emit(
            "room_state",
            getPublicRoom(
              roomCode
            )
          );

          const activePlayers =
            room.players.filter(
              (player) =>
                player.active
            );

          const allFinished =
            activePlayers.length >
              0 &&
            activePlayers.every(
              (player) =>
                player.finished
            );

          if (allFinished) {
            advanceRound(
              roomCode
            );
          }
        } catch (error: any) {
          console.error(
            "❌ ANSWER ERROR:",
            error
          );

          socket.emit(
            "answer_result",
            {
              success: false,
              message:
                error?.message ||
                "Answer submission error",
            }
          );
        }
      }
    );

    /*
     * ======================================
     * DISCONNECT
     * ======================================
     */

    socket.on(
      "disconnect",
      () => {
        console.log(
          "🔴 SOCKET DISCONNECTED:",
          socket.id
        );

        try {
          setPlayerDisconnected(
            socket.id
          );
        } catch (error) {
          console.error(
            "❌ Disconnect handling error:",
            error
          );
        }
      }
    );
  }
);

/*
 * ==========================================
 * START SERVER
 * ==========================================
 */

httpServer.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "🚀 WordRush Socket Server"
    );
    console.log(
      `📡 http://localhost:${PORT}`
    );
    console.log(
      `❤️  http://localhost:${PORT}/health`
    );
    console.log(
      "======================================"
    );
    console.log("");
  }
);