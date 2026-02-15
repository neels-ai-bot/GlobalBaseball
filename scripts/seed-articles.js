const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://eijlmwuhelvzqvwhyhwu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpamxtd3VoZWx2enF2d2h5aHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExMDM1MywiZXhwIjoyMDg2Njg2MzUzfQ.4Y5ChMfnfv-oHkUKIUB24jw7a2__YFzJ6OChRm6bF7M"
);

const articles = [
  {
    slug: "wbc-2026-tournament-preview-what-to-expect",
    title: "WBC 2026 Tournament Preview: What to Expect This March",
    excerpt: "The World Baseball Classic returns in March 2026 with 20 nations competing for international baseball supremacy.",
    content: `<h2>The Stage Is Set</h2><p>The 2026 World Baseball Classic is just weeks away, and anticipation is building across the globe. Twenty national teams will converge for what promises to be the most competitive international baseball tournament in history.</p><h2>Defending Champions: Japan</h2><p>Japan enters as the defending champions after their thrilling victory in the 2023 WBC. With a deep pool of talent from both NPB and MLB, Samurai Japan will once again be the team to beat. Their combination of elite pitching, disciplined hitting, and fundamentally sound defense makes them formidable.</p><h2>Top Contenders</h2><p><strong>United States</strong> - Stacked with MLB All-Stars, Team USA is always among the favorites. Their raw power and pitching depth give them an edge in any matchup.</p><p><strong>Dominican Republic</strong> - The DR consistently fields one of the most talented rosters in the tournament. Their lineup is loaded with premium hitters who can change a game with one swing.</p><p><strong>South Korea</strong> - With a strong KBO pipeline and several MLB contributors, South Korea has the pitching and small-ball approach to compete with anyone.</p><h2>Dark Horses to Watch</h2><p><strong>Mexico</strong> - Mexican baseball has been on the rise, and their passionate fanbase provides an incredible home-field advantage.</p><p><strong>Venezuela</strong> - Always talented but sometimes inconsistent, Venezuela has the roster to make a deep run if their pitching holds up.</p><h2>What Makes This WBC Special</h2><p>The 2026 edition features expanded rosters and a refined tournament format. Pool play begins March 3rd, with games spread across multiple venues. The intensity of short-format international baseball creates dramatic moments that fans remember for years.</p><blockquote>International baseball brings a passion and pride that you simply cannot replicate in any other setting.</blockquote><p>Stay tuned to GlobalBaseball for complete coverage of every game, every stat, and every story throughout the 2026 World Baseball Classic.</p>`,
    type: "preview",
    status: "published",
    league: "wbc",
    tags: ["wbc", "preview", "2026", "tournament"],
    meta_title: "WBC 2026 Tournament Preview: What to Expect This March",
    meta_description: "Complete preview of the 2026 World Baseball Classic featuring 20 national teams competing for international baseball supremacy.",
    published_at: new Date().toISOString(),
  },
  {
    slug: "japan-defending-champions-wbc-2026-roster-analysis",
    title: "Japan as Defending Champions: WBC 2026 Roster Analysis",
    excerpt: "Breaking down Samurai Japan's roster and their path to defending the WBC title in 2026.",
    content: `<h2>Samurai Japan Returns</h2><p>As defending World Baseball Classic champions, Japan carries the weight of expectation into the 2026 tournament. Their 2023 triumph, capped by Shohei Ohtani's iconic strikeout of Mike Trout, elevated Japanese baseball to new heights globally.</p><h2>Pitching Excellence</h2><p>Japan's greatest strength has always been their pitching depth. NPB produces some of the most refined arms in the world, combining precise command with devastating breaking balls.</p><p><strong>Key pitching traits:</strong></p><ul><li>Elite command and pitch sequencing</li><li>Deep bullpen with multiple high-leverage options</li><li>Ability to limit walks and keep runners off base</li></ul><h2>Offensive Identity</h2><p>While Japan may not match the raw power of the United States or Dominican Republic, their offensive approach is among the most disciplined in the tournament. Situational hitting, bunting, and baserunning are hallmarks of the Japanese style.</p><h2>Defensive Fundamentals</h2><p>Perhaps no team in the WBC plays cleaner defense than Japan. Their infield precision, outfield positioning, and catcher-pitcher synergy make them exceptionally difficult to score against.</p><h2>Path to Repeat</h2><p>History tells us that defending the WBC title is extremely difficult. No team has won back-to-back titles since the tournament's inception. Japan will need to navigate a challenging pool stage before the elimination rounds.</p><blockquote>The pressure of defending a title can either fuel greatness or become a burden. Japan has the culture and composure to channel it positively.</blockquote><p>Follow our coverage throughout the tournament for game-by-game analysis of Japan's title defense.</p>`,
    type: "analysis",
    status: "published",
    league: "wbc",
    tags: ["wbc", "japan", "analysis", "roster"],
    meta_title: "Japan WBC 2026 Roster Analysis - Defending Champions Preview",
    meta_description: "Breaking down Samurai Japan roster and their path to defending the WBC title in 2026.",
    published_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    slug: "top-10-players-to-watch-wbc-2026",
    title: "Top 10 Players to Watch at the 2026 World Baseball Classic",
    excerpt: "From MVP candidates to breakout stars, these are the players who could define the 2026 WBC.",
    content: `<h2>The Stars Come Out</h2><p>The World Baseball Classic brings together the best baseball talent on the planet, all playing for national pride. Here are ten players who could define the 2026 tournament.</p><h2>1. Shohei Ohtani (Japan)</h2><p>The two-way superstar needs no introduction. Ohtani's ability to dominate both on the mound and at the plate makes him the most fascinating player in the tournament.</p><h2>2. Juan Soto (Dominican Republic)</h2><p>One of the purest hitters in baseball, Soto's plate discipline and power make him a nightmare for opposing pitchers in any format.</p><h2>3. Julio Rodriguez (Dominican Republic)</h2><p>The dynamic outfielder combines elite athleticism with rapidly developing power. Rodriguez could be the breakout star of this tournament.</p><h2>4. Corbin Carroll (USA)</h2><p>Speed, defense, and an improving bat make Carroll one of the most exciting young players Team USA can offer.</p><h2>5. Jung Hoo Lee (South Korea)</h2><p>After transitioning to MLB, Lee brings his exceptional contact skills and outfield defense to represent South Korea on the world stage.</p><h2>6. Randy Arozarena (Mexico)</h2><p>Known for his postseason heroics, Arozarena brings clutch performance and infectious energy to the Mexican lineup.</p><h2>7. Ronald Acuna Jr. (Venezuela)</h2><p>When healthy, Acuna is arguably the most talented position player in the world. His combination of speed, power, and arm strength is unmatched.</p><h2>8. Yoshinobu Yamamoto (Japan)</h2><p>The ace right-hander gives Japan yet another dominant pitching option. His splitter is among the best pitches in professional baseball.</p><h2>9. Vladimir Guerrero Jr. (Dominican Republic)</h2><p>Following in his father's footsteps of WBC excellence, Vladdy Jr. brings elite bat-to-ball skills and immense power to the heart of the DR lineup.</p><h2>10. Bobby Witt Jr. (USA)</h2><p>The young shortstop's blend of speed, power, and defensive wizardry makes him one of the most complete players in the tournament.</p><h2>Honorable Mentions</h2><p>Keep an eye on Marcus Semien (Canada), Mookie Betts (USA), and Fernando Tatis Jr. (Dominican Republic) as players who could steal the spotlight at any moment.</p>`,
    type: "analysis",
    status: "published",
    league: "wbc",
    tags: ["wbc", "players", "analysis", "2026"],
    meta_title: "Top 10 Players to Watch at WBC 2026",
    meta_description: "From Ohtani to Soto, these are the 10 players who could define the 2026 World Baseball Classic.",
    published_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

async function main() {
  for (const article of articles) {
    const { error } = await supabase.from("articles").upsert(article, { onConflict: "slug" });
    if (error) {
      console.log("Error:", article.slug, error.message);
    } else {
      console.log("Published:", article.title);
    }
  }
}
main();
