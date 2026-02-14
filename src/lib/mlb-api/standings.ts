import { mlbFetch } from "./client";
import { WBC_SPORT_ID, CURRENT_WBC_SEASON } from "./constants";
import type { MlbApiResponse, MlbStandingsRecord } from "./types";

export async function getWbcStandings() {
  const data = await mlbFetch<MlbApiResponse<MlbStandingsRecord>>("/standings", {
    params: {
      leagueId: 160, // WBC league ID
      season: CURRENT_WBC_SEASON,
      standingsTypes: "regularSeason",
      hydrate: "team",
    },
    revalidate: 600,
  });

  return data.records || [];
}
