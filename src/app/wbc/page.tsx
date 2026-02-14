import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Baseball Classic",
  description: "Complete coverage of the World Baseball Classic - schedules, standings, stats, and analysis.",
};

export default function WbcPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge className="mb-4 bg-yellow-500/20 text-yellow-200 border border-yellow-400/30">
            2026 Tournament
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            World Baseball Classic
          </h1>
          <p className="mt-4 text-lg text-blue-200 max-w-2xl">
            The premier international baseball tournament. Follow every game, every stat, every story.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/wbc/schedule">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">&#128197;</div>
                <h3 className="font-semibold text-lg">Schedule</h3>
                <p className="text-sm text-gray-600 mt-2">Full game schedule with times and venues</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/wbc/standings">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">&#127942;</div>
                <h3 className="font-semibold text-lg">Standings</h3>
                <p className="text-sm text-gray-600 mt-2">Pool standings and tournament bracket</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/wbc/teams">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">&#127758;</div>
                <h3 className="font-semibold text-lg">Teams</h3>
                <p className="text-sm text-gray-600 mt-2">All participating national teams</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/wbc/players">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">&#9918;</div>
                <h3 className="font-semibold text-lg">Players</h3>
                <p className="text-sm text-gray-600 mt-2">Player rosters and statistics</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Recent Games Placeholder */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Recent & Upcoming Games</h2>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Games will appear here once the tournament schedule is available.</p>
            <Link href="/wbc/schedule" className="mt-4 inline-block">
              <Button variant="outline">View Full Schedule</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
