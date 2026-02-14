import { mlbFetch } from "./client";
import { WBC_SPORT_ID, CURRENT_WBC_SEASON } from "./constants";
import type { MlbApiResponse, MlbTeam } from "./types";

export async function getWbcTeams() {
  const data = await mlbFetch<MlbApiResponse<MlbTeam>>("/teams", {
    params: {
      sportId: WBC_SPORT_ID,
      season: CURRENT_WBC_SEASON,
    },
    revalidate: 3600,
  });

  return data.teams || [];
}

export async function getTeamById(teamId: number) {
  const data = await mlbFetch<MlbApiResponse<MlbTeam>>(`/teams/${teamId}`, {
    params: {
      hydrate: "venue,league",
    },
    revalidate: 3600,
  });

  const teams = data.teams || [];
  return teams[0] || null;
}
