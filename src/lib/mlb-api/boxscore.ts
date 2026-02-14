import { mlbFetch } from "./client";
import type { MlbBoxScore, MlbLinescore } from "./types";

export async function getBoxScore(gamePk: number) {
  const data = await mlbFetch<MlbBoxScore>(`/game/${gamePk}/boxscore`, {
    revalidate: 60,
  });
  return data;
}

export async function getLinescore(gamePk: number) {
  const data = await mlbFetch<MlbLinescore>(`/game/${gamePk}/linescore`, {
    revalidate: 60,
  });
  return data;
}

export async function getGameFeed(gamePk: number) {
  const data = await mlbFetch<{ gameData: Record<string, unknown>; liveData: { boxscore: MlbBoxScore; linescore: MlbLinescore } }>(
    `/game/${gamePk}/feed/live`,
    { revalidate: 60 }
  );
  return data;
}
