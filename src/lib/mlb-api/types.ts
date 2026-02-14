// MLB Stats API Response Types

export interface MlbApiResponse<T> {
  copyright: string;
  totalItems?: number;
  totalEvents?: number;
  totalGames?: number;
  totalGamesInProgress?: number;
  dates?: T[];
  records?: T[];
  teams?: T[];
  people?: T[];
  stats?: T[];
}

export interface MlbScheduleDate {
  date: string;
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalGamesInProgress: number;
  games: MlbGame[];
}

export interface MlbGame {
  gamePk: number;
  link: string;
  gameType: string;
  season: string;
  gameDate: string;
  officialDate: string;
  status: MlbGameStatus;
  teams: {
    away: MlbGameTeam;
    home: MlbGameTeam;
  };
  venue: MlbVenue;
  description?: string;
  seriesDescription?: string;
  seriesGameNumber?: number;
  gamesInSeries?: number;
}

export interface MlbGameStatus {
  abstractGameState: "Preview" | "Live" | "Final";
  codedGameState: string;
  detailedState: string;
  statusCode: string;
  startTimeTBD: boolean;
  abstractGameCode: string;
}

export interface MlbGameTeam {
  score?: number;
  team: MlbTeam;
  isWinner?: boolean;
  seriesNumber?: number;
  leagueRecord?: {
    wins: number;
    losses: number;
    pct: string;
  };
}

export interface MlbTeam {
  id: number;
  name: string;
  link: string;
  abbreviation?: string;
  teamName?: string;
  shortName?: string;
  locationName?: string;
  venue?: MlbVenue;
  league?: { id: number; name: string };
  sport?: { id: number; name: string };
}

export interface MlbVenue {
  id: number;
  name: string;
  link: string;
  location?: {
    city: string;
    state?: string;
    country: string;
  };
}

export interface MlbStandingsRecord {
  standingsType: string;
  league: { id: number; name: string };
  division?: { id: number; name: string };
  teamRecords: MlbTeamRecord[];
}

export interface MlbTeamRecord {
  team: MlbTeam;
  season: string;
  streak: { streakCode: string };
  gamesPlayed: number;
  wins: number;
  losses: number;
  winningPercentage: string;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  divisionRank?: string;
  leagueRank?: string;
}

export interface MlbBoxScore {
  teams: {
    away: MlbBoxScoreTeam;
    home: MlbBoxScoreTeam;
  };
  officials?: MlbOfficial[];
}

export interface MlbBoxScoreTeam {
  team: MlbTeam;
  teamStats: {
    batting: MlbBattingStats;
    pitching: MlbPitchingStats;
  };
  players: Record<string, MlbBoxScorePlayer>;
  batters: number[];
  pitchers: number[];
  battingOrder: number[];
}

export interface MlbBoxScorePlayer {
  person: MlbPerson;
  jerseyNumber?: string;
  position: { code: string; name: string; abbreviation: string };
  stats: {
    batting?: MlbBattingStats;
    pitching?: MlbPitchingStats;
  };
  gameStatus?: {
    isCurrentBatter?: boolean;
    isCurrentPitcher?: boolean;
    isOnBench?: boolean;
    isSubstitute?: boolean;
  };
}

export interface MlbPerson {
  id: number;
  fullName: string;
  link: string;
  firstName?: string;
  lastName?: string;
  primaryNumber?: string;
  birthDate?: string;
  currentAge?: number;
  birthCity?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  active?: boolean;
  primaryPosition?: { code: string; name: string; abbreviation: string };
  batSide?: { code: string; description: string };
  pitchHand?: { code: string; description: string };
}

export interface MlbBattingStats {
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  avg?: string;
  obp?: string;
  slg?: string;
  ops?: string;
  atBats?: number;
  stolenBases?: number;
  leftOnBase?: number;
}

export interface MlbPitchingStats {
  inningsPitched?: string;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  homeRuns?: number;
  era?: string;
  whip?: string;
  pitchesThrown?: number;
  strikes?: number;
  wins?: number;
  losses?: number;
  saves?: number;
  holds?: number;
}

export interface MlbRoster {
  roster: MlbRosterEntry[];
  link: string;
  teamId: number;
  rosterType: string;
}

export interface MlbRosterEntry {
  person: MlbPerson;
  jerseyNumber: string;
  position: { code: string; name: string; abbreviation: string };
  status: { code: string; description: string };
}

export interface MlbOfficial {
  official: MlbPerson;
  officialType: string;
}

export interface MlbLinescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningState?: string;
  innings: MlbInning[];
  teams: {
    home: { runs: number; hits: number; errors: number };
    away: { runs: number; hits: number; errors: number };
  };
}

export interface MlbInning {
  num: number;
  ordinalNum: string;
  home: { runs?: number; hits?: number; errors?: number };
  away: { runs?: number; hits?: number; errors?: number };
}
