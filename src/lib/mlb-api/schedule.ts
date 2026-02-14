import { mlbFetch } from "./client";
import { WBC_SPORT_ID, CURRENT_WBC_SEASON, SCHEDULE_HYDRATE } from "./constants";
import type { MlbApiResponse, MlbScheduleDate } from "./types";

export async function getWbcSchedule(startDate?: string, endDate?: string) {
  const params: Record<string, string | number> = {
    sportId: WBC_SPORT_ID,
    season: CURRENT_WBC_SEASON,
    hydrate: SCHEDULE_HYDRATE,
  };

  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const data = await mlbFetch<MlbApiResponse<MlbScheduleDate>>("/schedule", { params });
  return data.dates || [];
}

export async function getGamesByDate(date: string) {
  const dates = await getWbcSchedule(date, date);
  return dates[0]?.games || [];
}

export async function getTodaysGames() {
  const today = new Date().toISOString().split("T")[0];
  return getGamesByDate(today);
}
