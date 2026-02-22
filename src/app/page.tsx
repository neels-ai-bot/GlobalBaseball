import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch latest articles
  const { data: latestArticles } = await supabase
    .from("articles")
    .select("slug, title, type, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  // Fetch today's games
  const today = new Date().toISOString().split("T")[0];
  const { data: todaysGames } = await supabase
    .from("games")
    .select(`
      id, mlb_game_pk, status, away_score, home_score, game_time,
      away_team:teams!games_away_team_id_fkey(country, flag_emoji),
      home_team:teams!games_home_team_id_fkey(country, flag_emoji)
    `)
    .eq("game_date", today)
    .order("game_time", { ascending: true })
    .limit(4);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <Badge variant="info" className="mb-4 bg-blue-500/30 text-white border border-blue-400/30">
            World Baseball Classic 2026
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your Home for International Baseball
          </h1>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
            Live scores, standings, stats, and AI-powered analysis covering the World Baseball Classic and international baseball tournaments worldwide.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/wbc">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Explore WBC Coverage
              </Button>
            </Link>
            <a href={siteConfig.links.youtube} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-red-600 text-white hover:bg-red-700 border-0">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Watch on YouTube
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Live Scores / Today's Games */}
      {todaysGames && todaysGames.length > 0 && (
        <section className="bg-gray-900 text-white py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 overflow-x-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Today</span>
              {todaysGames.map((game) => {
                const away = Array.isArray(game.away_team) ? game.away_team[0] : game.away_team;
                const home = Array.isArray(game.home_team) ? game.home_team[0] : game.home_team;
                return (
                  <Link
                    key={game.id}
                    href={`/wbc/games/${game.mlb_game_pk}`}
                    className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    <span className="text-sm">
                      {away?.flag_emoji} {away?.country || "TBD"}
                      {game.status === "final" || game.status === "live" ? ` ${game.away_score}` : ""}
                    </span>
                    <span className="text-gray-500 text-xs">vs</span>
                    <span className="text-sm">
                      {home?.flag_emoji} {home?.country || "TBD"}
                      {game.status === "final" || game.status === "live" ? ` ${game.home_score}` : ""}
                    </span>
                    {game.status === "live" && (
                      <Badge variant="error" className="text-xs">LIVE</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Complete International Baseball Coverage
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-4">&#128202;</div>
              <h3 className="text-lg font-semibold mb-2">Live Standings</h3>
              <p className="text-gray-600">
                Real-time standings updated throughout the tournament. Track every pool and bracket race.
              </p>
              <Link href="/wbc/standings" className="mt-4 inline-block text-blue-600 text-sm font-medium hover:underline">
                View Standings &rarr;
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-4">&#128197;</div>
              <h3 className="text-lg font-semibold mb-2">Full Schedule</h3>
              <p className="text-gray-600">
                Complete game schedule with scores, times, and venues for every WBC matchup.
              </p>
              <Link href="/wbc/schedule" className="mt-4 inline-block text-blue-600 text-sm font-medium hover:underline">
                View Schedule &rarr;
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-4">&#9997;&#65039;</div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                In-depth game recaps, previews, and analysis generated automatically after every game.
              </p>
              <Link href="/blog" className="mt-4 inline-block text-blue-600 text-sm font-medium hover:underline">
                Read Articles &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Latest Articles */}
      {latestArticles && latestArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Latest Articles</h2>
            <Link href="/blog" className="text-blue-600 text-sm font-medium hover:underline">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {latestArticles.map((article) => (
              <Link key={article.slug} href={`/blog/${article.slug}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <Badge variant={article.type === "recap" ? "success" : article.type === "preview" ? "info" : "default"} className="mb-3">
                      {article.type}
                    </Badge>
                    <h3 className="font-semibold line-clamp-2 mb-2">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-3">{article.excerpt}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Teams Showcase */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Featured Teams</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Follow your favorite national teams through the World Baseball Classic tournament.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              { name: "Japan", flag: "&#127471;&#127477;" },
              { name: "USA", flag: "&#127482;&#127480;" },
              { name: "Dominican Rep.", flag: "&#127465;&#127476;" },
              { name: "South Korea", flag: "&#127472;&#127479;" },
              { name: "Mexico", flag: "&#127474;&#127485;" },
              { name: "Venezuela", flag: "&#127483;&#127466;" },
            ].map((team) => (
              <Card key={team.name} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="py-6">
                  <div className="text-4xl mb-2" dangerouslySetInnerHTML={{ __html: team.flag }} />
                  <p className="text-sm font-medium">{team.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/wbc/teams">
              <Button variant="outline">View All Teams</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="bg-blue-600 text-white border-0">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Stay in the Game</h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Get daily recaps, tournament updates, and expert analysis delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Button className="bg-white text-blue-700 hover:bg-blue-50">
                Subscribe
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
