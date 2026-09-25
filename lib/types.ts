import type { Question } from "./questions";

export interface Player {
  id: string;
  name: string;
  score: number;
  progress?: number;
  position?: number;
  connected: boolean;
  active?: boolean;
  finished?: boolean;
}

export type RoomStatus =
  | "WAITING"
  | "JOINING"
  | "PLAYING"
  | "ROUND_RESULTS"
  | "FINISHED";

export interface RoomState {
  code: string;
  hostId: string;

  status: RoomStatus;

  players: Player[];

  currentRound: number;
  totalRounds: number;

  joiningEndsAt: number | null;
  roundEndsAt: number | null;

  /*
   * IMPORTANT:
   * Client only receives the question display.
   *
   * Example:
   * "J _ V _ S C R _ P T"
   */
  currentQuestion: Question | string | null;

  winnerId: string | null;

  /*
   * Server-side question pool.
   *
   * This should NEVER be sent to the browser.
   */
  questionPool?: Question[];
}