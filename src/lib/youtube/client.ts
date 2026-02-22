const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

interface YouTubeChannelStats {
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

export async function getChannelVideos(
  maxResults = 6
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) return [];

  try {
    const searchRes = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!searchRes.ok) return [];

    const data = await searchRes.json();

    return (data.items || []).map(
      (item: { id: { videoId: string }; snippet: { title: string; description: string; thumbnails: { high: { url: string } }; publishedAt: string } }) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
      })
    );
  } catch {
    return [];
  }
}

export async function getChannelStats(): Promise<YouTubeChannelStats | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) return null;

  try {
    const res = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=statistics&id=${channelId}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const stats = data.items?.[0]?.statistics;

    if (!stats) return null;

    return {
      subscriberCount: stats.subscriberCount,
      videoCount: stats.videoCount,
      viewCount: stats.viewCount,
    };
  } catch {
    return null;
  }
}
