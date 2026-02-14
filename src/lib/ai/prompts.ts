export const SYSTEM_PROMPTS = {
  gameRecap: `You are an expert baseball journalist writing for GlobalBaseball, a website covering international baseball. Write engaging, informative game recaps that capture the key moments and performances. Use a professional sports journalism tone. Include relevant stats naturally in the narrative. Format your response in HTML with h2, h3, p, ul/li, strong, and blockquote tags. Do not include an h1 tag as the title is rendered separately.`,

  gamePreview: `You are an expert baseball analyst writing for GlobalBaseball, a website covering international baseball. Write compelling game previews that build excitement and provide useful context for fans. Discuss key matchups, player form, historical context between the teams, and what's at stake. Format your response in HTML with h2, h3, p, ul/li, strong, and blockquote tags. Do not include an h1 tag.`,

  standingsUpdate: `You are an expert baseball analyst writing for GlobalBaseball, a website covering international baseball. Write standings analysis articles that break down the current tournament picture. Discuss which teams are performing above or below expectations, key trends, and what teams need to do to advance. Format your response in HTML with h2, h3, p, ul/li, strong, and blockquote tags. Do not include an h1 tag.`,

  predictions: `You are an expert baseball analyst writing for GlobalBaseball, a website covering international baseball. Write prediction articles for upcoming games or tournament outcomes. Support your predictions with stats, recent form, and matchup analysis. Be bold but fair in your predictions. Format your response in HTML with h2, h3, p, ul/li, strong, and blockquote tags. Do not include an h1 tag.`,
};

export function buildGameRecapPrompt(data: {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  venue: string;
  date: string;
  boxscoreData: Record<string, unknown>;
  linescoreData: Record<string, unknown>;
  seriesDescription?: string;
}): string {
  return `Write a game recap article for the following baseball game:

**${data.awayTeam} ${data.awayScore} - ${data.homeTeam} ${data.homeScore}**
Date: ${data.date}
Venue: ${data.venue}
${data.seriesDescription ? `Series: ${data.seriesDescription}` : ""}

Box Score Data:
${JSON.stringify(data.boxscoreData, null, 2)}

Line Score Data:
${JSON.stringify(data.linescoreData, null, 2)}

Write an engaging 400-600 word recap covering:
1. The final result and key narrative
2. Standout individual performances (batting and pitching)
3. Key moments or turning points
4. What this means for both teams going forward

Also provide:
- A compelling article title (prefix with "TITLE: ")
- A 1-2 sentence excerpt (prefix with "EXCERPT: ")

Put the TITLE and EXCERPT at the very beginning before the HTML content.`;
}

export function buildGamePreviewPrompt(data: {
  awayTeam: string;
  homeTeam: string;
  venue: string;
  date: string;
  time: string;
  awayRecord?: string;
  homeRecord?: string;
  seriesDescription?: string;
}): string {
  return `Write a game preview article for the following upcoming baseball game:

**${data.awayTeam} vs ${data.homeTeam}**
Date: ${data.date}
Time: ${data.time}
Venue: ${data.venue}
${data.awayRecord ? `${data.awayTeam} Record: ${data.awayRecord}` : ""}
${data.homeRecord ? `${data.homeTeam} Record: ${data.homeRecord}` : ""}
${data.seriesDescription ? `Series: ${data.seriesDescription}` : ""}

Write an engaging 300-500 word preview covering:
1. What's at stake in this matchup
2. Key players to watch on both sides
3. Recent form and momentum
4. Prediction with reasoning

Also provide:
- A compelling article title (prefix with "TITLE: ")
- A 1-2 sentence excerpt (prefix with "EXCERPT: ")

Put the TITLE and EXCERPT at the very beginning before the HTML content.`;
}

export function buildStandingsUpdatePrompt(data: {
  standings: Record<string, unknown>[];
  date: string;
  tournament: string;
}): string {
  return `Write a standings analysis article for the ${data.tournament}:

Date: ${data.date}

Current Standings:
${JSON.stringify(data.standings, null, 2)}

Write an engaging 400-600 word article covering:
1. Current standings overview
2. Teams exceeding or falling short of expectations
3. Key trends and storylines
4. What each team needs to do to advance
5. Upcoming key matchups to watch

Also provide:
- A compelling article title (prefix with "TITLE: ")
- A 1-2 sentence excerpt (prefix with "EXCERPT: ")

Put the TITLE and EXCERPT at the very beginning before the HTML content.`;
}
