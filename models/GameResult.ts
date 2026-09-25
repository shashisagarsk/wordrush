import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IGameResult extends Document {
  roomCode: string;
  winnerId: string;
  winnerName: string;

  players: {
    playerId: string;
    name: string;
    score: number;
  }[];

  createdAt: Date;
}

const GameResultSchema =
  new Schema<IGameResult>(
    {
      roomCode: {
        type: String,
        required: true,
        index: true,
      },

      winnerId: {
        type: String,
        required: true,
      },

      winnerName: {
        type: String,
        required: true,
      },

      players: [
        {
          playerId: String,
          name: String,
          score: Number,
        },
      ],
    },
    {
      timestamps: true,
    }
  );

const GameResult: Model<IGameResult> =
  mongoose.models.GameResult ||
  mongoose.model<IGameResult>(
    "GameResult",
    GameResultSchema
  );

export default GameResult;