"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface GameContextType {
  playerId: string | null;
  playerName: string | null;

  setPlayer: (
    id: string,
    name: string
  ) => void;

  clearPlayer: () => void;
}

const GameContext =
  createContext<GameContextType | undefined>(
    undefined
  );

export function GameProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [playerId, setPlayerId] =
    useState<string | null>(null);

  const [playerName, setPlayerName] =
    useState<string | null>(null);

  useEffect(() => {
    const savedPlayerId =
      localStorage.getItem(
        "wordrush_player_id"
      );

    const savedPlayerName =
      localStorage.getItem(
        "wordrush_player_name"
      );

    if (savedPlayerId) {
      setPlayerId(savedPlayerId);
    }

    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }
  }, []);

  const setPlayer = (
    id: string,
    name: string
  ) => {
    localStorage.setItem(
      "wordrush_player_id",
      id
    );

    localStorage.setItem(
      "wordrush_player_name",
      name
    );

    setPlayerId(id);
    setPlayerName(name);
  };

  const clearPlayer = () => {
    localStorage.removeItem(
      "wordrush_player_id"
    );

    localStorage.removeItem(
      "wordrush_player_name"
    );

    setPlayerId(null);
    setPlayerName(null);
  };

  return (
    <GameContext.Provider
      value={{
        playerId,
        playerName,
        setPlayer,
        clearPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext(): GameContextType {
  const context =
    useContext(GameContext);

  if (!context) {
    throw new Error(
      "useGameContext must be used inside GameProvider"
    );
  }

  return context;
}