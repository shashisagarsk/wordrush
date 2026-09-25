import { QUESTIONS } from "../lib/questions";
import type { Question } from "../lib/questions";
import type { Player, RoomState } from "../lib/types";
import {
  generateRoomCode,
  normalizeAnswer,
} from "../lib/utils";

export const rooms = new Map<string, RoomState>();

export const JOINING_DURATION = 5_000;
export const ROUND_DURATION = 15_000;
export const TOTAL_ROUNDS = 10;

/**
 * Shuffle questions using Fisher-Yates.
 *
 * Every room gets its own shuffled copy.
 * Therefore different rooms can get different question orders.
 */
function shuffleQuestions(
  questionList: Question[]
): Question[] {
  const shuffled = [...questionList];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}

/**
 * Get the next question without repeating.
 */
function getNextQuestion(
  room: RoomState
): Question {
  if (
    !room.questionPool ||
    room.questionPool.length === 0
  ) {
    throw new Error(
      "No questions available"
    );
  }

  const nextQuestion =
    room.questionPool.shift();

  if (!nextQuestion) {
    throw new Error(
      "Unable to get next question"
    );
  }

  return nextQuestion;
}

export function publicRoom(
  room: RoomState
): RoomState {
  return {
    ...room,

    players: room.players.map(
      (player) => ({
        ...player,
      })
    ),

    currentQuestion:
      typeof room.currentQuestion === "object" && room.currentQuestion !== null
        ? room.currentQuestion.display
        : room.currentQuestion,

    /**
     * Never send the complete question pool
     * to the client.
     */
    questionPool: undefined,
  };
}

export function createRoom(
  playerId: string,
  playerName: string
): RoomState {
  let roomCode =
    generateRoomCode();

  while (rooms.has(roomCode)) {
    roomCode =
      generateRoomCode();
  }

  const player: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    progress: 0,
    position: 0,
    connected: true,
    active: true,
    finished: false,
  };

  const room: RoomState = {
    code: roomCode,
    hostId: playerId,
    players: [player],

    status: "WAITING",

    currentRound: 0,
    totalRounds: TOTAL_ROUNDS,

    joiningEndsAt: null,
    roundEndsAt: null,

    currentQuestion: null,

    winnerId: null,

    /**
     * Each room gets its own shuffled
     * question pool.
     */
    questionPool:
      shuffleQuestions(QUESTIONS),
  };

  rooms.set(
    roomCode,
    room
  );

  return room;
}

export function getRoom(
  roomCode: string
): RoomState | undefined {
  return rooms.get(
    roomCode.toUpperCase()
  );
}

export function addPlayer(
  roomCode: string,
  playerId: string,
  playerName: string
): RoomState {
  const room =
    getRoom(roomCode);

  if (!room) {
    throw new Error(
      "Room not found"
    );
  }

  const existingPlayer =
    room.players.find(
      (player) =>
        player.id === playerId
    );

  if (existingPlayer) {
    existingPlayer.connected =
      true;

    return room;
  }

  const player: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    progress: 0,
    position: 0,
    connected: true,

    active:
      room.status === "WAITING" ||
      room.status === "JOINING",

    finished: false,
  };

  room.players.push(
    player
  );

  return room;
}

export function setPlayerDisconnected(
  roomCodeOrPlayerId: string,
  playerId?: string
) {
  if (playerId) {
    const room = getRoom(roomCodeOrPlayerId);
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.connected = false;
      }
      return;
    }
  }

  const targetId = playerId || roomCodeOrPlayerId;
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.id === targetId);
    if (player) {
      player.connected = false;
      break;
    }
  }
}

export function startGame(
  roomCode: string
): RoomState {
  const room =
    getRoom(roomCode);

  if (!room) {
    throw new Error(
      "Room not found"
    );
  }

  if (room.players.length < 2) {
    throw new Error(
      "At least 2 players are required"
    );
  }

  if (
    room.status !== "WAITING" &&
    room.status !== "JOINING"
  ) {
    throw new Error(
      "Game already started"
    );
  }

  /**
   * Fresh shuffle for every new game.
   */
  room.questionPool =
    shuffleQuestions(QUESTIONS);

  room.currentRound = 0;

  startJoining(room);

  return publicRoom(room);
}

export function startJoining(
  room: RoomState
) {
  room.status = "JOINING";

  room.joiningEndsAt =
    Date.now() +
    JOINING_DURATION;

  room.roundEndsAt = null;

  room.currentQuestion =
    null;

  for (const player of room.players) {
    player.active = true;
    player.finished = false;
  }
}

export function closeJoining(
  room: RoomState
) {
  room.status = "PLAYING";

  room.joiningEndsAt = null;

  room.currentRound += 1;

  /**
   * Get a RANDOM question from this
   * room's shuffled pool.
   *
   * Because the question is removed
   * using shift(), it cannot repeat.
   */
  const question =
    getNextQuestion(room);

  room.currentQuestion =
    question;

  room.roundEndsAt =
    Date.now() +
    ROUND_DURATION;

  for (const player of room.players) {
    if (player.active) {
      player.finished = false;
    }
  }
}

export function nextRound(
  room: RoomState
) {
  if (
    room.currentRound >=
    room.totalRounds
  ) {
    finishGame(room);
    return;
  }

  startJoining(room);
}

export function submitAnswer(
  roomCode: string,
  playerId: string,
  answer: string
) {
  const room =
    getRoom(roomCode);

  if (!room) {
    throw new Error(
      "Room not found"
    );
  }

  if (
    room.status !== "PLAYING"
  ) {
    throw new Error(
      "Round is not active"
    );
  }

  const player =
    room.players.find(
      (p) =>
        p.id === playerId
    );

  if (!player) {
    throw new Error(
      "Player not found"
    );
  }

  if (!player.active) {
    throw new Error(
      "You are waiting for the next round"
    );
  }

  if (player.finished) {
    throw new Error(
      "You already answered this round"
    );
  }

  if (!room.currentQuestion) {
    throw new Error(
      "Question not available"
    );
  }

  const submitted =
    normalizeAnswer(answer);

  /**
   * Current question is internally
   * stored as Question object.
   */
  const correctAnswer =
    typeof room.currentQuestion === "object" && room.currentQuestion !== null
      ? room.currentQuestion.answer
      : String(room.currentQuestion || "");

  const correct =
    normalizeAnswer(
      correctAnswer
    );

  if (submitted !== correct) {
    return {
      correct: false,
      points: 0,
    };
  }

  const elapsed =
    Date.now() -
    (
      room.roundEndsAt
        ? room.roundEndsAt -
          ROUND_DURATION
        : Date.now()
    );

  let points = 10;

  if (elapsed <= 3000) {
    points += 5;
  } else if (elapsed <= 5000) {
    points += 3;
  } else if (elapsed <= 10000) {
    points += 1;
  }

  player.score += points;

  player.position =
    (player.position || 0) + 1;

  player.finished = true;

  return {
    correct: true,
    points,
    score: player.score,
  };
}

export function finishGame(
  room: RoomState
): RoomState {
  room.status = "FINISHED";

  room.roundEndsAt = null;

  room.joiningEndsAt = null;

  const sorted =
    [...room.players].sort(
      (a, b) =>
        b.score - a.score
    );

  room.winnerId =
    sorted[0]?.id || null;

  return publicRoom(room);
}

export function getPublicRoom(
  roomCode: string
): RoomState | null {
  const room =
    getRoom(roomCode);

  if (!room) {
    return null;
  }

  return publicRoom(room);
}