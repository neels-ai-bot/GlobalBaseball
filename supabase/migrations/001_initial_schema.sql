-- GlobalBaseball Database Schema

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  mlb_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  flag_emoji TEXT,
  league TEXT NOT NULL DEFAULT 'wbc',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  mlb_id INTEGER UNIQUE,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  team_id INTEGER REFERENCES teams(id),
  position TEXT,
  jersey_number TEXT,
  bats TEXT,
  throws TEXT,
  birth_date DATE,
  birth_country TEXT,
  height TEXT,
  weight INTEGER,
  headshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  mlb_game_pk INTEGER UNIQUE NOT NULL,
  game_date DATE NOT NULL,
  game_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  detailed_status TEXT,
  away_team_id INTEGER REFERENCES teams(id),
  home_team_id INTEGER REFERENCES teams(id),
  away_score INTEGER,
  home_score INTEGER,
  venue_name TEXT,
  venue_city TEXT,
  series_description TEXT,
  series_game_number INTEGER,
  league TEXT NOT NULL DEFAULT 'wbc',
  season TEXT NOT NULL,
  linescore JSONB,
  boxscore_data JSONB,
  recap_generated BOOLEAN DEFAULT FALSE,
  preview_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'recap',
  status TEXT NOT NULL DEFAULT 'draft',
  featured_image TEXT,
  game_id INTEGER REFERENCES games(id),
  league TEXT NOT NULL DEFAULT 'wbc',
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscribers table (newsletter)
CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  leagues TEXT[] DEFAULT '{wbc}',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stats snapshots (for tracking stat changes over time)
CREATE TABLE IF NOT EXISTS stats_snapshots (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id),
  game_id INTEGER REFERENCES games(id),
  snapshot_type TEXT NOT NULL,
  stats_data JSONB NOT NULL,
  league TEXT NOT NULL DEFAULT 'wbc',
  season TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_league ON games(league);
CREATE INDEX IF NOT EXISTS idx_games_season ON games(season);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_league ON articles(league);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_mlb_id ON players(mlb_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_stats_player ON stats_snapshots(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_team ON stats_snapshots(team_id);
CREATE INDEX IF NOT EXISTS idx_stats_date ON stats_snapshots(snapshot_date);

-- Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access on games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read access on published articles" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access on stats" ON stats_snapshots FOR SELECT USING (true);

-- Service role full access (for cron jobs / API routes)
CREATE POLICY "Service role full access on teams" ON teams FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on players" ON players FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on games" ON games FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on articles" ON articles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on subscribers" ON subscribers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on stats" ON stats_snapshots FOR ALL USING (auth.role() = 'service_role');

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
