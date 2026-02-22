export const siteConfig = {
  name: "GlobalBaseball",
  description: "Your source for international baseball coverage, stats, and analysis. Covering the World Baseball Classic, Premier12, and leagues worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalbaseball.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/globalbaseball",
    youtube: "https://youtube.com/@globalbaseballhq",
  },
  creator: "GlobalBaseball",
};

export const navItems = [
  { label: "Home", href: "/" },
  { label: "WBC", href: "/wbc" },
  { label: "Schedule", href: "/wbc/schedule" },
  { label: "Standings", href: "/wbc/standings" },
  { label: "Teams", href: "/wbc/teams" },
  { label: "Videos", href: "/videos" },
  { label: "Blog", href: "/blog" },
] as const;
