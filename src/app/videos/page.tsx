import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { siteConfig } from "@/config/site";
import { getChannelVideos, getChannelStats } from "@/lib/youtube/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch the latest international baseball videos, game previews, and analysis on the GlobalBaseball YouTube channel.",
};

export default async function VideosPage() {
  const videos = await getChannelVideos(9);
  const stats = await getChannelStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Videos</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Game previews, team breakdowns, matchup analysis, and more on our YouTube channel.
        </p>
        {stats && (
          <div className="mt-4 flex justify-center gap-8 text-sm text-gray-500">
            <span><strong>{Number(stats.subscriberCount).toLocaleString()}</strong> subscribers</span>
            <span><strong>{Number(stats.videoCount).toLocaleString()}</strong> videos</span>
            <span><strong>{Number(stats.viewCount).toLocaleString()}</strong> views</span>
          </div>
        )}
        <a
          href={siteConfig.links.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block"
        >
          <Button size="lg" className="bg-red-600 text-white hover:bg-red-700">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Subscribe on YouTube
          </Button>
        </a>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <YouTubeEmbed videoId={video.id} title={video.title} />
              <CardContent className="pt-4">
                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center">
              <CardContent className="py-12">
                <div className="text-4xl mb-4">&#127916;</div>
                <h3 className="text-lg font-semibold mb-2">Team Previews</h3>
                <p className="text-sm text-gray-600">
                  In-depth breakdowns of all 20 WBC 2026 national teams.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="py-12">
                <div className="text-4xl mb-4">&#9876;&#65039;</div>
                <h3 className="text-lg font-semibold mb-2">Matchup Analysis</h3>
                <p className="text-sm text-gray-600">
                  Head-to-head breakdowns for every pool play matchup.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="py-12">
                <div className="text-4xl mb-4">&#128202;</div>
                <h3 className="text-lg font-semibold mb-2">Standings Updates</h3>
                <p className="text-sm text-gray-600">
                  Daily standings recaps and tournament bracket analysis.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              Videos coming soon! Subscribe to our{" "}
              <a
                href={siteConfig.links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline font-medium"
              >
                YouTube channel
              </a>
              {" "}to get notified.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
