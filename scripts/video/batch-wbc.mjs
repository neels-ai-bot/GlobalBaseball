#!/usr/bin/env node
// batch-wbc.mjs - Generate all WBC 2026 team & matchup videos + website articles
// Usage: node scripts/video/batch-wbc.mjs [--teams-only] [--matchups-only] [--articles-only]

import { mkdirSync, appendFileSync, existsSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "./config.mjs";
import { generateSlideAudio } from "./tts.mjs";
import { generateOverlayImages } from "./graphics.mjs";
import { composeBroadcastVideo } from "./composer.mjs";
import { downloadPlayerHeadshots } from "./media.mjs";
import { getCuratedWBCClips, getTeamClips, getMatchupClips } from "./wbc-history.mjs";

for (const dir of Object.values(CONFIG.paths)) mkdirSync(dir, { recursive: true });

const LOG_FILE = path.join(CONFIG.paths.output, "batch-log.txt");
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
const args = process.argv.slice(2);

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── WBC 2026 Team Data ─────────────────────────────────────

const TEAMS = [
  {
    country: "Japan", short: "JPN", pool: "A", ranking: "#1",
    desc: "Two-time defending WBC champions with the deepest talent pool in international baseball",
    history: "3x WBC Champions (2006, 2009, 2023). Japan has reached the final in four of five WBC tournaments, cementing their dynasty status.",
    strengths: ["Elite pitching depth from NPB and MLB", "Disciplined small-ball offense", "Flawless defensive fundamentals"],
    outlook: "Japan enters as overwhelming favorites. With Shohei Ohtani leading the charge and a pitching staff that rivals any MLB rotation, Samurai Japan will be incredibly difficult to beat.",
    players: [
      { name: "Shohei Ohtani", mlbId: 660271, position: "DH/P" },
      { name: "Yoshinobu Yamamoto", mlbId: 808967, position: "SP" },
      { name: "Yu Darvish", mlbId: 506433, position: "SP" },
      { name: "Seiya Suzuki", mlbId: 673548, position: "OF" },
    ],
  },
  {
    country: "South Korea", short: "KOR", pool: "A", ranking: "#3",
    desc: "A perennial powerhouse with a blend of KBO stars and MLB talent",
    history: "2009 WBC runners-up. South Korea has consistently been one of Asia's top baseball nations with deep professional league talent.",
    strengths: ["Strong KBO pitching pipeline", "Aggressive offensive approach", "International tournament experience"],
    outlook: "South Korea will look to Kim Ha-seong and Lee Jung-hoo to anchor a dangerous lineup, backed by KBO pitching talent that thrives in short tournaments.",
    players: [
      { name: "Kim Ha-seong", mlbId: 673490, position: "SS" },
      { name: "Lee Jung-hoo", mlbId: 808982, position: "OF" },
    ],
  },
  {
    country: "Australia", short: "AUS", pool: "A", ranking: "#10",
    desc: "The rising force of the Pacific with improving professional development",
    history: "Regular WBC participant since 2006. Australia has steadily improved their baseball program through the ABL and MLB partnerships.",
    strengths: ["Athletic, versatile players", "Strong pitching development program", "Competitive underdog mentality"],
    outlook: "Australia will rely on their competitive spirit and improving talent base. A deep run would be a major statement for Pacific baseball.",
    players: [
      { name: "Liam Hendriks", mlbId: 521230, position: "RP" },
    ],
  },
  {
    country: "Czech Republic", short: "CZE", pool: "A", ranking: "#15",
    desc: "The surprise package of European baseball making their WBC mark",
    history: "Debuted in the 2023 WBC and shocked the world by competing fiercely against established programs, earning global respect.",
    strengths: ["Heart and determination", "Disciplined European-style approach", "Nothing to lose mentality"],
    outlook: "The Czech Republic proved in 2023 that they belong. Expect another spirited effort that could produce upsets against bigger names.",
    players: [],
  },
  {
    country: "China", short: "CHN", pool: "A", ranking: "#21",
    desc: "Asia's emerging baseball nation with a growing talent pipeline",
    history: "Multiple WBC appearances. China continues to develop their baseball infrastructure with the goal of becoming competitive in Asia.",
    strengths: ["Rapidly improving talent development", "Young, athletic roster", "Government-backed sports program"],
    outlook: "China faces a tough pool but every game is a chance to gain experience and show the growth of Chinese baseball on the world stage.",
    players: [],
  },
  {
    country: "United States", short: "USA", pool: "B", ranking: "#2",
    desc: "MLB's home nation loaded with All-Star talent at every position",
    history: "2017 WBC Champions. The USA has embraced the WBC with increasing commitment, sending top MLB stars to represent their country.",
    strengths: ["MLB All-Star talent at every position", "Deep pitching rotation with power arms", "Explosive lineup led by young sluggers"],
    outlook: "Team USA enters with arguably the most talented roster in the tournament. With Bobby Witt Jr., Trea Turner, and Corbin Carroll, the offense is electric.",
    players: [
      { name: "Bobby Witt Jr.", mlbId: 677951, position: "SS" },
      { name: "Trea Turner", mlbId: 607208, position: "SS/2B" },
      { name: "Corbin Carroll", mlbId: 682998, position: "OF" },
      { name: "Paul Goldschmidt", mlbId: 502671, position: "1B" },
    ],
  },
  {
    country: "Mexico", short: "MEX", pool: "B", ranking: "#4",
    desc: "A rising program with deep MLB talent and passionate fanbase",
    history: "2023 WBC semifinalists. Mexico has emerged as a legitimate contender with a growing pool of MLB-caliber players.",
    strengths: ["Deep MLB-quality lineup", "Strong pitching depth", "Passionate, energized play style"],
    outlook: "Mexico shocked the world in 2023 by reaching the semifinals. With even more talent available, they are a legitimate threat to reach the final.",
    players: [
      { name: "Isaac Paredes", mlbId: 670623, position: "3B" },
      { name: "Alex Verdugo", mlbId: 657077, position: "OF" },
      { name: "Rowdy Tellez", mlbId: 642133, position: "1B" },
    ],
  },
  {
    country: "Great Britain", short: "GBR", pool: "B", ranking: "#16",
    desc: "Representing European baseball with heritage-eligible MLB talent",
    history: "Growing WBC presence. Great Britain has benefited from heritage eligibility rules to field competitive rosters.",
    strengths: ["Heritage-eligible MLB talent", "Improving domestic program", "Underdog resilience"],
    outlook: "Great Britain could surprise in Pool B with a mix of heritage-eligible MLB players and improving domestic talent.",
    players: [
      { name: "Trayce Thompson", mlbId: 572204, position: "OF" },
    ],
  },
  {
    country: "Colombia", short: "COL", pool: "B", ranking: "#11",
    desc: "South America's baseball hotbed with growing MLB representation",
    history: "Regular WBC participant. Colombia continues to produce quality MLB players and build their international program.",
    strengths: ["Athletic, toolsy players", "MLB-caliber infield defense", "Clutch hitting ability"],
    outlook: "Colombia has the talent to compete with anyone in Pool B. Their MLB contingent gives them legitimate upset potential.",
    players: [
      { name: "Gio Urshela", mlbId: 570482, position: "3B" },
      { name: "Donovan Solano", mlbId: 456781, position: "2B" },
    ],
  },
  {
    country: "Canada", short: "CAN", pool: "B", ranking: "#12",
    desc: "North America's other baseball nation with solid MLB representation",
    history: "Regular WBC participant. Canada has produced notable MLB stars and maintains a competitive national program.",
    strengths: ["Strong starting pitching", "Solid MLB-caliber defense", "Veteran leadership"],
    outlook: "Canada brings a well-rounded roster led by quality pitching. In a tough Pool B, they'll need their arms to deliver.",
    players: [
      { name: "Josh Naylor", mlbId: 647304, position: "1B" },
      { name: "Cal Quantrill", mlbId: 615698, position: "SP" },
      { name: "Nick Pivetta", mlbId: 601713, position: "SP" },
    ],
  },
  {
    country: "Cuba", short: "CUB", pool: "C", ranking: "#5",
    desc: "The historic powerhouse of international baseball with MLB defectors powering a loaded roster",
    history: "Dominant in amateur era with Olympic and Pan American golds. Cuba has embraced allowing MLB players to represent the national team.",
    strengths: ["Elite MLB power hitters", "Deep pitching talent", "Historic baseball culture and pride"],
    outlook: "With Yordan Alvarez and Luis Robert Jr. in the lineup, Cuba has some of the most dangerous bats in the tournament. This is their best roster in decades.",
    players: [
      { name: "Yordan Alvarez", mlbId: 670541, position: "DH" },
      { name: "Luis Robert Jr.", mlbId: 673357, position: "OF" },
      { name: "Randy Arozarena", mlbId: 668227, position: "OF" },
      { name: "Yoan Moncada", mlbId: 660162, position: "3B" },
    ],
  },
  {
    country: "Chinese Taipei", short: "TPE", pool: "C", ranking: "#8",
    desc: "A passionate baseball culture with strong professional league development",
    history: "Multiple WBC appearances. Chinese Taipei has a devoted baseball following and strong CPBL development system.",
    strengths: ["Passionate fanbase and team chemistry", "CPBL-developed pitching", "Scrappy, competitive approach"],
    outlook: "Chinese Taipei will be fueled by incredible fan support and a roster built around team unity. They're always dangerous in short tournaments.",
    players: [
      { name: "Yu Chang", mlbId: 644374, position: "IF" },
    ],
  },
  {
    country: "Netherlands", short: "NED", pool: "C", ranking: "#7",
    desc: "The European powerhouse featuring Caribbean island talent from Curacao and Aruba",
    history: "Regular WBC participant. The Netherlands has been competitive thanks to talent from Curacao, Aruba, and other Caribbean territories.",
    strengths: ["Elite MLB shortstop talent", "Caribbean power hitting", "Veteran international experience"],
    outlook: "With Xander Bogaerts and Ozzie Albies, the Netherlands has a middle infield that rivals any team. Their experience makes them a dark horse.",
    players: [
      { name: "Xander Bogaerts", mlbId: 593428, position: "SS" },
      { name: "Ozzie Albies", mlbId: 645277, position: "2B" },
      { name: "Kenley Jansen", mlbId: 445276, position: "RP" },
    ],
  },
  {
    country: "Italy", short: "ITA", pool: "C", ranking: "#9",
    desc: "European contender with heritage-eligible MLB players representing their roots",
    history: "2023 WBC quarterfinalists. Italy has built a competitive program through heritage-eligible Italian-American MLB players.",
    strengths: ["Heritage-eligible MLB pitching", "Solid defensive fundamentals", "European grit and determination"],
    outlook: "Italy proved in 2023 that they can compete with the best. With strong pitching and timely hitting, another deep run is possible.",
    players: [
      { name: "Vinnie Pasquantino", mlbId: 686469, position: "1B" },
    ],
  },
  {
    country: "Panama", short: "PAN", pool: "C", ranking: "#14",
    desc: "Central America's baseball pride with a rich history of producing MLB talent",
    history: "Panama has a proud baseball tradition and has produced notable MLB players throughout history.",
    strengths: ["Athletic, talented position players", "Strong baseball culture", "Never-quit mentality"],
    outlook: "Panama will look to upset bigger names in Pool C with athletic defense and timely hitting from their talented roster.",
    players: [],
  },
  {
    country: "Dominican Republic", short: "DOM", pool: "D", ranking: "#6",
    desc: "The talent factory of baseball with the most MLB players of any country outside the USA",
    history: "2013 WBC Champions. The Dominican Republic produces more MLB players per capita than any nation on Earth.",
    strengths: ["Deepest MLB talent pool outside the USA", "Game-changing power at every position", "Elite defensive athleticism"],
    outlook: "With Juan Soto, Vladimir Guerrero Jr., Fernando Tatis Jr., and Rafael Devers, this may be the most talented roster ever assembled in WBC history.",
    players: [
      { name: "Juan Soto", mlbId: 665742, position: "OF" },
      { name: "Vladimir Guerrero Jr.", mlbId: 665489, position: "1B" },
      { name: "Fernando Tatis Jr.", mlbId: 665487, position: "SS/OF" },
      { name: "Rafael Devers", mlbId: 646240, position: "3B" },
    ],
  },
  {
    country: "Venezuela", short: "VEN", pool: "D", ranking: "#8",
    desc: "A baseball-obsessed nation with incredible MLB star power",
    history: "Regular WBC contender. Venezuela lives and breathes baseball and has produced some of the greatest players in MLB history.",
    strengths: ["Superstar-caliber lineup", "Deep bullpen talent", "Passionate, emotional play style"],
    outlook: "Ronald Acuna Jr. and Jose Altuve headline a star-studded Venezuelan roster that has the talent to beat anyone on any given day.",
    players: [
      { name: "Ronald Acuna Jr.", mlbId: 660670, position: "OF" },
      { name: "Jose Altuve", mlbId: 514888, position: "2B" },
      { name: "Salvador Perez", mlbId: 521692, position: "C" },
    ],
  },
  {
    country: "Puerto Rico", short: "PUR", pool: "D", ranking: "#7",
    desc: "The island of baseball with passionate fans and elite MLB shortstops",
    history: "2013 and 2017 WBC runners-up. Puerto Rico has been one of the most consistent WBC performers with incredible fan support.",
    strengths: ["Elite MLB shortstop talent", "Electric fanbase and energy", "Veteran tournament experience"],
    outlook: "Francisco Lindor and Carlos Correa give Puerto Rico arguably the best shortstop duo in the tournament. Their fans bring unmatched energy.",
    players: [
      { name: "Francisco Lindor", mlbId: 596019, position: "SS" },
      { name: "Carlos Correa", mlbId: 621043, position: "SS" },
      { name: "Marcus Stroman", mlbId: 573186, position: "SP" },
    ],
  },
  {
    country: "Israel", short: "ISR", pool: "D", ranking: "#17",
    desc: "The underdog story of the WBC with heritage-eligible MLB talent",
    history: "2017 WBC surprise team, advancing to the second round. Israel has built a competitive program through heritage eligibility.",
    strengths: ["Heritage-eligible MLB pitching", "Underdog motivation", "Strong team chemistry"],
    outlook: "Israel will look to Dean Kremer and Joc Pederson to lead another surprising run. They've proven they can compete with the best.",
    players: [
      { name: "Dean Kremer", mlbId: 665152, position: "SP" },
      { name: "Joc Pederson", mlbId: 592626, position: "DH/OF" },
    ],
  },
  {
    country: "Nicaragua", short: "NIC", pool: "D", ranking: "#18",
    desc: "Central America's emerging baseball nation hungry to prove themselves",
    history: "Growing WBC presence. Nicaragua has a passionate baseball culture and is developing through regional tournaments.",
    strengths: ["Passionate baseball culture", "Competitive pitching", "Team-first mentality"],
    outlook: "Nicaragua faces a tough Pool D but will bring energy and heart. Every game is an opportunity to showcase Nicaraguan baseball to the world.",
    players: [
      { name: "Jonathan Loaisiga", mlbId: 642528, position: "RP" },
    ],
  },
];

const POOLS = {
  A: TEAMS.filter((t) => t.pool === "A"),
  B: TEAMS.filter((t) => t.pool === "B"),
  C: TEAMS.filter((t) => t.pool === "C"),
  D: TEAMS.filter((t) => t.pool === "D"),
};

// ─── Video Script Generators ─────────────────────────────────

function createTeamVideoScript(team) {
  const p1 = team.players[0];
  const p2 = team.players[1];

  const slides = [
    {
      type: "title",
      heading: team.country,
      subheading: `WBC 2026 - Pool ${team.pool} | ${team.ranking}`,
      narration: `Welcome to GlobalBaseball. Today we preview ${team.country} heading into the 2026 World Baseball Classic. Ranked ${team.ranking} in the world, they'll compete in Pool ${team.pool}.`,
    },
    {
      type: "team",
      heading: `${team.country} Overview`,
      subheading: team.ranking + " World Ranking",
      points: team.strengths,
      playerImages: team.players.slice(0, 2).map((p) => ({ name: p.name, mlbId: p.mlbId, position: p.position })),
      narration: `${team.desc}. ${team.strengths.join(". ")}.`,
    },
  ];

  if (p1) {
    slides.push({
      type: "player",
      heading: p1.name,
      subheading: `${team.country} - ${p1.position}`,
      playerName: p1.name,
      mlbId: p1.mlbId,
      position: p1.position,
      points: [`Key player for ${team.country}`, `Position: ${p1.position}`, `Expected to lead the roster in 2026`],
      narration: `${p1.name} is the headliner for ${team.country}. Playing ${p1.position}, ${p1.name} brings elite talent and will be critical to ${team.country}'s success at the 2026 World Baseball Classic.`,
    });
  }

  slides.push({
    type: "stats",
    heading: "WBC Track Record",
    subheading: team.country,
    points: [team.history.split(". ")[0], team.outlook.split(". ")[0]],
    narration: `${team.history} ${team.outlook}`,
  });

  slides.push({
    type: "outro",
    heading: "Subscribe for WBC 2026 Coverage",
    subheading: `More ${team.country} content coming soon`,
    narration: `That's our preview of ${team.country} at the 2026 World Baseball Classic. Subscribe to GlobalBaseball for more WBC coverage, and hit the bell for notifications when new videos drop.`,
  });

  return {
    title: `${team.country} WBC 2026 Preview | World Baseball Classic Pool ${team.pool}`,
    description: `Complete preview of ${team.country} heading into the 2026 World Baseball Classic. Key players, strengths, and predictions for Pool ${team.pool}.`,
    tags: ["WBC", "WBC 2026", "World Baseball Classic", team.country, "Baseball", "Preview", `Pool ${team.pool}`],
    slides,
  };
}

function createMatchupVideoScript(teamA, teamB, pool) {
  const slides = [
    {
      type: "title",
      heading: `${teamA.country} vs ${teamB.country}`,
      subheading: `WBC 2026 - Pool ${pool}`,
      narration: `Welcome to GlobalBaseball. It's ${teamA.country} versus ${teamB.country} in Pool ${pool} of the 2026 World Baseball Classic. Let's break down this matchup.`,
    },
    {
      type: "team",
      heading: teamA.country,
      subheading: `${teamA.ranking} | Pool ${pool}`,
      points: teamA.strengths.slice(0, 3),
      playerImages: teamA.players.slice(0, 2).map((p) => ({ name: p.name, mlbId: p.mlbId, position: p.position })),
      narration: `${teamA.country} comes in ranked ${teamA.ranking}. ${teamA.desc}. Their key strengths include ${teamA.strengths.slice(0, 2).join(" and ").toLowerCase()}.`,
    },
    {
      type: "team",
      heading: teamB.country,
      subheading: `${teamB.ranking} | Pool ${pool}`,
      points: teamB.strengths.slice(0, 3),
      playerImages: teamB.players.slice(0, 2).map((p) => ({ name: p.name, mlbId: p.mlbId, position: p.position })),
      narration: `On the other side, ${teamB.country} is ranked ${teamB.ranking}. ${teamB.desc}. They bring ${teamB.strengths[0].toLowerCase()} and ${(teamB.strengths[1] || teamB.strengths[0]).toLowerCase()}.`,
    },
  ];

  // Key matchup slide - use top players from each team
  const pA = teamA.players[0];
  const pB = teamB.players[0];
  if (pA && pB) {
    slides.push({
      type: "matchup_players",
      heading: "Key Matchup",
      subheading: `${pA.name} vs ${pB.name}`,
      playerImages: [
        { name: pA.name, mlbId: pA.mlbId, position: teamA.country },
        { name: pB.name, mlbId: pB.mlbId, position: teamB.country },
      ],
      points: [`${teamA.country} ${pA.position} vs ${teamB.country} ${pB.position}`],
      narration: `The matchup to watch: ${pA.name} of ${teamA.country} against ${pB.name} of ${teamB.country}. Two elite talents on the biggest international stage.`,
    });
  } else {
    slides.push({
      type: "stats",
      heading: "Prediction",
      subheading: `${teamA.country} vs ${teamB.country}`,
      points: [`${teamA.country}: ${teamA.strengths[0]}`, `${teamB.country}: ${teamB.strengths[0]}`],
      narration: `This matchup comes down to ${teamA.country}'s ${teamA.strengths[0].toLowerCase()} against ${teamB.country}'s ${teamB.strengths[0].toLowerCase()}. It should be a great game.`,
    });
  }

  slides.push({
    type: "outro",
    heading: "Subscribe for WBC 2026 Coverage",
    subheading: `Full Pool ${pool} coverage on GlobalBaseball`,
    narration: `Don't miss any WBC 2026 action. Subscribe to GlobalBaseball for previews, recaps, and analysis of every Pool ${pool} game.`,
  });

  return {
    title: `${teamA.country} vs ${teamB.country} | WBC 2026 Pool ${pool} Preview`,
    description: `Preview of ${teamA.country} vs ${teamB.country} in Pool ${pool} of the 2026 World Baseball Classic.`,
    tags: ["WBC", "WBC 2026", teamA.country, teamB.country, "Baseball", "Preview", `Pool ${pool}`],
    slides,
  };
}

// ─── Article Content Generators ──────────────────────────────

const TEAM_OPENERS = [
  (t) => `As the 2026 World Baseball Classic draws closer, all eyes turn to ${t.country} as they prepare to compete in Pool ${t.pool}. Ranked ${t.ranking} in the world, ${t.desc.charAt(0).toLowerCase() + t.desc.slice(1)}.`,
  (t) => `${t.country} enters the 2026 World Baseball Classic with serious ambitions. Placed in Pool ${t.pool} and ranked ${t.ranking} globally, this team has the talent and determination to make a deep run.`,
  (t) => `The 2026 World Baseball Classic is almost here, and ${t.country} is ready. ${t.desc}. Competing in Pool ${t.pool}, they'll need to be at their best from day one.`,
  (t) => `When Pool ${t.pool} play begins at the 2026 WBC, ${t.country} will be one of the teams to watch. Ranked ${t.ranking} in the world, they bring a unique combination of talent and determination to the tournament.`,
];

const MATCHUP_OPENERS = [
  (a, b, p) => `One of the most intriguing Pool ${p} matchups at the 2026 World Baseball Classic features ${a.country} against ${b.country}. This clash of styles promises to deliver excitement from the first pitch.`,
  (a, b, p) => `When ${a.country} takes on ${b.country} in Pool ${p} of the 2026 WBC, expect a competitive battle between two programs with very different identities but shared ambitions.`,
  (a, b, p) => `Pool ${p} action heats up when ${a.country} meets ${b.country} at the 2026 World Baseball Classic. Both teams will be desperate for a win as they fight for a spot in the next round.`,
  (a, b, p) => `${a.country} versus ${b.country} is a Pool ${p} showdown that could define both teams' WBC 2026 tournaments. Here's everything you need to know about this must-watch matchup.`,
];

function generateTeamArticleHTML(team, index) {
  const opener = TEAM_OPENERS[index % TEAM_OPENERS.length](team);
  const playerSection = team.players.length > 0
    ? `<h3>Key Players to Watch</h3>\n${team.players.map((p) => `<p><strong>${p.name}</strong> (${p.position}) will be critical to ${team.country}'s success. As one of their top talents, ${p.name} brings the kind of skill and experience that can change games at the international level.</p>`).join("\n")}`
    : `<h3>Rising Talent</h3>\n<p>${team.country} may not have a roster full of MLB household names, but their domestic league has produced competitive players who thrive in the international format. Watch for breakout performances from their top domestic talent.</p>`;

  return `<h2>${team.country}: Complete WBC 2026 Preview</h2>
<p>${opener}</p>

<h3>Team Overview</h3>
<p>${team.history}</p>

<h3>Key Strengths</h3>
<ul>
${team.strengths.map((s) => `  <li><strong>${s}</strong></li>`).join("\n")}
</ul>

${playerSection}

<h3>Pool ${team.pool} Outlook</h3>
<p>${team.outlook}</p>

<h3>Prediction</h3>
<p>${team.country} has the pieces to be competitive in Pool ${team.pool}. ${team.players.length >= 3 ? `With star power like ${team.players[0].name} and ${team.players[1].name}, they have the individual talent to win any single game.` : "Their team chemistry and determination will be their greatest assets."} The question is whether they can sustain their level over the entire pool play schedule and secure a spot in the next round.</p>

<blockquote><p>"${team.country} is a team that nobody should overlook at the 2026 World Baseball Classic." - GlobalBaseball Analysis</p></blockquote>

<p>Stay tuned to GlobalBaseball for complete coverage of ${team.country} throughout the 2026 World Baseball Classic, including game recaps, player spotlights, and real-time analysis.</p>`;
}

function generateMatchupArticleHTML(teamA, teamB, pool, index) {
  const opener = MATCHUP_OPENERS[index % MATCHUP_OPENERS.length](teamA, teamB, pool);
  const pA = teamA.players[0];
  const pB = teamB.players[0];

  const matchupSection = pA && pB
    ? `<h3>Key Matchup: ${pA.name} vs ${pB.name}</h3>\n<p>The individual battle to watch is ${pA.name} (${teamA.country}) against ${pB.name} (${teamB.country}). Both are elite talents who thrive on the big stage, and their performance could tip the balance in this game.</p>`
    : `<h3>What to Watch</h3>\n<p>With both teams bringing different styles to the table, the key will be which team can impose their game plan. ${teamA.country}'s ${teamA.strengths[0].toLowerCase()} will be tested against ${teamB.country}'s ${teamB.strengths[0].toLowerCase()}.</p>`;

  const favorite = parseInt(teamA.ranking.replace("#", "")) < parseInt(teamB.ranking.replace("#", "")) ? teamA : teamB;
  const underdog = favorite === teamA ? teamB : teamA;

  return `<h2>${teamA.country} vs ${teamB.country}: WBC 2026 Pool ${pool} Preview</h2>
<p>${opener}</p>

<h3>${teamA.country} (${teamA.ranking})</h3>
<p>${teamA.desc}. Coming into this matchup, ${teamA.country} will rely on their ${teamA.strengths[0].toLowerCase()}. ${teamA.outlook.split(". ")[0]}.</p>
${teamA.players.length > 0 ? `<p><strong>Players to watch:</strong> ${teamA.players.map((p) => `${p.name} (${p.position})`).join(", ")}</p>` : ""}

<h3>${teamB.country} (${teamB.ranking})</h3>
<p>${teamB.desc}. ${teamB.country} will counter with ${teamB.strengths[0].toLowerCase()}. ${teamB.outlook.split(". ")[0]}.</p>
${teamB.players.length > 0 ? `<p><strong>Players to watch:</strong> ${teamB.players.map((p) => `${p.name} (${p.position})`).join(", ")}</p>` : ""}

${matchupSection}

<h3>Prediction</h3>
<p>${favorite.country} enters as the favorite based on world rankings, but the WBC has proven time and again that rankings don't decide games. ${underdog.country} has the talent and motivation to pull off an upset. Expect a closely contested game that could come down to the final innings.</p>

<blockquote><p>GlobalBaseball Prediction: ${favorite.country} in a close one, but don't count out ${underdog.country}.</p></blockquote>

<p>Follow GlobalBaseball for live coverage and instant analysis of every WBC 2026 Pool ${pool} game.</p>`;
}

// ─── Video Generation Pipeline ───────────────────────────────

function collectPlayerIds(slides) {
  const players = [];
  const seen = new Set();
  for (const slide of slides) {
    for (const img of slide.playerImages || []) {
      if (img.mlbId && !seen.has(img.mlbId)) {
        seen.add(img.mlbId);
        players.push({ mlb_id: img.mlbId, full_name: img.name });
      }
    }
    if (slide.mlbId && !seen.has(slide.mlbId)) {
      seen.add(slide.mlbId);
      players.push({ mlb_id: slide.mlbId, full_name: slide.playerName || slide.heading });
    }
  }
  return players;
}

async function generateSingleVideo(script, sessionId, clips, headshots) {
  log(`  Generating: "${script.title}" (${script.slides.length} slides)`);

  try {
    // Generate audio
    const audioFiles = await generateSlideAudio(script.slides, sessionId);

    // Generate overlay images
    const overlayImages = await generateOverlayImages(script.slides, sessionId, headshots);

    // Compose broadcast video
    const clipPaths = clips.map((c) => c.path);
    const videoPath = await composeBroadcastVideo(overlayImages, audioFiles, clipPaths, `${sessionId}.mp4`);

    log(`  Done: ${videoPath}`);
    return videoPath;
  } catch (err) {
    log(`  ERROR generating ${sessionId}: ${err.message}`);
    return null;
  }
}

// ─── Article Insertion ───────────────────────────────────────

async function insertArticle(slug, title, content, excerpt, type, tags) {
  try {
    const { error } = await supabase.from("articles").upsert(
      {
        slug,
        title,
        content,
        excerpt,
        type,
        status: "published",
        league: "wbc",
        tags,
        meta_title: `${title} | GlobalBaseball`,
        meta_description: excerpt,
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw error;
    log(`  Article published: /blog/${slug}`);
    return true;
  } catch (err) {
    log(`  Article error (${slug}): ${err.message}`);
    return false;
  }
}

// ─── Main Batch ──────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const doTeams = !args.includes("--matchups-only") && !args.includes("--articles-only");
  const doMatchups = !args.includes("--teams-only") && !args.includes("--articles-only");
  const doArticles = true; // Always generate articles
  const doVideos = !args.includes("--articles-only");

  log("=========================================");
  log("  GlobalBaseball WBC 2026 Batch Generator");
  log("=========================================");
  log(`  Teams: ${TEAMS.length}`);
  log(`  Pools: ${Object.keys(POOLS).length}`);
  log(`  Generate team videos: ${doTeams && doVideos}`);
  log(`  Generate matchup videos: ${doMatchups && doVideos}`);
  log(`  Generate articles: ${doArticles}`);

  // Step 1: Pre-download all player headshots
  log("\n--- Step 1: Downloading all player headshots ---");
  const allPlayers = [];
  const seenIds = new Set();
  for (const team of TEAMS) {
    for (const p of team.players) {
      if (p.mlbId && !seenIds.has(p.mlbId)) {
        seenIds.add(p.mlbId);
        allPlayers.push({ mlb_id: p.mlbId, full_name: p.name });
      }
    }
  }
  const headshots = allPlayers.length > 0 ? await downloadPlayerHeadshots(allPlayers) : {};
  log(`  Headshots ready: ${Object.keys(headshots).length / 2} players`);

  // Step 2: Pre-cache WBC schedule (speeds up per-team lookups)
  let fallbackClips = [];
  if (doVideos) {
    log("\n--- Step 2: Preparing WBC highlight clip pipeline ---");
    log("  Clips will be fetched per-team/matchup for relevant footage");
    // Pre-download a small fallback set for teams with no WBC 2023 history
    fallbackClips = await getCuratedWBCClips(5);
    log(`  Fallback clips ready: ${fallbackClips.length}`);
  }

  // Step 3: Generate team content
  let teamVideos = 0;
  let teamArticles = 0;
  if (doTeams || doArticles) {
    log("\n--- Step 3: Team Previews ---");
    for (let i = 0; i < TEAMS.length; i++) {
      const team = TEAMS[i];
      log(`\n  [${i + 1}/${TEAMS.length}] ${team.country} (Pool ${team.pool})`);

      // Video - fetch clips specific to this team's WBC 2023 games
      if (doTeams && doVideos) {
        const script = createTeamVideoScript(team);
        const sessionId = slugify(`team-${team.country}-wbc-2026`);
        log(`  Fetching ${team.country}-specific WBC clips...`);
        const teamClips = await getTeamClips(team.country, 5);
        const clipsToUse = teamClips.length > 0 ? teamClips : fallbackClips;
        if (clipsToUse.length > 0) {
          await generateSingleVideo(script, sessionId, clipsToUse, headshots);
          teamVideos++;
        } else {
          log(`  Skipping video for ${team.country} - no clips available`);
        }
      }

      // Article
      if (doArticles) {
        const html = generateTeamArticleHTML(team, i);
        const slug = slugify(`${team.country}-wbc-2026-preview`);
        const title = `${team.country} WBC 2026 Preview: Complete Team Analysis`;
        const excerpt = `${team.desc}. Here's everything you need to know about ${team.country} heading into the 2026 World Baseball Classic.`;
        await insertArticle(slug, title, html, excerpt, "preview", ["wbc", "2026", "preview", team.short.toLowerCase(), team.country.toLowerCase()]);
        teamArticles++;
      }
    }
  }

  // Step 4: Generate matchup content
  let matchupVideos = 0;
  let matchupArticles = 0;
  if (doMatchups || doArticles) {
    log("\n--- Step 4: Pool Matchup Previews ---");
    let matchupIndex = 0;

    for (const [poolName, poolTeams] of Object.entries(POOLS)) {
      log(`\n  Pool ${poolName}:`);

      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          const teamA = poolTeams[i];
          const teamB = poolTeams[j];
          matchupIndex++;
          log(`\n  [Match ${matchupIndex}] ${teamA.country} vs ${teamB.country} (Pool ${poolName})`);

          // Video - fetch clips specific to this matchup's teams
          if (doMatchups && doVideos) {
            const script = createMatchupVideoScript(teamA, teamB, poolName);
            const sessionId = slugify(`${teamA.country}-vs-${teamB.country}-pool-${poolName}-wbc-2026`);
            log(`  Fetching ${teamA.country} vs ${teamB.country} WBC clips...`);
            const matchClips = await getMatchupClips(teamA.country, teamB.country, 5);
            const clipsToUse = matchClips.length > 0 ? matchClips : fallbackClips;
            if (clipsToUse.length > 0) {
              await generateSingleVideo(script, sessionId, clipsToUse, headshots);
              matchupVideos++;
            } else {
              log(`  Skipping video for ${teamA.country} vs ${teamB.country} - no clips available`);
            }
          }

          // Article
          if (doArticles) {
            const html = generateMatchupArticleHTML(teamA, teamB, poolName, matchupIndex);
            const slug = slugify(`${teamA.country}-vs-${teamB.country}-wbc-2026-pool-${poolName}-preview`);
            const title = `${teamA.country} vs ${teamB.country}: WBC 2026 Pool ${poolName} Preview`;
            const excerpt = `Complete preview of ${teamA.country} vs ${teamB.country} in Pool ${poolName} of the 2026 World Baseball Classic. Key matchups, predictions, and analysis.`;
            await insertArticle(slug, title, html, excerpt, "preview", ["wbc", "2026", "preview", teamA.short.toLowerCase(), teamB.short.toLowerCase(), `pool-${poolName.toLowerCase()}`]);
            matchupArticles++;
          }
        }
      }
    }
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
  log("\n=========================================");
  log("  BATCH COMPLETE");
  log("=========================================");
  log(`  Team videos: ${teamVideos}`);
  log(`  Team articles: ${teamArticles}`);
  log(`  Matchup videos: ${matchupVideos}`);
  log(`  Matchup articles: ${matchupArticles}`);
  log(`  Total videos: ${teamVideos + matchupVideos}`);
  log(`  Total articles: ${teamArticles + matchupArticles}`);
  log(`  Time elapsed: ${elapsed} minutes`);
  log("=========================================");
}

main().catch((err) => {
  log(`FATAL ERROR: ${err.message}`);
  console.error(err);
  process.exit(1);
});
