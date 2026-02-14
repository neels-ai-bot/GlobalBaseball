export interface Team {
  id: number;
  mlb_id: number | null;
  name: string;
  abbreviation: string;
  country: string;
  country_code: string;
  flag_emoji: string | null;
  league: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: number;
  mlb_id: number | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  team_id: number | null;
  position: string | null;
  jersey_number: string | null;
  bats: string | null;
  throws: string | null;
  birth_date: string | null;
  birth_country: string | null;
  height: string | null;
  weight: number | null;
  headshot_url: string | null;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Game {
  id: number;
  mlb_game_pk: number;
  game_date: string;
  game_time: string | null;
  status: "scheduled" | "live" | "final" | "postponed" | "cancelled";
  detailed_status: string | null;
  away_team_id: number | null;
  home_team_id: number | null;
  away_score: number | null;
  home_score: number | null;
  venue_name: string | null;
  venue_city: string | null;
  series_description: string | null;
  series_game_number: number | null;
  league: string;
  season: string;
  linescore: Record<string, unknown> | null;
  boxscore_data: Record<string, unknown> | null;
  recap_generated: boolean;
  preview_generated: boolean;
  created_at: string;
  updated_at: string;
  away_team?: Team;
  home_team?: Team;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  type: "recap" | "preview" | "standings" | "analysis" | "predictions";
  status: "draft" | "published" | "archived";
  featured_image: string | null;
  game_id: number | null;
  league: string;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  game?: Game;
}

export interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  status: "active" | "unsubscribed";
  leagues: string[];
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface StatsSnapshot {
  id: number;
  player_id: number | null;
  team_id: number | null;
  game_id: number | null;
  snapshot_type: string;
  stats_data: Record<string, unknown>;
  league: string;
  season: string;
  snapshot_date: string;
  created_at: string;
}

// Database type map for Supabase client
export interface Database {
  public: {
    Tables: {
      teams: { Row: Team; Insert: Omit<Team, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Team, "id">> };
      players: { Row: Player; Insert: Omit<Player, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Player, "id">> };
      games: { Row: Game; Insert: Omit<Game, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Game, "id">> };
      articles: { Row: Article; Insert: Omit<Article, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Article, "id">> };
      subscribers: { Row: Subscriber; Insert: Omit<Subscriber, "id" | "created_at">; Update: Partial<Omit<Subscriber, "id">> };
      stats_snapshots: { Row: StatsSnapshot; Insert: Omit<StatsSnapshot, "id" | "created_at">; Update: Partial<Omit<StatsSnapshot, "id">> };
    };
  };
}
