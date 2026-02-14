import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
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
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Latest Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
