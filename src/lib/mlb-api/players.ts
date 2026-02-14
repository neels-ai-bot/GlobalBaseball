import { mlbFetch } from "./client";
import type { MlbApiResponse, MlbPerson, MlbRoster } from "./types";

export async function getPlayer(playerId: number) {
  const data = await mlbFetch<MlbApiResponse<MlbPerson>>(`/people/${playerId}`, {
    params: {
      hydrate: "currentTeam,team,stats(type=[season,career],group=[hitting,pitching,fielding])",
    },
    revalidate: 3600,
  });

  const people = data.people || [];
  return people[0] || null;
}

export async function getTeamRoster(teamId: number) {
  const data = await mlbFetch<MlbRoster>(`/teams/${teamId}/roster`, {
    params: {
      rosterType: "fullRoster",
    },
    revalidate: 3600,
  });

  return data.roster || [];
}
