export const monetizationConfig = {
  adsense: {
    publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "",
    slots: {
      headerBanner: process.env.NEXT_PUBLIC_AD_SLOT_HEADER || "",
      sidebarRect: process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR || "",
      inArticle: process.env.NEXT_PUBLIC_AD_SLOT_IN_ARTICLE || "",
      footerBanner: process.env.NEXT_PUBLIC_AD_SLOT_FOOTER || "",
    },
  },
  affiliates: {
    amazon: {
      tag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "",
      enabled: !!process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG,
    },
  },
  newsletter: {
    enabled: true,
    provider: "resend" as const,
    fromEmail: "newsletter@globalbaseball.com",
    fromName: "GlobalBaseball",
  },
};

export interface AffiliateProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  price?: string;
  category: "equipment" | "apparel" | "books" | "memorabilia";
}

export const affiliateProducts: AffiliateProduct[] = [
  {
    id: "wbc-cap",
    title: "Official WBC Team Cap",
    description: "Show your support with an official World Baseball Classic team cap.",
    imageUrl: "/images/affiliates/wbc-cap.jpg",
    affiliateUrl: "#",
    price: "$34.99",
    category: "apparel",
  },
  {
    id: "baseball-glove",
    title: "Premium Baseball Glove",
    description: "Professional-grade baseball glove used by international players.",
    imageUrl: "/images/affiliates/glove.jpg",
    affiliateUrl: "#",
    price: "$149.99",
    category: "equipment",
  },
  {
    id: "wbc-jersey",
    title: "WBC Replica Jersey",
    description: "Authentic replica jerseys from your favorite national team.",
    imageUrl: "/images/affiliates/jersey.jpg",
    affiliateUrl: "#",
    price: "$89.99",
    category: "apparel",
  },
];
