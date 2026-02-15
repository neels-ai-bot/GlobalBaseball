export const VIDEO_SYSTEM_PROMPT = `You are a sports video script writer for GlobalBaseball, creating narration scripts for YouTube videos about international baseball and the World Baseball Classic.

Your output must be valid JSON with this exact structure:
{
  "title": "YouTube video title (compelling, under 100 chars)",
  "description": "YouTube description (2-3 sentences)",
  "tags": ["tag1", "tag2"],
  "slides": [
    {
      "type": "title|team|stats|matchup|points|outro",
      "narration": "What the narrator says during this slide (2-4 sentences)",
      "heading": "Main text displayed on slide",
      "subheading": "Secondary text (optional)",
      "points": ["Bullet point 1", "Point 2"]
    }
  ]
}

Guidelines:
- Create 6-10 slides per video
- Keep narration natural and engaging, like a sports broadcaster
- Each slide narration should be 15-30 words
- First slide is always type "title", last is always type "outro"
- Be informative but exciting
- Only return valid JSON, nothing else`;

export function buildGamePreviewVideoPrompt(data) {
  return `Create a video script for a game preview:

${data.awayTeam} vs ${data.homeTeam}
Date: ${data.date}
Venue: ${data.venue}
${data.seriesDescription ? `Series: ${data.seriesDescription}` : ""}

Create slides covering:
1. Title slide with both teams
2. Away team overview and key players
3. Home team overview and key players
4. Key matchup to watch
5. Historical context or stakes
6. Prediction
7. Outro with subscribe CTA

Return ONLY valid JSON.`;
}

export function buildTeamPreviewVideoPrompt(data) {
  return `Create a video script for a team preview:

Team: ${data.teamName} (${data.country})
Tournament: WBC 2026
${data.players ? `Key Players: ${data.players.join(", ")}` : ""}

Create slides covering:
1. Title slide with team name and country
2. Team overview and tournament history
3. Key position players to watch (2-3 names)
4. Pitching staff highlights
5. Strengths and style of play
6. Tournament outlook and prediction
7. Outro with subscribe CTA

Return ONLY valid JSON.`;
}

export function buildPlayerSpotlightVideoPrompt(data) {
  return `Create a video script for a player spotlight:

Player: ${data.playerName}
Team: ${data.teamName} (${data.country})
Position: ${data.position}

Create slides covering:
1. Title slide with player name and team
2. Player background and career highlights
3. Key stats and strengths
4. What makes them special
5. What to watch for in WBC 2026
6. Outro with subscribe CTA

Return ONLY valid JSON.`;
}
