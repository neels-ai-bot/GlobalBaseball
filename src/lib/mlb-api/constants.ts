export const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

// WBC sport ID in MLB Stats API
export const WBC_SPORT_ID = 51;

// Game types
export const GAME_TYPES = {
  WORLD_BASEBALL_CLASSIC: "W",
  SPRING_TRAINING: "S",
  REGULAR_SEASON: "R",
  WILD_CARD: "F",
  DIVISION_SERIES: "D",
  LEAGUE_CHAMPIONSHIP: "L",
  WORLD_SERIES: "W",
} as const;

// Season for WBC
export const CURRENT_WBC_SEASON = "2026";

// WBC Team mapping (team ID to country info)
export const WBC_TEAMS: Record<number, { country: string; code: string; flag: string }> = {
  4664: { country: "Japan", code: "JPN", flag: "\u{1F1EF}\u{1F1F5}" },
  4665: { country: "South Korea", code: "KOR", flag: "\u{1F1F0}\u{1F1F7}" },
  4666: { country: "Chinese Taipei", code: "TPE", flag: "\u{1F3F4}" },
  4667: { country: "China", code: "CHN", flag: "\u{1F1E8}\u{1F1F3}" },
  4668: { country: "Australia", code: "AUS", flag: "\u{1F1E6}\u{1F1FA}" },
  4669: { country: "Philippines", code: "PHI", flag: "\u{1F1F5}\u{1F1ED}" },
  4670: { country: "Czech Republic", code: "CZE", flag: "\u{1F1E8}\u{1F1FF}" },
  4671: { country: "Netherlands", code: "NED", flag: "\u{1F1F3}\u{1F1F1}" },
  4672: { country: "Cuba", code: "CUB", flag: "\u{1F1E8}\u{1F1FA}" },
  4673: { country: "Italy", code: "ITA", flag: "\u{1F1EE}\u{1F1F9}" },
  4674: { country: "Panama", code: "PAN", flag: "\u{1F1F5}\u{1F1E6}" },
  4675: { country: "Israel", code: "ISR", flag: "\u{1F1EE}\u{1F1F1}" },
  4676: { country: "Dominican Republic", code: "DOM", flag: "\u{1F1E9}\u{1F1F4}" },
  4677: { country: "Venezuela", code: "VEN", flag: "\u{1F1FB}\u{1F1EA}" },
  4678: { country: "Puerto Rico", code: "PUR", flag: "\u{1F1F5}\u{1F1F7}" },
  4679: { country: "Nicaragua", code: "NCA", flag: "\u{1F1F3}\u{1F1EE}" },
  4680: { country: "USA", code: "USA", flag: "\u{1F1FA}\u{1F1F8}" },
  4681: { country: "Mexico", code: "MEX", flag: "\u{1F1F2}\u{1F1FD}" },
  4682: { country: "Canada", code: "CAN", flag: "\u{1F1E8}\u{1F1E6}" },
  4683: { country: "Colombia", code: "COL", flag: "\u{1F1E8}\u{1F1F4}" },
  4684: { country: "Great Britain", code: "GBR", flag: "\u{1F1EC}\u{1F1E7}" },
};

// Hydration params for richer API responses
export const SCHEDULE_HYDRATE = "team,venue,game(content(summary)),linescore,flags,seriesStatus";
export const BOXSCORE_HYDRATE = "person,stats";
