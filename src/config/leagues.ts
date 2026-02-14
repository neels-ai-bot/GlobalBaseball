export interface LeagueConfig {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  enabled: boolean;
  apiSource: string;
  description: string;
}

export const leagues: LeagueConfig[] = [
  {
    id: "wbc",
    name: "World Baseball Classic",
    shortName: "WBC",
    slug: "wbc",
    enabled: true,
    apiSource: "mlb-stats-api",
    description: "The premier international baseball tournament featuring national teams from around the world.",
  },
  {
    id: "premier12",
    name: "WBSC Premier12",
    shortName: "Premier12",
    slug: "premier12",
    enabled: false,
    apiSource: "wbsc",
    description: "The WBSC's flagship international baseball competition.",
  },
  {
    id: "npb",
    name: "Nippon Professional Baseball",
    shortName: "NPB",
    slug: "npb",
    enabled: false,
    apiSource: "npb",
    description: "Japan's top professional baseball league.",
  },
  {
    id: "kbo",
    name: "Korea Baseball Organization",
    shortName: "KBO",
    slug: "kbo",
    enabled: false,
    apiSource: "kbo",
    description: "South Korea's premier baseball league.",
  },
];

export function getEnabledLeagues() {
  return leagues.filter((l) => l.enabled);
}

export function getLeagueBySlug(slug: string) {
  return leagues.find((l) => l.slug === slug);
}
